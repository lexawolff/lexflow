// Node >= 20.17; usa o TypeScript já instalado no projeto. Executa o cadastro público de
// escritórios (ações, criação após confirmação, login e retorno do e-mail) com
// Supabase e banco simulados; não acessa nada externo.
// Uso: node --test verificacao/test-cadastro.mjs   (a partir da raiz do projeto)
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const root = resolve(process.argv[2] || '.');
const requireFromProject = createRequire(resolve(root, 'package.json'));
const typescript = requireFromProject('typescript');
const { z } = requireFromProject('zod');

function load(file, names, deps = {}) {
  const ts = readFileSync(resolve(root, 'src', file), 'utf8');
  const js = typescript.transpileModule(ts, { compilerOptions: { target: typescript.ScriptTarget.ES2022, module: typescript.ModuleKind.ESNext } }).outputText.replace(/^export\s*\{\s*\};?\s*$/gm, '').replace(/^import[\s\S]*?;\s*/gm, '').replace(/\bexport\s+/g, '');
  return runInNewContext(`${js}\n;({${names.join(',')}})`, { console, FormData, URL, ...deps });
}

const normalized = (value) => JSON.parse(JSON.stringify(value));
const UserRole = { OWNER: 'OWNER', ADMIN: 'ADMIN', LAWYER: 'LAWYER' };
const documents = load('lib/br-documents.ts', ['onlyDigits', 'normalizeTaxId', 'isValidCpf', 'isValidCnpj', 'isValidTaxId', 'getTaxIdOwnerKey', 'isValidBrazilPhone', 'maskTaxId', 'maskCnpj']);
const trial = load('lib/trial.ts', ['TRIAL_DAYS', 'TRIAL_ENDED_MESSAGE', 'getTrialEndsAt', 'isWorkspaceReadOnly']);
const encryptSecret = (value) => `enc:${value}`;
const decryptSecret = (value) => { if (!value.startsWith('enc:')) throw new Error('cifra inválida'); return value.slice(4); };
const keyedHash = (purpose, value) => `${purpose}|${value}`;
const { BRAZIL_STATES } = load('features/clients/constants.ts', ['BRAZIL_STATES']);
const schemas = load('features/auth/schemas/auth-schema.ts', ['signUpSchema', 'signupMetadataSchema', 'requestPasswordResetSchema', 'loginSchema'], { z, BRAZIL_STATES, ...documents });
const { authErrorMessage } = load('features/auth/lib/auth-error-message.ts', ['authErrorMessage']);
const validation = load('features/auth/lib/signup-validation.ts', ['getSignUpFieldErrors', 'SIGN_UP_FIELDS', 'SIGN_UP_STEPS', 'getSignUpStepIndex'], { signUpSchema: schemas.signUpSchema });
const redirectTo = (url) => { throw Object.assign(new Error('NEXT_REDIRECT'), { url }); };

function form(values) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

// ---------- Banco simulado ----------
function makeDb({ users = [], failUserCreate = null } = {}) {
  const state = { users: structuredClone(users), workspaces: [], memberships: [], billingProfiles: [], claims: [], subscriptions: [] };
  const db = {
    user: {
      findUnique: async ({ where }) => state.users.find((user) => (where.id ? user.id === where.id : user.email === where.email)) ?? null,
      deleteMany: async ({ where }) => {
        const stale = (user) => user.email === where.email && user.id !== where.id.not && !state.memberships.some((item) => item.userId === user.id);
        state.users = state.users.filter((user) => !stale(user));
        return {};
      },
      create: async ({ data }) => {
        if (failUserCreate) failUserCreate(state);
        if (state.users.some((user) => user.id === data.id || user.email === data.email)) throw Object.assign(new Error('Unique constraint'), { code: 'P2002' });
        state.users.push(data);
        return data;
      },
    },
    workspace: { create: async ({ data }) => { const row = { id: `w${state.workspaces.length + 1}`, ...data }; state.workspaces.push(row); return row; } },
    membership: { create: async ({ data }) => { state.memberships.push(data); return data; } },
    billingProfile: { create: async ({ data }) => { state.billingProfiles.push(data); return data; } },
    subscription: { create: async ({ data }) => { state.subscriptions.push(data); return data; } },
    signupTaxIdClaim: {
      findUnique: async ({ where }) => state.claims.find((claim) => claim.taxIdHash === where.taxIdHash) ?? null,
      create: async ({ data }) => {
        if (state.claims.some((claim) => claim.taxIdHash === data.taxIdHash)) throw Object.assign(new Error('Unique constraint'), { code: 'P2002' });
        state.claims.push(data);
        return data;
      },
    },
    $transaction: async (fn) => {
      const backup = structuredClone(state);
      try { return await fn(db); } catch (error) { Object.assign(state, backup); throw error; }
    },
  };
  return { db, state };
}

function loadSignupLib(env, db, legalComplete = true, adminUpdates = [], adminDeletes = [], deleteError = null) {
  return load('features/auth/lib/signup.ts', ['isSignupEnabled', 'isDevConfirmationLinkEnabled', 'buildWorkspaceSlug', 'provisionSignupAccount', 'refreshSessionAfterSignup', 'SIGNUP_REJECTED_MESSAGE'], {
    process: { env }, randomBytes, UserRole, prisma: db, signupMetadataSchema: schemas.signupMetadataSchema,
    isLegalInfoComplete: () => legalComplete,
    ...documents, decryptSecret, keyedHash, getTrialEndsAt: trial.getTrialEndsAt, LEGAL_CONTACT_EMAIL: 'contato@lexflowjuridico.com.br',
    createAdminClient: () => ({ auth: { admin: {
      updateUserById: async (id, attributes) => { adminUpdates.push({ id, attributes }); return { error: null }; },
      deleteUser: async (id) => { adminDeletes.push(id); return { error: deleteError }; },
    } } }),
  });
}

const confirmedUser = (overrides = {}) => ({
  id: 'auth-1', email: 'Dona@Escritorio.com.br', email_confirmed_at: '2026-11-17T10:00:00Z',
  user_metadata: { name: 'Ana Souza', signup_office_name: 'Souza Advocacia Previdenciária', signup_tax_id: 'enc:52998224725', terms_version: '1.0', terms_accepted_at: '2026-11-17T09:59:00.000Z' }, ...overrides,
});

// ---------- Regras do cadastro ----------
test('cadastro: ligado em desenvolvimento, fechado em produção até SIGNUP_ENABLED="true"', () => {
  const cases = [
    [{ NODE_ENV: 'development' }, true],
    [{ NODE_ENV: 'development', SIGNUP_ENABLED: 'false' }, false],
    [{ NODE_ENV: 'production' }, false],
    [{ NODE_ENV: 'production', SIGNUP_ENABLED: 'true' }, true],
    [{ NODE_ENV: 'production', SIGNUP_ENABLED: 'true' }, false, false],
    [{ NODE_ENV: 'production', SIGNUP_ENABLED: 'yes' }, false],
  ];
  for (const [env, expected, legalComplete = true] of cases) {
    assert.equal(loadSignupLib(env, makeDb().db, legalComplete).isSignupEnabled(), expected, `${JSON.stringify(env)} termos completos=${legalComplete}`);
  }
});

test('slug do escritório: sem acentos, seguro para URL e sempre único', () => {
  const { buildWorkspaceSlug } = loadSignupLib({}, makeDb().db);
  const slug = buildWorkspaceSlug('Silva & Associados — Previdenciário');
  assert.match(slug, /^silva-associados-previdenciario-[0-9a-f]{6}$/);
  assert.notEqual(buildWorkspaceSlug('Mesmo Nome'), buildWorkspaceSlug('Mesmo Nome'));
  assert.match(buildWorkspaceSlug('!!!'), /^escritorio-[0-9a-f]{6}$/);
  assert.ok(buildWorkspaceSlug('a'.repeat(200)).length <= 47);
});

// ---------- Criação do escritório após confirmação ----------
test('confirmado: cria escritório, usuário e vínculo de proprietário — uma única vez', async () => {
  const { db, state } = makeDb();
  const lib = loadSignupLib({ NODE_ENV: 'development' }, db);
  assert.equal(await lib.provisionSignupAccount(confirmedUser()), 'created');
  assert.equal(state.workspaces.length, 1);
  assert.equal(state.workspaces[0].name, 'Souza Advocacia Previdenciária');
  assert.deepEqual(normalized(state.users), [{ id: 'auth-1', name: 'Ana Souza', email: 'dona@escritorio.com.br', termsVersion: '1.0', termsAcceptedAt: '2026-11-17T09:59:00.000Z' }]);
  assert.deepEqual(normalized(state.memberships), [{ userId: 'auth-1', workspaceId: 'w1', role: 'OWNER' }]);

  assert.equal(await lib.provisionSignupAccount(confirmedUser()), 'exists', 'segunda chamada não duplica');
  assert.equal(state.workspaces.length, 1);
});

test('sem confirmação, com cadastro fechado ou sem dados do cadastro: nada é criado', async () => {
  const cases = [
    [{ NODE_ENV: 'development' }, confirmedUser({ email_confirmed_at: null })],
    [{ NODE_ENV: 'production' }, confirmedUser()],
    [{ NODE_ENV: 'development' }, confirmedUser({ user_metadata: { name: 'Convidado' } })],
    [{ NODE_ENV: 'development' }, confirmedUser({ user_metadata: { name: 'Ana', signup_office_name: 'AB' } })],
    [{ NODE_ENV: 'development' }, confirmedUser({ email: null })],
  ];
  for (const [env, authUser] of cases) {
    const { db, state } = makeDb();
    assert.equal(await loadSignupLib(env, db).provisionSignupAccount(authUser), 'not-eligible');
    assert.equal(state.workspaces.length + state.users.length + state.memberships.length, 0);
  }
});

test('acesso simultâneo (link + login): o segundo vê a conta criada pelo primeiro', async () => {
  const { db, state } = makeDb({
    failUserCreate: () => { throw Object.assign(new Error('Unique constraint'), { code: 'P2002' }); },
  });
  const lib = loadSignupLib({ NODE_ENV: 'development' }, db);
  // Esta transação falha e é desfeita; enquanto isso, o outro acesso gravou a conta.
  const original = db.$transaction;
  db.$transaction = async (fn) => {
    try { return await original(fn); } finally { state.users.push({ id: 'auth-1' }); }
  };
  assert.equal(await lib.provisionSignupAccount(confirmedUser()), 'exists');
  assert.equal(state.workspaces.length, 0, 'o escritório desta tentativa foi desfeito');

  // Sem a conta criada por outro acesso, o erro real não é escondido.
  const failing = makeDb({ failUserCreate: () => { throw new Error('banco fora do ar'); } });
  await assert.rejects(loadSignupLib({ NODE_ENV: 'development' }, failing.db).provisionSignupAccount(confirmedUser()), /banco fora do ar/);
});

// ---------- Ação de cadastro ----------
function loadSignUp({ env = { NODE_ENV: 'development', SIGNUP_DEV_CONFIRM_LINK: 'false' }, signUpResult = { data: { user: { id: 'auth-1' }, session: null }, error: null }, generateLinkResult = { data: { properties: { hashed_token: 'hash+1', verification_type: 'signup' } }, error: null }, db = makeDb().db } = {}) {
  const calls = { signUp: [], signOut: 0, resend: [], generateLink: [] };
  const lib = loadSignupLib(env, db);
  const actions = load('features/auth/actions/signup.ts', ['signUpAction', 'resendSignupConfirmationAction'], {
    redirect: redirectTo,
    createClient: async () => ({ auth: {
      signUp: async (payload) => { calls.signUp.push(payload); return signUpResult; },
      signOut: async () => { calls.signOut += 1; },
      refreshSession: async () => { calls.refresh = (calls.refresh ?? 0) + 1; },
      resend: async (payload) => { calls.resend.push(payload); return { error: null }; },
    } }),
    getAppOrigin: async () => 'http://localhost:3000',
    authErrorMessage,
    isSignupEnabled: lib.isSignupEnabled,
    isDevConfirmationLinkEnabled: lib.isDevConfirmationLinkEnabled,
    createAdminClient: () => ({ auth: { admin: { generateLink: async (payload) => { calls.generateLink.push(payload); return generateLinkResult; } } } }),
    URLSearchParams,
    provisionSignupAccount: lib.provisionSignupAccount,
    refreshSessionAfterSignup: lib.refreshSessionAfterSignup,
    SIGNUP_REJECTED_MESSAGE: lib.SIGNUP_REJECTED_MESSAGE,
    encryptSecret,
    requestPasswordResetSchema: schemas.requestPasswordResetSchema,
    signUpSchema: schemas.signUpSchema,
    getSignUpFieldErrors: validation.getSignUpFieldErrors,
    SIGN_UP_FIELDS: validation.SIGN_UP_FIELDS,
    LEGAL_VERSION: '1.0',
  });
  return { ...actions, calls };
}

const validSignup = { officeName: 'Souza Advocacia', taxId: '529.982.247-25', name: 'Ana Souza', email: 'Ana@Souza.adv.br', password: 'senhaForte123', passwordConfirm: 'senhaForte123', acceptTerms: 'on' };

test('cadastro: envia confirmação com os dados do escritório e não grava nada no banco', async () => {
  const { db, state } = makeDb();
  const ctx = loadSignUp({ db });
  const result = await ctx.signUpAction({}, form(validSignup));
  assert.deepEqual(normalized(result), { error: null, sentTo: 'ana@souza.adv.br' });
  const payload = ctx.calls.signUp[0];
  assert.equal(payload.email, 'ana@souza.adv.br');
  assert.equal(payload.password, 'senhaForte123');
  assert.equal(payload.options.emailRedirectTo, 'http://localhost:3000/auth/callback?next=/dashboard');
  const { terms_accepted_at: acceptedAt, ...metadata } = normalized(payload.options.data);
  assert.deepEqual(metadata, { name: 'Ana Souza', signup_office_name: 'Souza Advocacia', signup_tax_id: 'enc:52998224725', terms_version: '1.0' });
  assert.ok(Math.abs(Date.parse(acceptedAt) - Date.now()) < 60_000, 'data do aceite gerada pelo servidor');
  assert.equal(state.workspaces.length + state.users.length, 0, 'escritório só nasce após a confirmação');
});

test('cadastro: campo-armadilha preenchido finge sucesso sem chamar o Supabase', async () => {
  const ctx = loadSignUp();
  const result = await ctx.signUpAction({}, form({ ...validSignup, website: 'http://spam.example' }));
  assert.deepEqual(normalized(result), { error: null, sentTo: '' });
  assert.equal(ctx.calls.signUp.length, 0);
});

test('cadastro: valida campos antes de chamar o Supabase', async () => {
  const ctx = loadSignUp();
  const cases = [
    [{ officeName: 'AB' }, /nome do escritório/],
    [{ name: '' }, /nome completo/],
    [{ email: 'invalido' }, /e-mail válido/],
    [{ password: 'curta', passwordConfirm: 'curta' }, /pelo menos 8/],
    [{ passwordConfirm: 'outraSenha123' }, /não coincidem/],
    [{ acceptTerms: undefined }, /aceite os Termos de Uso/],
    [{ acceptTerms: 'sim' }, /aceite os Termos de Uso/],
  ];
  for (const [override, message] of cases) {
    const values = Object.fromEntries(Object.entries({ ...validSignup, ...override }).filter(([, value]) => value !== undefined));
    assert.match((await ctx.signUpAction({}, form(values))).error, message);
  }
  assert.equal(ctx.calls.signUp.length, 0);
});

test('cadastro: e-mail já cadastrado e senha fraca viram mensagens em português', async () => {
  const exists = loadSignUp({ signUpResult: { data: { user: null, session: null }, error: { code: 'user_already_exists', status: 422, message: 'User already registered' } } });
  const existsResult = await exists.signUpAction({}, form(validSignup));
  assert.match(existsResult.error, /já tem uma conta/);
  assert.ok(!existsResult.error.includes('registered'));

  const weak = loadSignUp({ signUpResult: { data: { user: null, session: null }, error: { code: 'weak_password', status: 422 } } });
  assert.match((await weak.signUpAction({}, form(validSignup))).error, /fraca/);
});

test('cadastro: erros voltam ligados ao campo certo', async () => {
  const ctx = loadSignUp();
  const result = await ctx.signUpAction({}, form({ officeName: 'AB', name: '', email: 'x', password: 'curta', passwordConfirm: 'curta' }));
  assert.deepEqual(Object.keys(result.fieldErrors).sort(), ['acceptTerms', 'email', 'name', 'officeName', 'password', 'taxId']);
  assert.match(result.fieldErrors.officeName, /nome do escritório/);
  assert.match(result.error, /nome do escritório/, 'mensagem geral é a do primeiro campo');
  assert.equal(ctx.calls.signUp.length, 0);

  const mismatch = await ctx.signUpAction({}, form({ ...validSignup, passwordConfirm: 'outraSenha123' }));
  assert.deepEqual(Object.keys(mismatch.fieldErrors), ['passwordConfirm']);

  const exists = loadSignUp({ signUpResult: { data: { user: null, session: null }, error: { code: 'user_already_exists', status: 422 } } });
  assert.match((await exists.signUpAction({}, form(validSignup))).fieldErrors.email, /já tem uma conta/);

  const weak = loadSignUp({ signUpResult: { data: { user: null, session: null }, error: { code: 'weak_password', status: 422 } } });
  assert.match((await weak.signUpAction({}, form(validSignup))).fieldErrors.password, /fraca/);

  const limited = loadSignUp({ signUpResult: { data: { user: null, session: null }, error: { code: 'over_email_send_rate_limit', status: 429 } } });
  const limitedResult = await limited.signUpAction({}, form(validSignup));
  assert.match(limitedResult.error, /Muitas tentativas/);
  assert.equal(limitedResult.fieldErrors, undefined, 'erro geral não fica preso a um campo');
});

test('validação por campo: dados válidos não geram erros', () => {
  assert.deepEqual(normalized(validation.getSignUpFieldErrors(validSignup)), {});
  assert.deepEqual(Object.keys(validation.getSignUpFieldErrors({ ...validSignup, password: 'outraSenha123' })), ['passwordConfirm']);
});

test('cadastro: com confirmação desligada no Supabase, cria o escritório e entra', async () => {
  const { db, state } = makeDb();
  const ctx = loadSignUp({ db, signUpResult: { data: { user: confirmedUser(), session: { access_token: 'x' } }, error: null } });
  await assert.rejects(ctx.signUpAction({}, form(validSignup)), (error) => error.url === '/dashboard');
  assert.equal(state.workspaces.length, 1);
  assert.equal(state.memberships[0].role, 'OWNER');
});

test('reenviar confirmação: resposta igual para qualquer e-mail', async () => {
  const ctx = loadSignUp();
  const result = await ctx.resendSignupConfirmationAction({}, form({ email: 'Ana@Souza.adv.br' }));
  assert.match(result.message, /enviamos um novo link/);
  assert.deepEqual(normalized(ctx.calls.resend[0]), { type: 'signup', email: 'ana@souza.adv.br', options: { emailRedirectTo: 'http://localhost:3000/auth/callback?next=/dashboard' } });
});

// ---------- Login ----------
function loadLogin({ signInResult, db, env = { NODE_ENV: 'development' } }) {
  const calls = { signOut: 0 };
  const lib = loadSignupLib(env, db);
  const { loginAction } = load('features/auth/actions/login.ts', ['loginAction'], {
    redirect: redirectTo, prisma: db, loginSchema: schemas.loginSchema,
    provisionSignupAccount: lib.provisionSignupAccount,
    refreshSessionAfterSignup: lib.refreshSessionAfterSignup,
    SIGNUP_REJECTED_MESSAGE: lib.SIGNUP_REJECTED_MESSAGE,
    createClient: async () => ({ auth: {
      signInWithPassword: async () => signInResult,
      refreshSession: async () => { calls.refresh = (calls.refresh ?? 0) + 1; },
      signOut: async (options) => { calls.signOut += 1; calls.signOutOptions = options; },
    } }),
  });
  return { login: (values) => loginAction({ error: null }, form(values)), calls };
}

test('login: e-mail ainda não confirmado recebe orientação específica', async () => {
  const ctx = loadLogin({ db: makeDb().db, signInResult: { data: { user: null }, error: { code: 'email_not_confirmed', status: 400 } } });
  assert.match((await ctx.login({ email: 'a@b.com', password: 'x' })).error, /Confirme seu e-mail/);
});

test('login: cadastro confirmado em outro aparelho cria o escritório no primeiro acesso', async () => {
  const { db, state } = makeDb();
  const ctx = loadLogin({ db, signInResult: { data: { user: confirmedUser() }, error: null } });
  await assert.rejects(ctx.login({ email: 'dona@escritorio.com.br', password: 'x' }), (error) => error.url === '/dashboard');
  assert.equal(state.workspaces.length, 1);
  assert.equal(ctx.calls.signOut, 0);
});

test('login: conta do Auth sem cadastro válido continua sem acesso', async () => {
  const { db, state } = makeDb();
  const ctx = loadLogin({ db, signInResult: { data: { user: confirmedUser({ user_metadata: {} }) }, error: null } });
  assert.match((await ctx.login({ email: 'x@y.com', password: 'x' })).error, /não possui acesso/);
  assert.equal(ctx.calls.signOut, 1);
  assert.equal(state.workspaces.length, 0);
});

// ---------- Retorno do link de confirmação ----------
function loadCallback({ exchangeError = null, user = confirmedUser(), db }) {
  const provisioned = [];
  const refreshed = { count: 0, signOut: 0 };
  const { GET } = load('app/auth/callback/route.ts', ['GET'], {
    NextResponse: { redirect: (url) => ({ location: url.toString() }) },
    createClient: async () => ({ auth: {
      exchangeCodeForSession: async () => ({ error: exchangeError }),
      verifyOtp: async () => ({ error: exchangeError }),
      getUser: async () => ({ data: { user } }),
      refreshSession: async () => { refreshed.count += 1; },
      signOut: async () => { refreshed.signOut += 1; },
    } }),
    refreshSessionAfterSignup: async (client) => client.auth.refreshSession(),
    // A rota só conhece o resultado; a regra fica na biblioteca.
    provisionSignupAccount: async (authUser) => { provisioned.push(authUser.id); return loadSignupLib({ NODE_ENV: 'development' }, db).provisionSignupAccount(authUser); },
  });
  const call = (path) => {
    const url = new URL(`http://localhost:3000${path}`);
    return GET({ nextUrl: Object.assign(url, { clone: () => new URL(url) }) });
  };
  return { call, provisioned, refreshed };
}

test('retorno do e-mail: confirmação válida cria o escritório e leva ao painel', async () => {
  const { db, state } = makeDb();
  const ctx = loadCallback({ db });
  const response = await ctx.call('/auth/callback?code=abc&next=/dashboard');
  assert.equal(response.location, 'http://localhost:3000/dashboard');
  assert.deepEqual(ctx.provisioned, ['auth-1']);
  assert.equal(state.workspaces.length, 1);
  assert.equal(ctx.refreshed.count, 1, 'sessão renovada sem os dados temporários');
});

test('retorno do e-mail: link inválido orienta conforme o tipo (cadastro x senha)', async () => {
  const signup = loadCallback({ db: makeDb().db, exchangeError: { code: 'bad_code_verifier' } });
  assert.equal((await signup.call('/auth/callback?code=abc&next=/dashboard')).location, 'http://localhost:3000/login?erro=confirmacao');
  assert.deepEqual(signup.provisioned, [], 'sem sessão não cria nada');

  const recovery = loadCallback({ db: makeDb().db, exchangeError: { code: 'otp_expired' } });
  assert.equal((await recovery.call('/auth/callback?code=abc&next=/redefinir-senha')).location, 'http://localhost:3000/login?erro=link-invalido');
});

test('middleware: /cadastro é pública e /setup deixou de existir', () => {
  const { isPublicRoute } = load('lib/supabase/proxy.ts', ['isPublicRoute']);
  assert.equal(isPublicRoute('/cadastro'), true);
  assert.equal(isPublicRoute('/termos'), true);
  assert.equal(isPublicRoute('/privacidade'), true);
  assert.equal(isPublicRoute('/setup'), false);
  assert.equal(isPublicRoute('/dashboard'), false);
});

// ---------- Dados do fornecedor (variáveis de ambiente) ----------
test('dados do fornecedor vêm do ambiente; sem eles, aparecem campos a preencher', () => {
  const loadLegal = (env) => load('features/legal/legal-info.ts', ['getLegalProvider', 'isLegalInfoComplete'], { process: { env } });

  const empty = loadLegal({}).getLegalProvider();
  assert.equal(empty.cpf, '[CPF]');
  assert.equal(empty.email, 'contato@lexflowjuridico.com.br');

  const filled = loadLegal({
    LEGAL_PROVIDER_NAME: 'Nome Teste', LEGAL_PROVIDER_CPF: '000.000.000-00',
    LEGAL_PROVIDER_ADDRESS: 'Rua Teste, 1', LEGAL_PROVIDER_FORUM: 'Cidade-UF',
  });
  assert.equal(filled.getLegalProvider().cpf, '000.000.000-00');
  assert.equal(loadLegal({ LEGAL_PROVIDER_CPF: '   ' }).getLegalProvider().cpf, '[CPF]', 'valor em branco conta como ausente');
  // Ainda falta o provedor de e-mail na lista de suboperadores.
  assert.equal(filled.isLegalInfoComplete(), false);
});

test('código-fonte não contém dados pessoais do fornecedor', () => {
  const source = readFileSync(resolve(root, 'src/features/legal/legal-info.ts'), 'utf8');
  assert.ok(!/\d{3}\.\d{3}\.\d{3}-\d{2}/.test(source), 'nenhum CPF no código');
  assert.match(source, /process\.env\.LEGAL_PROVIDER_CPF/);
});

// ---------- Sair da conta ----------
test('sair encerra só a sessão deste navegador e volta ao login', async () => {
  const calls = [];
  const { logoutAction } = load('features/auth/actions/logout.ts', ['logoutAction'], {
    redirect: redirectTo,
    createClient: async () => ({ auth: { signOut: async (options) => { calls.push(options); return { error: null }; } } }),
  });
  await assert.rejects(logoutAction(), (error) => error.url === '/login');
  assert.deepEqual(normalized(calls), [{ scope: 'local' }]);
});

// ---------- Dados opcionais do cadastro em etapas ----------
const fullSignup = {
  ...validSignup,
  taxId: '11.222.333/0001-81', city: ' Vitória ', state: 'es',
  whatsapp: '(27) 99999-1234', oabNumber: '12345', oabState: 'ES',
};

test('documentos: CPF, CNPJ e WhatsApp são conferidos de verdade', () => {
  assert.equal(documents.isValidCpf('529.982.247-25'), true);
  for (const invalid of ['529.982.247-24', '111.111.111-11', '123']) assert.equal(documents.isValidCpf(invalid), false, invalid);
  assert.equal(documents.isValidCnpj('11.222.333/0001-81'), true);
  for (const invalid of ['11.222.333/0001-82', '00.000.000/0000-00']) assert.equal(documents.isValidCnpj(invalid), false, invalid);
  assert.equal(documents.isValidBrazilPhone('(27) 99999-1234'), true);
  assert.equal(documents.isValidBrazilPhone('(27) 3333-1234'), true);
  for (const invalid of ['(27) 89999-1234', '(07) 99999-1234', '99999-1234']) assert.equal(documents.isValidBrazilPhone(invalid), false, invalid);
  assert.equal(documents.maskTaxId('52998224725'), '529.982.247-25');
  assert.equal(documents.maskTaxId('11222333000181'), '11.222.333/0001-81');
});

test('etapas: cada campo pertence a uma etapa e os opcionais podem ficar em branco', () => {
  assert.deepEqual(normalized(validation.SIGN_UP_STEPS.map((step) => step.id)), ['escritorio', 'responsavel', 'acesso']);
  assert.equal(new Set(validation.SIGN_UP_FIELDS).size, validation.SIGN_UP_FIELDS.length);
  assert.equal(validation.getSignUpStepIndex('whatsapp'), 1);
  assert.deepEqual(normalized(validation.getSignUpFieldErrors({ ...validSignup, city: '', state: '', whatsapp: '', oabNumber: '', oabState: '' })), {});
  assert.deepEqual(normalized(validation.getSignUpFieldErrors(fullSignup)), {});
});

test('etapas: opcional preenchido errado é apontado no campo; OAB exige número e UF', () => {
  const errors = (override) => Object.keys(validation.getSignUpFieldErrors({ ...validSignup, ...override }));
  assert.deepEqual(errors({ taxId: '111.111.111-11' }), ['taxId']);
  assert.deepEqual(errors({ whatsapp: '123' }), ['whatsapp']);
  assert.deepEqual(errors({ state: 'XX' }), ['state']);
  assert.deepEqual(errors({ oabNumber: '12345' }), ['oabState']);
  assert.deepEqual(errors({ oabState: 'ES' }), ['oabNumber']);
});

test('cadastro: dados opcionais seguem normalizados até a confirmação', async () => {
  const ctx = loadSignUp();
  await ctx.signUpAction({}, form(fullSignup));
  const data = normalized(ctx.calls.signUp[0].options.data);
  assert.equal(data.signup_tax_id, 'enc:11222333000181', 'documento nunca vai aberto ao Supabase');
  assert.equal(data.signup_whatsapp, '27999991234');
  assert.equal(data.signup_city, 'Vitória');
  assert.equal(data.signup_state, 'ES');
  assert.equal(data.signup_oab_number, '12345');
  assert.equal(data.signup_oab_state, 'ES');
});

function signupUserWith(extra) {
  return confirmedUser({ user_metadata: { ...confirmedUser().user_metadata, ...extra } });
}

test('confirmação: CNPJ e demais dados vão para o escritório e a cobrança; temporários são apagados', async () => {
  const { db, state } = makeDb();
  const updates = [];
  const lib = loadSignupLib({ NODE_ENV: 'development' }, db, true, updates);
  assert.equal(await lib.provisionSignupAccount(signupUserWith({
    signup_tax_id: 'enc:11222333000181', signup_whatsapp: '27999991234', signup_city: 'Vitória',
    signup_state: 'ES', signup_oab_number: '12345', signup_oab_state: 'ES',
  })), 'created');
  const workspace = state.workspaces[0];
  assert.equal(workspace.cnpj, '11222333000181');
  assert.equal(workspace.whatsapp, '27999991234');
  assert.equal(workspace.city, 'Vitória');
  assert.equal(workspace.state, 'ES');
  assert.equal(workspace.oabRegistration, '12345');
  assert.equal(workspace.oabState, 'ES');
  assert.deepEqual(normalized(state.billingProfiles), [{ workspaceId: 'w1', name: 'Souza Advocacia Previdenciária', taxId: '11222333000181', city: 'Vitória', state: 'ES' }]);
  const cleared = normalized(updates[0].attributes.user_metadata);
  assert.equal(updates[0].id, 'auth-1');
  assert.equal(cleared.signup_tax_id, null);
  assert.equal(cleared.signup_whatsapp, null);
  assert.ok(!('name' in cleared), 'o nome continua na conta');
});

test('confirmação: CPF fica só na cobrança; opcional adulterado é ignorado sem travar o cadastro', async () => {
  const { db, state } = makeDb();
  const lib = loadSignupLib({ NODE_ENV: 'development' }, db);
  assert.equal(await lib.provisionSignupAccount(signupUserWith({ signup_tax_id: 'enc:52998224725', signup_whatsapp: 'x', signup_oab_number: '123' })), 'created');
  assert.equal(state.workspaces[0].cnpj, null);
  assert.equal(state.workspaces[0].whatsapp, null);
  assert.equal(state.workspaces[0].oabRegistration, null, 'OAB sem UF não é gravada');
  assert.equal(state.billingProfiles[0].name, 'Ana Souza');
  assert.equal(state.billingProfiles[0].taxId, '52998224725');
});

test('confirmação: sem dados opcionais, a cobrança nasce só com nome e documento', async () => {
  const { db, state } = makeDb();
  await loadSignupLib({ NODE_ENV: 'development' }, db).provisionSignupAccount(confirmedUser());
  assert.deepEqual(normalized(state.billingProfiles), [{ workspaceId: 'w1', name: 'Ana Souza', taxId: '52998224725', city: null, state: null }]);
});

test('conta já criada: nova passagem apaga dados temporários que tenham sobrado', async () => {
  const { db } = makeDb({ users: [{ id: 'auth-1' }] });
  const updates = [];
  const lib = loadSignupLib({ NODE_ENV: 'development' }, db, true, updates);
  assert.equal(await lib.provisionSignupAccount(signupUserWith({ signup_tax_id: '52998224725' })), 'exists');
  assert.equal(updates.length, 1);
  assert.equal(await lib.provisionSignupAccount(confirmedUser({ user_metadata: { name: 'Ana' } })), 'exists');
  assert.equal(updates.length, 1, 'sem dados temporários não há o que limpar');
});

// ---------- CPF/CNPJ obrigatório e um cadastro por documento ----------
test('CNPJ alfanumérico: valida, normaliza e aplica máscara', () => {
  assert.equal(documents.isValidCnpj('12.ABC.345/01DE-35'), true);
  assert.equal(documents.isValidCnpj('12abc34501de35'), true);
  assert.equal(documents.isValidTaxId('12.ABC.345/01DE-35'), true);
  for (const invalid of ['12.ABC.345/01DE-36', '12.ABC.345/01DE-3A', 'AAAAAAAAAAAAAA']) assert.equal(documents.isValidCnpj(invalid), false, invalid);
  assert.equal(documents.isValidTaxId('5299822472A'), false, 'CPF não tem letras');
  assert.equal(documents.normalizeTaxId('12.abc.345/01de-35'), '12ABC34501DE35');
  assert.equal(documents.maskTaxId('12abc34501de35'), '12.ABC.345/01DE-35');
  assert.equal(documents.maskTaxId('12a'), '12.A');
  assert.equal(documents.maskCnpj('11222333000181'), '11.222.333/0001-81');
});

test('titular do documento: matriz e filiais contam como um só', () => {
  assert.equal(documents.getTaxIdOwnerKey('11.222.333/0001-81'), documents.getTaxIdOwnerKey('11.222.333/0002-62'));
  assert.notEqual(documents.getTaxIdOwnerKey('11.222.333/0001-81'), documents.getTaxIdOwnerKey('12.ABC.345/01DE-35'));
  assert.equal(documents.getTaxIdOwnerKey('529.982.247-25'), 'cpf:52998224725');
});

test('cadastro: CPF ou CNPJ é obrigatório e bloqueia antes do Supabase', async () => {
  const ctx = loadSignUp();
  const result = await ctx.signUpAction({}, form({ ...validSignup, taxId: '' }));
  assert.deepEqual(Object.keys(result.fieldErrors), ['taxId']);
  assert.match(result.fieldErrors.taxId, /Informe o CPF ou CNPJ/);
  assert.equal(ctx.calls.signUp.length, 0);
  assert.equal(validation.getSignUpStepIndex('taxId'), 0);
});

const secondUser = (taxId) => signupUserWith({ signup_tax_id: `enc:${taxId}` });
const otherAuthUser = (taxId) => ({ ...secondUser(taxId), id: 'auth-2', email: 'outra@pessoa.com.br' });

test('um cadastro por documento: repetição não cria nada e apaga a identidade nova', async () => {
  const { db, state } = makeDb();
  const deletes = [];
  const lib = loadSignupLib({ NODE_ENV: 'development' }, db, true, [], deletes);
  assert.equal(await lib.provisionSignupAccount(confirmedUser()), 'created');
  assert.deepEqual(normalized(state.claims), [{ taxIdHash: 'signup-tax-id|cpf:52998224725', workspaceId: 'w1' }]);
  assert.ok(!JSON.stringify(state.claims).includes('workspaceTaxId'));

  assert.equal(await lib.provisionSignupAccount(otherAuthUser('52998224725')), 'rejected');
  assert.deepEqual(deletes, ['auth-2']);
  assert.equal(state.workspaces.length, 1);
  assert.equal(state.users.length, 1);
  assert.equal(state.billingProfiles.length, 1);
});

test('um cadastro por documento: filial do mesmo CNPJ não abre outro teste; outro titular abre', async () => {
  const { db, state } = makeDb();
  const lib = loadSignupLib({ NODE_ENV: 'development' }, db);
  assert.equal(await lib.provisionSignupAccount(secondUser('11222333000181')), 'created');
  assert.equal(await lib.provisionSignupAccount(otherAuthUser('11222333000262')), 'rejected');
  assert.equal(await lib.provisionSignupAccount(otherAuthUser('12ABC34501DE35')), 'created');
  assert.equal(state.workspaces.length, 2);
  assert.equal(state.workspaces[1].cnpj, '12ABC34501DE35');
});

test('um cadastro por documento: dois acessos simultâneos não passam juntos', async () => {
  const { db, state } = makeDb();
  const deletes = [];
  const lib = loadSignupLib({ NODE_ENV: 'development' }, db, true, [], deletes);
  const original = db.$transaction;
  db.$transaction = async (fn) => {
    state.claims.push({ taxIdHash: 'signup-tax-id|cpf:52998224725', workspaceId: 'outro' });
    return original(fn);
  };
  assert.equal(await lib.provisionSignupAccount(confirmedUser()), 'rejected');
  assert.equal(state.workspaces.length, 0, 'a tentativa foi desfeita');
  assert.deepEqual(deletes, ['auth-1']);
});

test('cadastro recusado: se não conseguir apagar a identidade, apaga os dados temporários', async () => {
  const { db } = makeDb();
  const updates = [];
  const lib = loadSignupLib({ NODE_ENV: 'development' }, db, true, updates, [], { code: 'unexpected_failure' });
  await lib.provisionSignupAccount(confirmedUser());
  updates.length = 0;
  assert.equal(await lib.provisionSignupAccount(otherAuthUser('52998224725')), 'rejected');
  assert.equal(updates[0].id, 'auth-2');
  assert.equal(normalized(updates[0].attributes.user_metadata).signup_tax_id, null);
});

test('documento adulterado ou ausente nos dados da conta não cria escritório', async () => {
  for (const metadata of [{ signup_tax_id: '52998224725' }, { signup_tax_id: 'enc:11111111111' }, { signup_tax_id: undefined }]) {
    const { db, state } = makeDb();
    assert.equal(await loadSignupLib({ NODE_ENV: 'development' }, db).provisionSignupAccount(signupUserWith(metadata)), 'not-eligible');
    assert.equal(state.workspaces.length, 0);
  }
});

test('mensagem de recusa não revela que o documento já existe', () => {
  const message = loadSignupLib({}, makeDb().db).SIGNUP_REJECTED_MESSAGE;
  assert.doesNotMatch(message, /CPF|CNPJ|documento/i);
  assert.match(message, /contato@lexflowjuridico\.com\.br/);
});

test('documento repetido: login, cadastro direto e link de e-mail encerram a sessão', async () => {
  const claimed = () => { const made = makeDb(); made.state.claims.push({ taxIdHash: 'signup-tax-id|cpf:52998224725', workspaceId: 'w9' }); return made; };

  const login = loadLogin({ db: claimed().db, signInResult: { data: { user: confirmedUser() }, error: null } });
  assert.match((await login.login({ email: 'dona@escritorio.com.br', password: 'x' })).error, /novo cadastro/);
  assert.equal(login.calls.signOut, 1);
  assert.equal(login.calls.signOutOptions.scope, 'local');

  const direct = loadSignUp({ db: claimed().db, signUpResult: { data: { user: confirmedUser(), session: { access_token: 'x' } }, error: null } });
  assert.match((await direct.signUpAction({}, form(validSignup))).error, /novo cadastro/);
  assert.equal(direct.calls.signOut, 1);

  const link = loadCallback({ db: claimed().db });
  assert.equal((await link.call('/auth/callback?code=abc&next=/dashboard')).location, 'http://localhost:3000/login?erro=cadastro-indisponivel');
  assert.equal(link.refreshed.signOut, 1);
});

// ---------- Limpeza de cadastros não confirmados ----------
function loadCleanup({ users, activeIds = [], deleteError = null }) {
  const deleted = [];
  const pages = [];
  const { deleteExpiredUnconfirmedSignups } = load('features/auth/lib/signup-cleanup.ts', ['deleteExpiredUnconfirmedSignups'], {
    prisma: { user: { findMany: async ({ where }) => where.id.in.filter((id) => activeIds.includes(id)).map((id) => ({ id })) } },
    createAdminClient: () => ({ auth: { admin: {
      listUsers: async ({ page, perPage }) => { pages.push(page); return { data: { users: users.slice((page - 1) * perPage, page * perPage) }, error: null }; },
      deleteUser: async (id) => { deleted.push(id); return { error: deleteError }; },
    } } }),
  });
  return { run: deleteExpiredUnconfirmedSignups, deleted, pages };
}

const NOW = new Date('2026-11-18T12:00:00Z');
const authRow = (id, overrides = {}) => ({ id, created_at: '2026-11-01T00:00:00Z', email_confirmed_at: null, user_metadata: { signup_office_name: 'Escritório' }, ...overrides });

test('limpeza: só apaga cadastro público vencido, sem confirmação e sem usuário no LexFlow', async () => {
  const ctx = loadCleanup({
    activeIds: ['ativo'],
    users: [
      authRow('vencido'),
      authRow('recente', { created_at: '2026-11-15T00:00:00Z' }),
      authRow('confirmado', { email_confirmed_at: '2026-11-01T01:00:00Z' }),
      authRow('convidado', { user_metadata: { name: 'Convidado' } }),
      authRow('ativo'),
    ],
  });
  assert.deepEqual(normalized(await ctx.run(NOW)), { deleted: 1, failed: 0 });
  assert.deepEqual(ctx.deleted, ['vencido']);
});

test('limpeza: percorre todas as páginas e conta falhas', async () => {
  const users = Array.from({ length: 1001 }, (_, index) => authRow(`u${index}`));
  const ctx = loadCleanup({ users, deleteError: { code: 'x' } });
  assert.deepEqual(normalized(await ctx.run(NOW)), { deleted: 0, failed: 1001 });
  assert.deepEqual(ctx.pages, [1, 2]);
});

function loadCronRoute(env, cleanup = async () => ({ deleted: 2, failed: 0 })) {
  const { GET } = load('app/api/cron/limpar-cadastros/route.ts', ['GET'], {
    process: { env }, createHash, timingSafeEqual, Buffer,
    NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) },
    deleteExpiredUnconfirmedSignups: cleanup,
  });
  return (authorization) => GET({ headers: { get: () => authorization ?? null } });
}

test('rota de limpeza: exige o segredo e não executa sem ele', async () => {
  let runs = 0;
  const cleanup = async () => { runs += 1; return { deleted: 2, failed: 0 }; };
  assert.equal((await loadCronRoute({}, cleanup)('Bearer qualquer')).status, 401, 'sem CRON_SECRET fica fechada');
  const call = loadCronRoute({ CRON_SECRET: 'segredo' }, cleanup);
  assert.equal((await call()).status, 401);
  assert.equal((await call('Bearer errado')).status, 401);
  assert.equal(runs, 0);
  const ok = await call('Bearer segredo');
  assert.equal(ok.status, 200);
  assert.equal(ok.body.deleted, 2);
  assert.equal(runs, 1);
  const failing = loadCronRoute({ CRON_SECRET: 'segredo' }, async () => { throw new Error('falha'); });
  assert.equal((await failing('Bearer segredo')).status, 500);
});

test('middleware: rota de limpeza não redireciona ao login; o resto de /api continua protegido', () => {
  const { isPublicRoute } = load('lib/supabase/proxy.ts', ['isPublicRoute']);
  assert.equal(isPublicRoute('/api/cron/limpar-cadastros'), true);
  assert.equal(isPublicRoute('/api/google-calendar/connect'), false);
});

// ---------- Configurações com CNPJ alfanumérico ----------
function settingsAction(file, name) {
  const saved = [];
  const model = new Proxy({}, { get: () => async (args) => { saved.push(args); return {}; } });
  const action = load(file, [name], {
    ...documents,
    revalidatePath: () => {},
    requireWorkspacePermission: async () => ({ workspace: { id: 'w1' }, membership: { role: 'OWNER' }, user: { id: 'u1' } }),
    prisma: new Proxy({}, { get: () => model }),
  })[name];
  return { action, saved };
}

test('Configurações: aceitam CNPJ alfanumérico e recusam documento inválido', async () => {
  const office = settingsAction('features/settings/actions/update-workspace.ts', 'updateWorkspaceAction');
  assert.equal((await office.action(form({ name: 'Escritório', cnpj: '12.abc.345/01de-35' }))).success, true);
  assert.equal(office.saved.at(-1).data.cnpj, '12ABC34501DE35');
  assert.match((await office.action(form({ name: 'Escritório', cnpj: '12.ABC.345/01DE-36' }))).error, /CNPJ válido/);

  const billing = settingsAction('features/settings/actions/update-billing-profile.ts', 'updateBillingProfileAction');
  assert.equal((await billing.action(form({ taxId: '12.ABC.345/01DE-35' }))).success, true);
  assert.match((await billing.action(form({ taxId: '111.111.111-11' }))).error, /CPF ou CNPJ válido/);
});

// ---------- Teste grátis e modo somente consulta ----------
const DAY = 24 * 60 * 60 * 1000;
const NOW_MS = Date.parse('2026-11-18T12:00:00Z');

test('teste grátis: dura 10 dias e só o teste vencido limita o escritório', () => {
  assert.equal(trial.TRIAL_DAYS, 10);
  assert.equal(trial.getTrialEndsAt(new Date(NOW_MS)).getTime(), NOW_MS + 10 * DAY);
  const now = new Date(NOW_MS);
  const cases = [
    [null, false],
    [{ status: 'TRIALING', trialEndsAt: new Date(NOW_MS + 1) }, false],
    [{ status: 'TRIALING', trialEndsAt: new Date(NOW_MS) }, true],
    [{ status: 'TRIALING', trialEndsAt: new Date(NOW_MS - DAY) }, true],
    [{ status: 'TRIALING', trialEndsAt: null }, false],
    [{ status: 'ACTIVE', trialEndsAt: new Date(NOW_MS - DAY) }, false],
  ];
  for (const [subscription, expected] of cases) assert.equal(trial.isWorkspaceReadOnly(subscription, now), expected, JSON.stringify(subscription));
});

test('confirmação: o escritório nasce com 10 dias de teste', async () => {
  const { db, state } = makeDb();
  const before = Date.now();
  await loadSignupLib({ NODE_ENV: 'development' }, db).provisionSignupAccount(confirmedUser());
  assert.equal(state.subscriptions.length, 1);
  const [subscription] = state.subscriptions;
  assert.equal(subscription.workspaceId, 'w1');
  assert.equal(subscription.planName, 'Teste grátis');
  const ends = new Date(subscription.trialEndsAt).getTime();
  assert.ok(ends >= before + 10 * DAY && ends <= Date.now() + 10 * DAY);
});

class ActionError extends Error {}

function loadPermissions({ role = 'OWNER', subscription = null } = {}) {
  return load('lib/permissions.ts', ['hasPermission', 'canUsePermission', 'getCurrentWorkspaceAccess', 'requireWorkspacePermission', 'requireWorkspacePagePermission'], {
    cache: (fn) => fn,
    redirect: redirectTo,
    ActionError,
    getCurrentAuthUserId: async () => 'u1',
    isWorkspaceReadOnly: trial.isWorkspaceReadOnly,
    TRIAL_ENDED_MESSAGE: trial.TRIAL_ENDED_MESSAGE,
    prisma: { membership: { findFirst: async () => ({ id: 'm1', role, user: { id: 'u1' }, workspace: { id: 'w1', name: 'Escritório', subscription } }) } },
  });
}

const expiredTrial = { status: 'TRIALING', trialEndsAt: new Date(Date.now() - DAY) };
const runningTrial = { status: 'TRIALING', trialEndsAt: new Date(Date.now() + DAY) };

test('teste vencido: bloqueia escrita no servidor e mantém consulta, cobrança e equipe', async () => {
  const access = loadPermissions({ subscription: expiredTrial });
  for (const permission of ['CLIENT_VIEW', 'CASE_VIEW', 'WORK_VIEW', 'AGENDA_VIEW', 'DOCUMENT_VIEW', 'FINANCE_VIEW', 'GOV_VIEW', 'BILLING_MANAGE', 'TEAM_MANAGE']) {
    assert.equal((await access.requireWorkspacePermission(permission)).readOnly, true, permission);
  }
  for (const permission of ['CLIENT_CREATE', 'CLIENT_EDIT', 'CLIENT_DELETE', 'CASE_CREATE', 'CASE_EDIT', 'WORK_CREATE', 'WORK_EDIT', 'WORK_DELETE', 'AGENDA_CREATE', 'AGENDA_EDIT', 'AGENDA_DELETE', 'DOCUMENT_CREATE', 'DOCUMENT_DELETE', 'FINANCE_WRITE', 'OFFICE_MANAGE', 'GOV_MANAGE']) {
    await assert.rejects(access.requireWorkspacePermission(permission), (error) => error instanceof ActionError && error.message === trial.TRIAL_ENDED_MESSAGE, permission);
  }
});

test('teste em andamento, assinatura ativa e escritório antigo mantêm acesso completo', async () => {
  for (const subscription of [runningTrial, { status: 'ACTIVE', trialEndsAt: expiredTrial.trialEndsAt }, null]) {
    const access = loadPermissions({ subscription });
    assert.equal((await access.requireWorkspacePermission('CLIENT_CREATE')).readOnly, false);
    assert.equal((await access.requireWorkspacePagePermission('CLIENT_CREATE')).membership.workspaceReadOnly, false);
  }
});

test('teste vencido: páginas de edição levam a /assinar; falta de perfil continua em /sem-acesso', async () => {
  const owner = loadPermissions({ subscription: expiredTrial });
  await assert.rejects(owner.requireWorkspacePagePermission('CLIENT_CREATE'), (error) => error.url === '/assinar');
  assert.equal((await owner.requireWorkspacePagePermission('CLIENT_VIEW')).readOnly, true);
  assert.equal((await owner.requireWorkspacePagePermission('OFFICE_MANAGE')).readOnly, true, 'dados do escritório seguem visíveis');
  const viewer = loadPermissions({ role: 'VIEWER', subscription: expiredTrial });
  await assert.rejects(viewer.requireWorkspacePagePermission('CLIENT_CREATE'), (error) => error.url === '/sem-acesso');
  await assert.rejects(viewer.requireWorkspacePermission('CLIENT_CREATE'), /permissão/);
});

test('acesso: dados da assinatura não vazam no objeto do escritório', async () => {
  const access = await loadPermissions({ subscription: expiredTrial }).getCurrentWorkspaceAccess();
  assert.equal('subscription' in access.workspace, false);
  assert.equal('subscription' in access.membership.workspace, false);
});

test('páginas: botões de escrita consideram o modo de consulta', () => {
  const write = /hasPermission\(\s*membership\.role,\s*"(?:[A-Z]+_(?:CREATE|EDIT|DELETE|WRITE)|GOV_MANAGE)"/;
  const dir = resolve(root, 'src/app');
  const offenders = readdirSync(dir, { recursive: true }).map(String).filter((name) => /\.tsx?$/.test(name) && write.test(readFileSync(resolve(dir, name), 'utf8')));
  assert.deepEqual(offenders, []);
});

// ---------- Confirmação sem e-mail no ambiente de desenvolvimento ----------
test('desenvolvimento: gera o link na tela e não pede envio de e-mail', async () => {
  const ctx = loadSignUp({ env: { NODE_ENV: 'development' } });
  const result = await ctx.signUpAction({}, form(validSignup));
  assert.equal(ctx.calls.signUp.length, 0);
  const [payload] = ctx.calls.generateLink;
  assert.equal(payload.type, 'signup');
  assert.equal(payload.email, 'ana@souza.adv.br');
  assert.equal(payload.password, 'senhaForte123');
  assert.equal(payload.options.data.signup_tax_id, 'enc:52998224725');
  assert.equal(result.sentTo, 'ana@souza.adv.br');
  assert.equal(result.devConfirmationUrl, 'http://localhost:3000/auth/callback?token_hash=hash%2B1&type=signup&next=%2Fdashboard');
});

test('link de desenvolvimento: desliga por variável e nunca vale em produção', async () => {
  const off = loadSignUp({ env: { NODE_ENV: 'development', SIGNUP_DEV_CONFIRM_LINK: 'false' } });
  assert.equal((await off.signUpAction({}, form(validSignup))).devConfirmationUrl, undefined);
  assert.equal(off.calls.generateLink.length, 0);
  assert.equal(off.calls.signUp.length, 1);

  const production = loadSignUp({ env: { NODE_ENV: 'production', SIGNUP_ENABLED: 'true', SIGNUP_DEV_CONFIRM_LINK: 'true' } });
  assert.equal((await production.signUpAction({}, form(validSignup))).devConfirmationUrl, undefined);
  assert.equal(production.calls.generateLink.length, 0);
  assert.equal(production.calls.signUp.length, 1);
});

test('link de desenvolvimento: e-mail já cadastrado aparece no campo', async () => {
  const ctx = loadSignUp({ env: { NODE_ENV: 'development' }, generateLinkResult: { data: { properties: null }, error: { code: 'email_exists', status: 422 } } });
  const result = await ctx.signUpAction({}, form(validSignup));
  assert.match(result.fieldErrors.email, /já tem uma conta/);
  assert.equal(result.sentTo, null);
});

test('retorno do link com token_hash confirma e cria o escritório', async () => {
  const { db, state } = makeDb();
  const ctx = loadCallback({ db });
  const response = await ctx.call('/auth/callback?token_hash=hash%2B1&type=signup&next=%2Fdashboard');
  assert.equal(response.location, 'http://localhost:3000/dashboard');
  assert.equal(state.workspaces.length, 1);
  assert.equal(state.subscriptions.length, 1);
});

// ---------- E-mail que já aparece no LexFlow ----------
test('e-mail de registro antigo sem escritório: o registro dá lugar à conta confirmada', async () => {
  const { db, state } = makeDb({ users: [{ id: 'antigo', email: 'dona@escritorio.com.br' }] });
  assert.equal(await loadSignupLib({ NODE_ENV: 'development' }, db).provisionSignupAccount(confirmedUser()), 'created');
  assert.deepEqual(state.users.map((user) => user.id), ['auth-1']);
  assert.equal(state.workspaces.length, 1);
});

test('e-mail de quem participa de um escritório: nada muda e o cadastro é recusado', async () => {
  const { db, state } = makeDb({ users: [{ id: 'membro', email: 'dona@escritorio.com.br' }] });
  state.memberships.push({ userId: 'membro', workspaceId: 'w9', role: 'OWNER' });
  const deletes = [];
  assert.equal(await loadSignupLib({ NODE_ENV: 'development' }, db, true, [], deletes).provisionSignupAccount(confirmedUser()), 'rejected');
  assert.deepEqual(state.users.map((user) => user.id), ['membro']);
  assert.equal(state.workspaces.length, 0);
  assert.equal(state.claims.length, 0, 'o documento não fica travado');
  assert.deepEqual(deletes, ['auth-1']);
});

test('retorno do e-mail: falha ao criar o escritório leva ao login, sem abrir o painel', async () => {
  const failing = makeDb({ failUserCreate: () => { throw new Error('banco fora do ar'); } });
  const signup = loadCallback({ db: failing.db });
  assert.equal((await signup.call('/auth/callback?code=abc&next=/dashboard')).location, 'http://localhost:3000/login?erro=cadastro-pendente');
  assert.equal(signup.refreshed.signOut, 1);

  const recovery = loadCallback({ db: makeDb({ failUserCreate: () => { throw new Error('banco fora do ar'); } }).db });
  assert.equal((await recovery.call('/auth/callback?code=abc&next=/redefinir-senha')).location, 'http://localhost:3000/redefinir-senha');
  assert.equal(recovery.refreshed.signOut, 0, 'recuperação de senha não é afetada');
});
