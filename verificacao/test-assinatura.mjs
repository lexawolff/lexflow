// Node 22; usa o TypeScript do projeto. Assinatura do LexFlow pelo Asaas com
// API e banco simulados; não acessa nada externo.
// Uso: node --test verificacao/test-assinatura.mjs   (a partir da raiz do projeto)
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import { test } from 'node:test';

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
  return { calls, ...load('lib/asaas.ts', ['AsaasError', 'createAsaasCustomer', 'createAsaasSubscription', 'listAsaasSubscriptionPayments', 'deleteAsaasSubscription', 'PAID_PAYMENT_STATUSES'], { process: { env }, fetch }) };
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
