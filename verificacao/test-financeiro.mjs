// Node 22; usa o TypeScript do projeto. Regras de valores do financeiro e
// da agenda com banco simulado; não acessa nada externo.
// Uso: node --test verificacao/test-financeiro.mjs   (a partir da raiz do projeto)
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const root = resolve(process.argv[2] || '.');
const requireFromProject = createRequire(resolve(root, 'package.json'));
const typescript = requireFromProject('typescript');
const { Prisma, FinancialStatus, ReceivableType, RpvStatus, RpvType, TaskStatus } = requireFromProject('@prisma/client');

function load(file, names, deps = {}) {
  const ts = readFileSync(resolve(root, 'src', file), 'utf8');
  const js = typescript.transpileModule(ts, { compilerOptions: { target: typescript.ScriptTarget.ES2022, module: typescript.ModuleKind.ESNext } }).outputText.replace(/^export\s*\{\s*\};?\s*$/gm, '').replace(/^import[\s\S]*?;\s*/gm, '').replace(/\bexport\s+/g, '');
  return runInNewContext(`${js}\n;({${names.join(',')}})`, { console, FormData, URL, ...deps });
}

const plain = (value) => JSON.parse(JSON.stringify(value));
class ActionError extends Error {}
const runAction = async (handler) => {
  try { return await handler(); } catch (error) {
    if (error instanceof ActionError) return { actionError: error.message };
    return { actionError: 'GENERICO', cause: error };
  }
};
const access = async () => ({ workspace: { id: 'w1' }, user: { id: 'u1' } });

const rules = load('features/finance/lib/rpv-rules.ts', ['roundMoney', 'getRpvContractualFee', 'isContractualFeeFromRate', 'RPV_LINKED_RECEIVABLE_MESSAGE']);

// ---------- 1. Honorários da RPV ----------
test('honorários: valor digitado prevalece; sem ele, vale o percentual, com centavos arredondados', () => {
  assert.equal(rules.getRpvContractualFee({ grossAmount: 10000, contractualFeeRate: 30, contractualFeeValue: null }), 3000);
  assert.equal(rules.getRpvContractualFee({ grossAmount: 10000, contractualFeeRate: 30, contractualFeeValue: 2500 }), 2500);
  assert.equal(rules.getRpvContractualFee({ grossAmount: 1234.57, contractualFeeRate: 30, contractualFeeValue: null }), 370.37);
  assert.equal(rules.getRpvContractualFee({ grossAmount: 10000, contractualFeeRate: null, contractualFeeValue: null }), 0);
});

test('honorários: valor antigo calculado pelo percentual é reconhecido como não digitado', () => {
  assert.equal(rules.isContractualFeeFromRate({ grossAmount: 10000, contractualFeeRate: 30, contractualFeeValue: 3000 }), true);
  assert.equal(rules.isContractualFeeFromRate({ grossAmount: 1234.57, contractualFeeRate: 30, contractualFeeValue: 370.37 }), true);
  assert.equal(rules.isContractualFeeFromRate({ grossAmount: 10000, contractualFeeRate: 30, contractualFeeValue: 2500 }), false);
  assert.equal(rules.isContractualFeeFromRate({ grossAmount: 10000, contractualFeeRate: null, contractualFeeValue: 3000 }), false);
});

function rpvInput(override = {}) {
  return { rpvId: 'r1', caseId: 'c1', type: RpvType.RPV, requisitionNumber: null, court: null, grossAmount: 10000, contractualFeeRate: 30, contractualFeeValue: null, sucumbencyFeeValue: null, expectedPaymentDate: null, paidAt: null, bank: null, status: RpvStatus.AGUARDANDO_EXPEDICAO, notes: null, ...override };
}

function loadRpvAction(file, name, schemaName, input) {
  const saved = [];
  const tx = {
    rpv: {
      create: async ({ data }) => { saved.push(data); return { id: 'r1' }; },
      findFirst: async () => ({ id: 'r1' }),
      update: async ({ data }) => { saved.push(data); return { id: 'r1' }; },
    },
  };
  const action = load(file, [name], {
    requireWorkspacePermission: access, runAction, ActionError, Prisma, RpvStatus,
    [schemaName]: { safeParse: () => ({ success: true, data: input }) },
    prisma: { case: { findFirst: async () => ({ id: 'c1' }) }, $transaction: async (fn) => fn(tx) },
    syncRpvReceivables: async () => ({ clientId: 'cl1', caseId: 'c1' }),
    revalidatePath: () => {},
    getRpvContractualFee: rules.getRpvContractualFee,
  })[name];
  return { run: () => action(new FormData()), saved };
}

for (const [file, name, schemaName] of [
  ['features/finance/actions/create-rpv.ts', 'createRpv', 'createRpvSchema'],
  ['features/finance/actions/update-rpv.ts', 'updateRpv', 'updateRpvSchema'],
]) {
  test(`${name}: grava só o valor digitado e calcula o líquido do cliente`, async () => {
    const byRate = loadRpvAction(file, name, schemaName, rpvInput({ grossAmount: 12000, contractualFeeRate: 20 }));
    assert.deepEqual(plain(await byRate.run()), { success: true });
    assert.equal(byRate.saved[0].contractualFeeValue, null, 'percentual continua mandando nos honorários');
    assert.equal(Number(byRate.saved[0].contractualFeeRate), 20);
    assert.equal(Number(byRate.saved[0].clientNetAmount), 9600);

    const typed = loadRpvAction(file, name, schemaName, rpvInput({ contractualFeeValue: 2500 }));
    await typed.run();
    assert.equal(Number(typed.saved[0].contractualFeeValue), 2500);
    assert.equal(Number(typed.saved[0].clientNetAmount), 7500);

    const tooHigh = loadRpvAction(file, name, schemaName, rpvInput({ contractualFeeValue: 10001 }));
    assert.match((await tooHigh.run()).actionError, /não podem superar/);
    assert.equal(tooHigh.saved.length, 0);
  });
}

// ---------- 2. Recebimentos gerados por RPV ----------
function receivableRow(override = {}) {
  return { id: 'rec1', clientId: 'cl1', caseId: 'c1', rpvId: 'r1', type: ReceivableType.HONORARIO_CONTRATUAL, totalAmount: new Prisma.Decimal(3000), paidAmount: new Prisma.Decimal(3000), status: FinancialStatus.PAGO, dueDate: null, originalDueDate: null, receivedAt: new Date(), installmentGroupId: null, ...override };
}

function loadReceivableAction(file, name, schemaName, row, input) {
  const calls = { update: [], delete: 0 };
  const action = load(file, [name], {
    requireWorkspacePermission: access, runAction, ActionError, Prisma, FinancialStatus,
    RPV_LINKED_RECEIVABLE_MESSAGE: rules.RPV_LINKED_RECEIVABLE_MESSAGE,
    [schemaName]: { safeParse: () => ({ success: true, data: input }) },
    prisma: {
      receivable: {
        findFirst: async () => row,
        update: async ({ data }) => { calls.update.push(data); return row; },
        delete: async () => { calls.delete += 1; },
        updateMany: async () => {}, deleteMany: async () => {}, findMany: async () => [],
      },
      case: { findFirst: async () => ({ id: input.caseId }) },
    },
    revalidatePath: () => {},
  })[name];
  return { run: () => action(new FormData()), calls };
}

test('recebimento de RPV: estorno, cancelamento e exclusão só pela RPV', async () => {
  const reverse = loadReceivableAction('features/finance/actions/reverse-receivable-payment.ts', 'reverseReceivablePayment', 'reverseReceivablePaymentSchema', receivableRow(), { receivableId: 'rec1' });
  assert.equal((await reverse.run()).actionError, rules.RPV_LINKED_RECEIVABLE_MESSAGE);
  assert.equal(reverse.calls.update.length, 0);

  for (const mode of ['CANCEL', 'DELETE']) {
    const remove = loadReceivableAction('features/finance/actions/remove-receivable.ts', 'removeReceivable', 'removeReceivableSchema', receivableRow({ status: FinancialStatus.CANCELADO, paidAmount: new Prisma.Decimal(0) }), { receivableId: 'rec1', mode, scope: 'SINGLE' });
    assert.equal((await remove.run()).actionError, rules.RPV_LINKED_RECEIVABLE_MESSAGE, mode);
    assert.equal(remove.calls.update.length + remove.calls.delete, 0);
  }

  const manual = loadReceivableAction('features/finance/actions/reverse-receivable-payment.ts', 'reverseReceivablePayment', 'reverseReceivablePaymentSchema', receivableRow({ rpvId: null }), { receivableId: 'rec1' });
  assert.deepEqual(plain(await manual.run()), { success: true });
  assert.equal(Number(manual.calls.update[0].paidAmount), 0, 'recebimento manual continua estornável');
});

test('recebimento de RPV: descrição e observações editáveis; valor, tipo e caso não', async () => {
  const base = { receivableId: 'rec1', caseId: 'c1', description: 'Honorários', type: ReceivableType.HONORARIO_CONTRATUAL, totalAmount: 3000, dueDate: null, notes: 'Pago no banco' };
  const notes = loadReceivableAction('features/finance/actions/update-receivable.ts', 'updateReceivable', 'updateReceivableSchema', receivableRow(), base);
  assert.deepEqual(plain(await notes.run()), { success: true });
  assert.equal(notes.calls.update[0].notes, 'Pago no banco');

  for (const change of [{ totalAmount: 3500 }, { type: ReceivableType.HONORARIO_SUCUMBENCIAL }, { caseId: null }]) {
    const blocked = loadReceivableAction('features/finance/actions/update-receivable.ts', 'updateReceivable', 'updateReceivableSchema', receivableRow(), { ...base, ...change });
    assert.equal((await blocked.run()).actionError, rules.RPV_LINKED_RECEIVABLE_MESSAGE, JSON.stringify(change));
    assert.equal(blocked.calls.update.length, 0);
  }
});

// ---------- 3. Mensagem de lançamentos duplicados ----------
test('RPV paga com dois recebimentos iguais: a explicação chega ao usuário', async () => {
  const { syncRpvReceivables } = load('features/finance/lib/sync-rpv-receivables.ts', ['syncRpvReceivables'], { ActionError, FinancialStatus, ReceivableType, RpvStatus, RpvType });
  const tx = {
    rpv: { findFirst: async () => ({ id: 'r1', type: RpvType.RPV, requisitionNumber: '123', grossAmount: new Prisma.Decimal(10000), contractualFeeRate: new Prisma.Decimal(30), contractualFeeValue: null, sucumbencyFeeValue: null, status: RpvStatus.PAGA, paidAt: new Date(), caseId: 'c1', case: { clientId: 'cl1' } }) },
    receivable: { findFirst: async () => null, findMany: async () => [{ id: 'a' }, { id: 'b' }] },
  };
  const result = await runAction(() => syncRpvReceivables({ tx, workspaceId: 'w1', rpvId: 'r1' }));
  assert.match(result.actionError, /mais de um recebimento de honorários contratuais/);
});

// ---------- 4. Pagamento parcial vencido ----------
test('pagamento parcial vencido aparece como atrasado; no prazo continua parcial', () => {
  const { getEffectiveFinancialStatus } = load('features/finance/lib/receivable-display.ts', ['getEffectiveFinancialStatus']);
  assert.equal(getEffectiveFinancialStatus('PARCIAL', '2000-01-10T12:00:00.000Z'), 'ATRASADO');
  assert.equal(getEffectiveFinancialStatus('PARCIAL', '2999-01-10T12:00:00.000Z'), 'PARCIAL');
  assert.equal(getEffectiveFinancialStatus('PAGO', '2000-01-10T12:00:00.000Z'), 'PAGO');
});

// ---------- 5 e 6. Agenda ----------
test('agenda: total real de atrasadas e quadro "Hoje" independentes do mês exibido', async () => {
  const queries = [];
  const taskRow = (id, dueDate) => ({ id, clientId: null, caseId: null, title: id, description: null, type: 'OUTRO', status: 'PENDENTE', startsAt: null, dueDate, completedAt: null, location: null, googleEventId: null, createdAt: dueDate, updatedAt: dueDate, client: null, case: null });
  const { getAgendaData } = load('features/agenda/services/get-agenda-data.ts', ['getAgendaData'], {
    TaskStatus,
    getDefaultWorkspace: async () => ({ id: 'w1' }),
    prisma: {
      task: {
        findMany: async ({ where }) => {
          queries.push(where);
          if (where.status?.not) return [taskRow('hoje', new Date())];
          if (where.dueDate?.lt) return Array.from({ length: 8 }, (_, index) => taskRow(`atrasada-${index}`, new Date('2026-01-01T12:00:00Z')));
          return [];
        },
        count: async ({ where }) => { queries.push({ count: where }); return 23; },
      },
      client: { findMany: async () => [] },
    },
  });
  const data = await getAgendaData('2030-05');
  assert.equal(data.monthKey, '2030-05');
  assert.equal(data.tasks.length, 0, 'mês distante sem tarefas');
  assert.deepEqual(plain(data.todayTasks.map((task) => task.id)), ['hoje']);
  assert.equal(data.overdueTasks.length, 8);
  assert.equal(data.overdueCount, 23);

  const todayQuery = queries.find((where) => where.status?.not);
  const start = todayQuery.OR[0].startsAt.gte;
  const end = todayQuery.OR[0].startsAt.lt;
  assert.equal(end.getTime() - start.getTime(), 24 * 60 * 60 * 1000, 'janela de um dia');
  assert.equal(start.toISOString().slice(11, 16), '03:00', 'meia-noite em Brasília');
  assert.equal(todayQuery.status.not, TaskStatus.CANCELADA);
  const countQuery = queries.find((entry) => entry.count).count;
  assert.deepEqual(plain(countQuery.status.notIn), [TaskStatus.CONCLUIDA, TaskStatus.CANCELADA]);
});
