// Node 22; usa o TypeScript do projeto. Assinatura do LexFlow pelo Asaas com
// API e banco simulados; não acessa nada externo.
// Uso: node --test verificacao/test-assinatura.mjs   (a partir da raiz do projeto)
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash, timingSafeEqual } from 'node:crypto';

const root = resolve(process.argv[2] || '.');
const requireFromProject = createRequire(resolve(root, 'package.json'));
const typescript = requireFromProject('typescript');
const { z } = requireFromProject('zod');

function load(file, names, deps = {}) {
  const ts = readFileSync(resolve(root, 'src', file), 'utf8');
  const js = typescript.transpileModule(ts, { compilerOptions: { target: typescript.ScriptTarget.ES2022, module: typescript.ModuleKind.ESNext } }).outputText.replace(/^export\s*\{\s*\};?\s*$/gm, '').replace(/^import[\s\S]*?;\s*/gm, '').replace(/\bexport\s+/g, '');
  return runInNewContext(`${js}\n;({${names.join(',')}})`, { console, FormData, URL, JSON, ...deps });
}

const plain = (value) => JSON.parse(JSON.stringify(value));
const plans = load('lib/plans.ts', ['PLAN_CODE', 'PLAN_MAX_USERS', 'BILLING_OPTIONS', 'PAYMENT_METHODS']);
const { ActionError } = load('lib/actions/action-error.ts', ['ActionError']);
const { runActionResult } = load('lib/actions/run-action.ts', ['runActionResult', 'runAction'], { ActionError, unstable_rethrow: () => {} });

// ---------- Plano ----------
test('plano: R$ 59,00 por mês, R$ 590,00 por ano e até 5 usuários', () => {
  assert.equal(plans.BILLING_OPTIONS.MONTHLY.amountCents, 5900);
  assert.equal(plans.BILLING_OPTIONS.YEARLY.amountCents, 59000);
  assert.equal(plans.BILLING_OPTIONS.YEARLY.amountCents, plans.BILLING_OPTIONS.MONTHLY.amountCents * 10, 'anual = 10 meses');
  assert.equal(plans.PLAN_MAX_USERS, 5);
  assert.deepEqual(Object.keys(plans.PAYMENT_METHODS), ['PIX', 'BOLETO', 'CREDIT_CARD']);
});

// ---------- Cliente da API do Asaas ----------
function loadAsaas(env, respond) {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, ...init });
    const { status = 200, body = {} } = respond(url, init) ?? {};
    return { ok: status < 300, status, json: async () => body };
  };
  return { calls, ...load('lib/asaas.ts', ['AsaasError', 'createAsaasCustomer', 'createAsaasSubscription', 'getAsaasSubscription', 'listAsaasSubscriptionPayments', 'deleteAsaasSubscription'], { process: { env }, fetch }) };
}

const SANDBOX = { ASAAS_API_KEY: '$aact_hmlg_teste', ASAAS_API_URL: 'https://api-sandbox.asaas.com/v3/' };

test('Asaas: autentica pelo cabeçalho access_token e não envia corpo no GET', async () => {
  const asaas = loadAsaas(SANDBOX, (url) => (url.endsWith('/customers') ? { body: { id: 'cus_1' } } : { body: { data: [{ id: 'pay_1', status: 'PENDING', invoiceUrl: 'https://sandbox.asaas.com/i/1' }] } }));
  assert.equal(await asaas.createAsaasCustomer({ name: 'Escritório', cpfCnpj: '52998224725', email: 'a@b.com', externalReference: 'w1' }), 'cus_1');
  const [post] = asaas.calls;
  assert.equal(post.url, 'https://api-sandbox.asaas.com/v3/customers');
  assert.equal(post.method, 'POST');
  assert.equal(post.headers.access_token, '$aact_hmlg_teste');
  assert.match(post.headers['User-Agent'], /^LexFlow/);
  assert.deepEqual(JSON.parse(post.body), { name: 'Escritório', cpfCnpj: '52998224725', email: 'a@b.com', externalReference: 'w1' });

  const payments = await asaas.listAsaasSubscriptionPayments('sub_1');
  assert.equal(payments[0].invoiceUrl, 'https://sandbox.asaas.com/i/1');
  assert.equal(asaas.calls[1].method, 'GET');
  assert.equal(asaas.calls[1].body, undefined);
});

test('Asaas: erro da API vira AsaasError com as descrições; sem configuração não chama nada', async () => {
  const asaas = loadAsaas(SANDBOX, () => ({ status: 400, body: { errors: [{ code: 'invalid_cpfCnpj', description: 'O CPF/CNPJ informado é inválido.' }] } }));
  await assert.rejects(asaas.createAsaasCustomer({ name: 'x', cpfCnpj: '1', email: 'a@b.com', externalReference: 'w' }), (error) => error instanceof asaas.AsaasError && error.status === 400 && error.descriptions[0] === 'O CPF/CNPJ informado é inválido.');
  const unset = loadAsaas({}, () => ({}));
  await assert.rejects(unset.listAsaasSubscriptionPayments('sub_1'), /Asaas não configurado/);
  assert.equal(unset.calls.length, 0);
});

// ---------- Ação de assinar ----------
// Uma só classe de erro, compartilhada entre a ação e os testes.
const { AsaasError } = loadAsaas(SANDBOX, () => ({}));

function loadStart({ subscription, billing = { name: 'Souza Advocacia', taxId: '11222333000181', email: null }, appUrl = 'http://localhost:3000', asaas: overrides = {} } = {}) {
  const calls = { customers: [], subscriptions: [], deleted: [], updates: [] };
  const asaas = {
    createAsaasCustomer: async (input) => { calls.customers.push(input); return 'cus_novo'; },
    createAsaasSubscription: async (input) => { calls.subscriptions.push(input); return { id: 'sub_novo' }; },
    listAsaasSubscriptionPayments: async (id) => (id === 'sub_novo' ? [{ id: 'pay_1', status: 'PENDING', invoiceUrl: 'https://sandbox.asaas.com/i/novo' }] : []),
    deleteAsaasSubscription: async (id) => { calls.deleted.push(id); },
    ...overrides,
  };
  const { startSubscription } = load('features/settings/actions/start-subscription.ts', ['startSubscription'], {
    z, ActionError, runActionResult, AsaasError, PAID_PAYMENT_STATUSES: ['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'], ...asaas,
    BILLING_OPTIONS: plans.BILLING_OPTIONS, PLAN_CODE: plans.PLAN_CODE,
    getAppUrl: () => appUrl,
    requireWorkspacePermission: async (permission) => { assert.equal(permission, 'BILLING_MANAGE'); return { workspace: { id: 'w1', name: 'Souza Advocacia' }, user: { id: 'u1', email: 'dona@souza.adv.br' } }; },
    prisma: {
      subscription: {
        findUnique: async () => subscription,
        update: async ({ data }) => { calls.updates.push(data); return {}; },
      },
      billingProfile: { findUnique: async () => billing },
    },
  });
  const form = (interval = 'MONTHLY', method = 'PIX') => { const data = new FormData(); data.set('interval', interval); data.set('method', method); return data; };
  return { calls, start: (interval, method) => startSubscription(form(interval, method)) };
}

const trialing = (extra = {}) => ({ id: 's1', status: 'TRIALING', providerCustomerId: null, providerSubscriptionId: null, ...extra });

test('assinar: cria cliente e assinatura no Asaas e devolve o link da fatura', async () => {
  const ctx = loadStart({ subscription: trialing() });
  const result = plain(await ctx.start('MONTHLY', 'PIX'));
  assert.deepEqual(result, { success: true, data: { invoiceUrl: 'https://sandbox.asaas.com/i/novo' } });
  assert.deepEqual(plain(ctx.calls.customers), [{ name: 'Souza Advocacia', cpfCnpj: '11222333000181', email: 'dona@souza.adv.br', externalReference: 'w1' }]);
  const [sub] = plain(ctx.calls.subscriptions);
  assert.equal(sub.customer, 'cus_novo');
  assert.equal(sub.billingType, 'PIX');
  assert.equal(sub.value, 59);
  assert.equal(sub.cycle, 'MONTHLY');
  assert.match(sub.nextDueDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(sub.externalReference, 'w1');
  assert.equal(sub.callback, undefined, 'sem endereço https não pede retorno ao LexFlow');
  assert.deepEqual(plain(ctx.calls.updates), [
    { provider: 'asaas', providerCustomerId: 'cus_novo' },
    { provider: 'asaas', providerSubscriptionId: 'sub_novo', billingInterval: 'MONTHLY', amountCents: 5900, planCode: 'lexflow' },
  ]);
});

test('assinar: anual no cartão com endereço público pede o retorno ao LexFlow; cliente existente é reaproveitado', async () => {
  const ctx = loadStart({ subscription: trialing({ providerCustomerId: 'cus_antigo' }), appUrl: 'https://app.lexflowjuridico.com.br', billing: { name: '', taxId: '52998224725', email: 'cobranca@souza.adv.br' } });
  assert.equal((await ctx.start('YEARLY', 'CREDIT_CARD')).success, true);
  assert.equal(ctx.calls.customers.length, 0);
  const [sub] = plain(ctx.calls.subscriptions);
  assert.equal(sub.customer, 'cus_antigo');
  assert.equal(sub.value, 590);
  assert.equal(sub.cycle, 'YEARLY');
  assert.equal(sub.billingType, 'CREDIT_CARD');
  assert.deepEqual(sub.callback, { successUrl: 'https://app.lexflowjuridico.com.br/configuracoes/assinatura?pagamento=concluido', autoRedirect: true });
});

test('assinar: tentativa anterior sem pagamento é substituída; com pagamento, nada é refeito', async () => {
  const unpaid = loadStart({ subscription: trialing({ providerCustomerId: 'cus_1', providerSubscriptionId: 'sub_velha' }), asaas: { listAsaasSubscriptionPayments: async (id) => (id === 'sub_velha' ? [{ id: 'p0', status: 'PENDING' }] : [{ id: 'p1', status: 'PENDING', invoiceUrl: 'https://sandbox.asaas.com/i/nova' }]) } });
  assert.equal((await unpaid.start()).success, true);
  assert.deepEqual(unpaid.calls.deleted, ['sub_velha']);
  assert.equal(unpaid.calls.subscriptions.length, 1);

  const paid = loadStart({ subscription: trialing({ providerCustomerId: 'cus_1', providerSubscriptionId: 'sub_paga' }), asaas: { listAsaasSubscriptionPayments: async () => [{ id: 'p0', status: 'CONFIRMED' }] } });
  const result = plain(await paid.start());
  assert.equal(result.success, false);
  assert.match(result.message, /Já recebemos um pagamento/);
  assert.equal(paid.calls.deleted.length + paid.calls.subscriptions.length, 0);
});

test('assinar: recusa sem CPF/CNPJ, assinatura já ativa, escritório sem teste ou escolha inválida', async () => {
  const cases = [
    [{ subscription: trialing(), billing: { name: 'x', taxId: null, email: null } }, 'MONTHLY', 'PIX', /CPF ou CNPJ/],
    [{ subscription: trialing({ status: 'ACTIVE' }) }, 'MONTHLY', 'PIX', /já está ativa/],
    [{ subscription: null }, 'MONTHLY', 'PIX', /não tem um período de teste/],
    [{ subscription: trialing() }, 'SEMANAL', 'PIX', /Escolha o plano/],
    [{ subscription: trialing() }, 'MONTHLY', 'CHEQUE', /Escolha o plano/],
  ];
  for (const [setup, interval, method, message] of cases) {
    const ctx = loadStart(setup);
    const result = plain(await ctx.start(interval, method));
    assert.equal(result.success, false);
    assert.match(result.message, message);
    assert.equal(ctx.calls.customers.length + ctx.calls.subscriptions.length, 0);
  }
});

test('assinar: recusa do Asaas aparece em português; falha inesperada fica genérica', async () => {
  const refused = loadStart({ subscription: trialing(), asaas: { createAsaasCustomer: async () => { throw new AsaasError('x', 400, ['O CPF/CNPJ informado é inválido.']); } } });
  assert.match(plain(await refused.start()).message, /O Asaas recusou a cobrança: O CPF\/CNPJ informado é inválido\./);

  const down = loadStart({ subscription: trialing(), asaas: { createAsaasSubscription: async () => { throw new AsaasError('x', 503, []); } } });
  const result = plain(await down.start());
  assert.equal(result.success, false);
  assert.doesNotMatch(result.message, /503|Asaas respondeu/);
});

test('suboperadores: Asaas incluído para a cobrança das assinaturas', () => {
  const { SUBPROCESSORS } = load('features/legal/legal-info.ts', ['SUBPROCESSORS'], { process: { env: {} } });
  const asaas = SUBPROCESSORS.find((item) => item.name.startsWith('Asaas'));
  assert.ok(asaas);
  assert.match(asaas.purpose, /CPF ou CNPJ/);
});

// ---------- Estado da assinatura e acesso ----------
const { TRIAL_ENDED_MESSAGE } = load('lib/trial.ts', ['TRIAL_ENDED_MESSAGE']);
const state = load('lib/subscription-state.ts', ['PAYMENT_GRACE_DAYS', 'PAID_PAYMENT_STATUSES', 'READ_ONLY_MESSAGES', 'getReadOnlyReason', 'getPaymentGraceEndsAt', 'computeSubscriptionState', 'isAbandonedFirstPayment'], { TRIAL_ENDED_MESSAGE });
const DAY = 24 * 60 * 60 * 1000;
const iso = (date) => (date ? date.toISOString().slice(0, 10) : null);

test('estado: nunca pago continua no teste; pago fica ativo pelo ciclo, com mês curto respeitado', () => {
  const compute = (payments, extra = {}) => state.computeSubscriptionState({ providerActive: true, cycle: 'MONTHLY', payments, ...extra });
  assert.equal(compute([{ status: 'PENDING', dueDate: '2026-11-24' }]).status, 'TRIALING');
  const paid = compute([{ status: 'RECEIVED', dueDate: '2026-11-24' }]);
  assert.equal(paid.status, 'ACTIVE');
  assert.equal(iso(paid.currentPeriodStart), '2026-11-24');
  assert.equal(iso(paid.currentPeriodEnd), '2026-12-24');
  assert.equal(iso(compute([{ status: 'CONFIRMED', dueDate: '2027-01-31' }]).currentPeriodEnd), '2027-02-28');
  assert.equal(iso(compute([{ status: 'RECEIVED_IN_CASH', dueDate: '2026-11-24' }], { cycle: 'YEARLY' }).currentPeriodEnd), '2027-11-24');
  const latest = compute([{ status: 'RECEIVED', dueDate: '2026-11-24' }, { status: 'RECEIVED', dueDate: '2026-12-24' }, { status: 'PENDING', dueDate: '2027-01-24' }]);
  assert.equal(iso(latest.currentPeriodEnd), '2027-01-24', 'vale a cobrança paga mais recente');
});

test('estado: cobrança vencida após pagamento é atraso; assinatura encerrada no Asaas é cancelada', () => {
  const overdue = state.computeSubscriptionState({ providerActive: true, cycle: 'MONTHLY', payments: [{ status: 'RECEIVED', dueDate: '2026-10-24' }, { status: 'OVERDUE', dueDate: '2026-11-24' }] });
  assert.equal(overdue.status, 'PAST_DUE');
  assert.equal(iso(overdue.currentPeriodEnd), '2026-11-24');
  const canceled = state.computeSubscriptionState({ providerActive: false, cycle: 'MONTHLY', payments: [{ status: 'RECEIVED', dueDate: '2026-11-24' }] });
  assert.equal(canceled.status, 'CANCELED');
  assert.equal(iso(canceled.currentPeriodEnd), '2026-12-24', 'mantém o período já pago');
  assert.equal(state.computeSubscriptionState({ providerActive: false, cycle: 'MONTHLY', payments: [] }).status, 'TRIALING');
  const refunded = state.computeSubscriptionState({ providerActive: true, cycle: 'MONTHLY', payments: [{ status: 'REFUNDED', dueDate: '2026-11-24' }] });
  assert.equal(refunded.status, 'TRIALING', 'estornado não conta como pago');
});

test('acesso: atraso tem 7 dias de tolerância; cancelada vale até o fim do período pago', () => {
  const now = new Date('2026-12-28T12:00:00Z');
  const periodEnd = new Date('2026-12-24T12:00:00Z');
  const reason = (subscription) => state.getReadOnlyReason(subscription, now);
  assert.equal(reason(null), null);
  assert.equal(reason({ status: 'ACTIVE', trialEndsAt: new Date('2026-01-01'), currentPeriodEnd: periodEnd }), null);
  assert.equal(reason({ status: 'PAST_DUE', trialEndsAt: null, currentPeriodEnd: periodEnd }), null, 'dentro da tolerância');
  assert.equal(reason({ status: 'PAST_DUE', trialEndsAt: null, currentPeriodEnd: new Date(periodEnd.getTime() - 5 * DAY) }), 'past-due');
  assert.equal(reason({ status: 'CANCELED', trialEndsAt: null, currentPeriodEnd: new Date('2027-01-10') }), null);
  assert.equal(reason({ status: 'CANCELED', trialEndsAt: null, currentPeriodEnd: periodEnd }), 'canceled');
  assert.equal(reason({ status: 'TRIALING', trialEndsAt: new Date('2026-12-01'), currentPeriodEnd: null }), 'trial');
  assert.equal(reason({ status: 'TRIALING', trialEndsAt: new Date('2027-01-01'), currentPeriodEnd: null }), null);
  assert.equal(state.READ_ONLY_MESSAGES.trial, TRIAL_ENDED_MESSAGE);
  assert.match(state.READ_ONLY_MESSAGES['past-due'], /atrasado/);
  assert.equal(iso(state.getPaymentGraceEndsAt(periodEnd)), '2026-12-31');
});

test('primeira fatura abandonada: só depois de 7 dias vencida e sem nenhum pagamento', () => {
  const now = new Date('2026-12-10T12:00:00Z');
  assert.equal(state.isAbandonedFirstPayment([{ status: 'OVERDUE', dueDate: '2026-12-01' }], now), true);
  assert.equal(state.isAbandonedFirstPayment([{ status: 'OVERDUE', dueDate: '2026-12-05' }], now), false);
  assert.equal(state.isAbandonedFirstPayment([{ status: 'RECEIVED', dueDate: '2026-11-01' }, { status: 'OVERDUE', dueDate: '2026-12-01' }], now), false);
});

// ---------- Sincronização com o Asaas ----------
function loadSync({ local, remote = { id: 'sub_1', status: 'ACTIVE', cycle: 'MONTHLY' }, payments = [], remoteError = null }) {
  const calls = { updates: [], deleted: [] };
  const lib = load('features/settings/services/sync-asaas-subscription.ts', ['syncAsaasSubscription', 'reconcileAsaasSubscriptions'], {
    AsaasError,
    getAsaasSubscription: async () => { if (remoteError) throw remoteError; return remote; },
    listAsaasSubscriptionPayments: async () => { if (remoteError) throw remoteError; return payments; },
    deleteAsaasSubscription: async (id) => { calls.deleted.push(id); },
    BILLING_OPTIONS: plans.BILLING_OPTIONS,
    computeSubscriptionState: state.computeSubscriptionState,
    isAbandonedFirstPayment: state.isAbandonedFirstPayment,
    prisma: { subscription: {
      findUnique: async () => local,
      update: async ({ data }) => { calls.updates.push(data); return {}; },
      findMany: async (args) => { calls.query = args; return [{ id: 'a' }, { id: 'b' }]; },
    } },
  });
  return { calls, ...lib };
}

const localSub = (extra = {}) => ({ id: 's1', providerSubscriptionId: 'sub_1', billingInterval: 'MONTHLY', canceledAt: null, ...extra });

test('sincronizar: pagamento confirmado ativa a assinatura com o período pago e o nome do plano', async () => {
  const ctx = loadSync({ local: localSub(), payments: [{ id: 'p1', status: 'RECEIVED', dueDate: '2026-11-24', billingType: 'PIX' }] });
  assert.equal(await ctx.syncAsaasSubscription('s1', new Date('2026-11-24T15:00:00Z')), 'ACTIVE');
  const [data] = plain(ctx.calls.updates);
  assert.equal(data.status, 'ACTIVE');
  assert.equal(data.currentPeriodEnd.slice(0, 10), '2026-12-24');
  assert.equal(data.planName, 'LexFlow mensal');
  assert.equal(data.canceledAt, null);
});

test('sincronizar: assinatura apagada no Asaas (404) vira cancelada, mantendo o período pago', async () => {
  const ctx = loadSync({ local: localSub({ billingInterval: 'YEARLY' }), remoteError: new AsaasError('x', 404, []) });
  assert.equal(await ctx.syncAsaasSubscription('s1'), 'TRIALING', 'sem cobranças visíveis, nunca pago');
  const paid = loadSync({ local: localSub(), remote: { id: 'sub_1', status: 'INACTIVE', cycle: 'MONTHLY' }, payments: [{ status: 'RECEIVED', dueDate: '2026-11-24' }] });
  assert.equal(await paid.syncAsaasSubscription('s1', new Date('2026-12-01T12:00:00Z')), 'CANCELED');
  assert.ok(plain(paid.calls.updates)[0].canceledAt);
});

test('sincronizar: primeira fatura abandonada cancela a cobrança no Asaas e volta às regras do teste', async () => {
  const ctx = loadSync({ local: localSub(), payments: [{ status: 'OVERDUE', dueDate: '2026-11-24' }] });
  assert.equal(await ctx.syncAsaasSubscription('s1', new Date('2026-12-05T12:00:00Z')), 'TRIALING');
  assert.deepEqual(ctx.calls.deleted, ['sub_1']);
  assert.equal(plain(ctx.calls.updates)[0].providerSubscriptionId, null);
  const recent = loadSync({ local: localSub(), payments: [{ status: 'OVERDUE', dueDate: '2026-11-24' }] });
  await recent.syncAsaasSubscription('s1', new Date('2026-11-26T12:00:00Z'));
  assert.deepEqual(recent.calls.deleted, [], 'ainda dentro do prazo');
});

test('sincronizar: sem vínculo com o Asaas não faz nada; erro do Asaas sobe para quem chamou', async () => {
  const none = loadSync({ local: localSub({ providerSubscriptionId: null }) });
  assert.equal(await none.syncAsaasSubscription('s1'), null);
  assert.equal(none.calls.updates.length, 0);
  const down = loadSync({ local: localSub(), remoteError: new AsaasError('x', 503, []) });
  await assert.rejects(down.syncAsaasSubscription('s1'));
  assert.equal(down.calls.updates.length, 0);
});

test('conferência diária: revisa só as ligadas ao Asaas perto do fim do período ou em atraso', async () => {
  const ctx = loadSync({ local: localSub(), payments: [{ status: 'RECEIVED', dueDate: '2026-11-24' }] });
  assert.deepEqual(plain(await ctx.reconcileAsaasSubscriptions(new Date('2026-11-24T12:00:00Z'))), { synced: 2, failed: 0 });
  const where = ctx.calls.query.where;
  assert.deepEqual(plain(where.providerSubscriptionId), { not: null });
  assert.deepEqual(plain(where.status.in), ['TRIALING', 'ACTIVE', 'PAST_DUE']);
  assert.ok(where.OR.some((item) => item.currentPeriodEnd === null));
});

// ---------- Avisos do Asaas (webhook) ----------
function loadWebhook({ env = { ASAAS_WEBHOOK_TOKEN: 'token-do-webhook' }, known = { 'sub_1': 's1' }, syncError = null } = {}) {
  const synced = [];
  const { POST } = load('app/api/webhooks/asaas/route.ts', ['POST'], {
    process: { env }, createHash, timingSafeEqual,
    NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) },
    prisma: { subscription: { findFirst: async ({ where }) => (known[where.providerSubscriptionId] ? { id: known[where.providerSubscriptionId] } : null) } },
    syncAsaasSubscription: async (id) => { if (syncError) throw syncError; synced.push(id); return 'ACTIVE'; },
  });
  const call = (body, token = 'token-do-webhook') => POST({ headers: { get: (name) => (name === 'asaas-access-token' ? token : null) }, json: async () => body });
  return { synced, call };
}

test('webhook: exige o token do Asaas; sem token configurado recusa tudo', async () => {
  const ctx = loadWebhook();
  assert.equal((await ctx.call({ event: 'PAYMENT_RECEIVED', payment: { subscription: 'sub_1' } }, 'errado')).status, 401);
  assert.equal((await ctx.call({ event: 'PAYMENT_RECEIVED', payment: { subscription: 'sub_1' } }, null)).status, 401);
  const unset = loadWebhook({ env: {} });
  assert.equal((await unset.call({ event: 'PAYMENT_RECEIVED', payment: { subscription: 'sub_1' } })).status, 401);
  assert.deepEqual(ctx.synced, []);
});

test('webhook: aviso de cobrança ou de assinatura sincroniza a assinatura certa; repetido não causa dano', async () => {
  const ctx = loadWebhook();
  assert.equal((await ctx.call({ id: 'evt_1', event: 'PAYMENT_RECEIVED', payment: { id: 'pay_1', subscription: 'sub_1' } })).status, 200);
  assert.equal((await ctx.call({ id: 'evt_1', event: 'PAYMENT_RECEIVED', payment: { id: 'pay_1', subscription: 'sub_1' } })).status, 200);
  assert.equal((await ctx.call({ id: 'evt_2', event: 'SUBSCRIPTION_DELETED', subscription: { id: 'sub_1' } })).status, 200);
  assert.deepEqual(ctx.synced, ['s1', 's1', 's1']);
});

test('webhook: cobrança avulsa, assinatura desconhecida e falha na sincronização respondem 200', async () => {
  const ctx = loadWebhook();
  assert.equal((await ctx.call({ event: 'PAYMENT_RECEIVED', payment: { id: 'pay_avulso' } })).body.ignored, true);
  assert.equal((await ctx.call({ event: 'PAYMENT_RECEIVED', payment: { subscription: 'sub_outra' } })).body.ignored, true);
  const failing = loadWebhook({ syncError: new Error('Asaas fora do ar') });
  assert.equal((await failing.call({ event: 'PAYMENT_RECEIVED', payment: { subscription: 'sub_1' } })).status, 200);
});

test('rotas públicas: avisos do Asaas passam pelo middleware; o resto de /api continua protegido', () => {
  const { isPublicRoute } = load('lib/supabase/proxy.ts', ['isPublicRoute']);
  assert.equal(isPublicRoute('/api/webhooks/asaas'), true);
  assert.equal(isPublicRoute('/api/google-calendar/connect'), false);
});

test('assinar: fatura em atraso se paga na tela de assinatura; cancelada começa uma assinatura nova', async () => {
  const pastDue = loadStart({ subscription: trialing({ status: 'PAST_DUE', providerCustomerId: 'cus_1', providerSubscriptionId: 'sub_1' }) });
  const result = plain(await pastDue.start());
  assert.match(result.message, /fatura em atraso/);
  assert.equal(pastDue.calls.subscriptions.length, 0);

  let listedOld = false;
  const canceled = loadStart({
    subscription: trialing({ status: 'CANCELED', providerCustomerId: 'cus_1', providerSubscriptionId: 'sub_cancelada' }),
    asaas: { listAsaasSubscriptionPayments: async (id) => { if (id === 'sub_cancelada') listedOld = true; return [{ id: 'p', status: 'PENDING', invoiceUrl: 'https://sandbox.asaas.com/i/n' }]; } },
  });
  assert.equal((await canceled.start('YEARLY', 'CREDIT_CARD')).success, true);
  assert.equal(listedOld, false, 'a assinatura antiga não é consultada nem apagada');
  assert.equal(canceled.calls.deleted.length, 0);
  assert.equal(canceled.calls.subscriptions[0].customer, 'cus_1');
});
