// Node >= 20.17; usa o TypeScript já instalado no projeto. Executa o cadastro público de
// escritórios (ações, criação após confirmação, login e retorno do e-mail) com
// Supabase e banco simulados; não acessa nada externo.
// Uso: node --test verificacao/test-cadastro.mjs   (a partir da raiz do projeto)
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { randomBytes } from 'node:crypto';
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
const schemas = load('features/auth/schemas/auth-schema.ts', ['signUpSchema', 'signupMetadataSchema', 'requestPasswordResetSchema', 'loginSchema'], { z });
const { authErrorMessage } = load('features/auth/lib/auth-error-message.ts', ['authErrorMessage']);
const redirectTo = (url) => { throw Object.assign(new Error('NEXT_REDIRECT'), { url }); };

function form(values) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

// ---------- Banco simulado ----------
function makeDb({ users = [], failUserCreate = null } = {}) {
  const state = { users: structuredClone(users), workspaces: [], memberships: [] };
  const db = {
    user: {
      findUnique: async ({ where }) => state.users.find((user) => user.id === where.id) ?? null,
      create: async ({ data }) => {
        if (failUserCreate) failUserCreate(state);
        if (state.users.some((user) => user.id === data.id)) throw Object.assign(new Error('Unique constraint'), { code: 'P2002' });
        state.users.push(data);
        return data;
      },
    },
    workspace: { create: async ({ data }) => { const row = { id: `w${state.workspaces.length + 1}`, ...data }; state.workspaces.push(row); return row; } },
    membership: { create: async ({ data }) => { state.memberships.push(data); return data; } },
    $transaction: async (fn) => {
      const backup = structuredClone(state);
      try { return await fn(db); } catch (error) { Object.assign(state, backup); throw error; }
    },
  };
  return { db, state };
}

function loadSignupLib(env, db, legalComplete = true) {
  return load('features/auth/lib/signup.ts', ['isSignupEnabled', 'buildWorkspaceSlug', 'provisionSignupAccount'], {
    process: { env }, randomBytes, UserRole, prisma: db, signupMetadataSchema: schemas.signupMetadataSchema,
    isLegalInfoComplete: () => legalComplete,
  });
}

const confirmedUser = (overrides = {}) => ({
  id: 'auth-1', email: 'Dona@Escritorio.com.br', email_confirmed_at: '2026-11-17T10:00:00Z',
  user_metadata: { name: 'Ana Souza', signup_office_name: 'Souza Advocacia Previdenciária', terms_version: '1.0', terms_accepted_at: '2026-11-17T09:59:00.000Z' }, ...overrides,
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
function loadSignUp({ env = { NODE_ENV: 'development' }, signUpResult = { data: { user: { id: 'auth-1' }, session: null }, error: null }, db = makeDb().db } = {}) {
  const calls = { signUp: [], signOut: 0, resend: [] };
  const lib = loadSignupLib(env, db);
  const actions = load('features/auth/actions/signup.ts', ['signUpAction', 'resendSignupConfirmationAction'], {
    redirect: redirectTo,
    createClient: async () => ({ auth: {
      signUp: async (payload) => { calls.signUp.push(payload); return signUpResult; },
      signOut: async () => { calls.signOut += 1; },
      resend: async (payload) => { calls.resend.push(payload); return { error: null }; },
    } }),
    getAppOrigin: async () => 'http://localhost:3000',
    authErrorMessage,
    isSignupEnabled: lib.isSignupEnabled,
    provisionSignupAccount: lib.provisionSignupAccount,
    requestPasswordResetSchema: schemas.requestPasswordResetSchema,
    signUpSchema: schemas.signUpSchema,
    LEGAL_VERSION: '1.0',
  });
  return { ...actions, calls };
}

const validSignup = { officeName: 'Souza Advocacia', name: 'Ana Souza', email: 'Ana@Souza.adv.br', password: 'senhaForte123', passwordConfirm: 'senhaForte123', acceptTerms: 'on' };

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
  assert.deepEqual(metadata, { name: 'Ana Souza', signup_office_name: 'Souza Advocacia', terms_version: '1.0' });
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
    createClient: async () => ({ auth: {
      signInWithPassword: async () => signInResult,
      signOut: async () => { calls.signOut += 1; },
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
  const { GET } = load('app/auth/callback/route.ts', ['GET'], {
    NextResponse: { redirect: (url) => ({ location: url.toString() }) },
    createClient: async () => ({ auth: {
      exchangeCodeForSession: async () => ({ error: exchangeError }),
      verifyOtp: async () => ({ error: exchangeError }),
      getUser: async () => ({ data: { user } }),
    } }),
    provisionSignupAccount: async (authUser) => { provisioned.push(authUser.id); return loadSignupLib({ NODE_ENV: 'development' }, db).provisionSignupAccount(authUser); },
  });
  const call = (path) => {
    const url = new URL(`http://localhost:3000${path}`);
    return GET({ nextUrl: Object.assign(url, { clone: () => new URL(url) }) });
  };
  return { call, provisioned };
}

test('retorno do e-mail: confirmação válida cria o escritório e leva ao painel', async () => {
  const { db, state } = makeDb();
  const ctx = loadCallback({ db });
  const response = await ctx.call('/auth/callback?code=abc&next=/dashboard');
  assert.equal(response.location, 'http://localhost:3000/dashboard');
  assert.deepEqual(ctx.provisioned, ['auth-1']);
  assert.equal(state.workspaces.length, 1);
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
