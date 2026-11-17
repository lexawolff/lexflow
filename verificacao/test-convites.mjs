// Node >= 20.17; usa o TypeScript já instalado no projeto. Executa as funções reais de
// convite e recuperação de senha com banco e Supabase simulados; não acessa nada externo.
// Uso: node --test verificacao/test-convites.mjs   (a partir da raiz do projeto)
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { createHash, randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const root = resolve(process.argv[2] || '.');
const requireFromProject = createRequire(resolve(root, 'package.json'));
const typescript = requireFromProject('typescript');
const { z } = requireFromProject('zod');

function load(file, names, deps = {}) {
  const ts = readFileSync(resolve(root, 'src', file), 'utf8');
  const js = typescript.transpileModule(ts, { compilerOptions: { target: typescript.ScriptTarget.ES2022, module: typescript.ModuleKind.ESNext } }).outputText.replace(/^export\s*\{\s*\};?\s*$/gm, '').replace(/^import[\s\S]*?;\s*/gm, '').replace(/\bexport\s+/g, '');
  return runInNewContext(`${js}\n;({${names.join(',')}})`, { ...deps, console, FormData });
}

// Objetos criados dentro do vm têm outro protótipo; compara só o conteúdo.
const normalized = (value) => JSON.parse(JSON.stringify(value));
const UserRole = { OWNER: 'OWNER', ADMIN: 'ADMIN', LAWYER: 'LAWYER', INTERN: 'INTERN', FINANCIAL: 'FINANCIAL', VIEWER: 'VIEWER' };
class ActionError extends Error {}
const sha256 = (value) => createHash('sha256').update(value, 'utf8').digest('hex');
const DAY = 24 * 60 * 60 * 1000;

const inv = load('features/settings/lib/invitations.ts', [
  'generateInvitationToken', 'hashInvitationToken', 'isWellFormedInvitationToken', 'invitationExpiresAt',
  'getInvitationStatus', 'canInviteRole', 'invitationUnavailableMessage', 'INVITATION_TTL_DAYS',
], { createHash, randomBytes, UserRole });

const { authErrorMessage } = load('features/auth/lib/auth-error-message.ts', ['authErrorMessage']);
const schemas = load('features/auth/schemas/auth-schema.ts', ['acceptInvitationSchema', 'changePasswordSchema', 'newPasswordFormSchema'], { z });

function form(values) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

// ---------- Banco simulado ----------
function makeDb({ users = [], invitations = [] } = {}) {
  const state = { users: structuredClone(users), memberships: [], invitations: structuredClone(invitations), failCreateMembership: false, lockedOverride: null };
  const matches = (row, where) => Object.entries(where).every(([key, value]) => (value === null ? row[key] == null : row[key] === value));
  const db = {
    user: {
      findUnique: async ({ where, select }) => {
        const user = state.users.find((u) => u.email === where.email);
        if (!user) return null;
        if (select?.memberships) {
          const wid = select.memberships.where.workspaceId;
          return { memberships: (user.memberships ?? []).filter((m) => m.workspaceId === wid).map((m) => ({ id: m.id })) };
        }
        return { id: user.id };
      },
      create: async ({ data }) => { state.users.push({ ...data, memberships: [] }); return data; },
    },
    membership: {
      create: async ({ data }) => {
        if (state.failCreateMembership) throw new Error('falha simulada do banco');
        state.memberships.push(data);
        return data;
      },
    },
    workspaceInvitation: {
      updateMany: async ({ where, data }) => {
        const rows = state.invitations.filter((row) => matches(row, where));
        rows.forEach((row) => Object.assign(row, data));
        return { count: rows.length };
      },
      create: async ({ data }) => { const row = { id: `inv-${state.invitations.length + 1}`, acceptedAt: null, revokedAt: null, ...data }; state.invitations.push(row); return row; },
      findFirst: async ({ where }) => state.invitations.find((row) => matches(row, where)) ?? null,
      findUnique: async ({ where }) => state.invitations.find((row) => row.tokenHash === where.tokenHash) ?? null,
      update: async ({ where, data }) => { const row = state.invitations.find((r) => r.id === where.id); Object.assign(row, data); return row; },
    },
    $queryRaw: async (strings, ...values) => {
      assert.ok(strings.join('?').includes('FOR UPDATE'), 'o aceite deve bloquear a linha do convite');
      const row = state.invitations.find((r) => r.id === values[0]);
      if (!row) return [];
      return [{ ...row, ...(state.lockedOverride ?? {}) }];
    },
    $transaction: async (fn) => {
      const backup = structuredClone({ users: state.users, memberships: state.memberships, invitations: state.invitations });
      try { return await fn(db); } catch (error) { Object.assign(state, backup); throw error; }
    },
  };
  return { db, state };
}

// ---------- Regras puras ----------
test('token: 256 bits em base64url, hash SHA-256 e formato validado', () => {
  const { token, tokenHash } = inv.generateInvitationToken();
  assert.match(token, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(tokenHash, sha256(token));
  assert.notEqual(inv.generateInvitationToken().token, token);
  assert.ok(inv.isWellFormedInvitationToken(token));
  for (const bad of ['', 'abc', `${token}x`, `${token.slice(0, 42)}/`, '../../etc/passwd', null, 42]) {
    assert.equal(inv.isWellFormedInvitationToken(bad), false, String(bad));
  }
});

test('status do convite: aceito e cancelado têm prioridade sobre expiração', () => {
  const now = new Date('2026-11-17T12:00:00Z');
  const future = new Date(now.getTime() + DAY);
  const past = new Date(now.getTime() - 1);
  assert.equal(inv.getInvitationStatus({ acceptedAt: null, revokedAt: null, expiresAt: future }, now), 'PENDENTE');
  assert.equal(inv.getInvitationStatus({ acceptedAt: null, revokedAt: null, expiresAt: past }, now), 'EXPIRADO');
  assert.equal(inv.getInvitationStatus({ acceptedAt: null, revokedAt: null, expiresAt: now }, now), 'EXPIRADO');
  assert.equal(inv.getInvitationStatus({ acceptedAt: now, revokedAt: null, expiresAt: past }, now), 'ACEITO');
  assert.equal(inv.getInvitationStatus({ acceptedAt: null, revokedAt: now, expiresAt: past }, now), 'CANCELADO');
  assert.equal(inv.invitationExpiresAt(now).getTime() - now.getTime(), inv.INVITATION_TTL_DAYS * DAY);
});

test('quem pode convidar para cada função', () => {
  for (const role of Object.values(UserRole)) {
    assert.equal(inv.canInviteRole('OWNER', role), true);
    assert.equal(inv.canInviteRole('ADMIN', role), role !== 'OWNER');
    for (const requester of ['LAWYER', 'INTERN', 'FINANCIAL', 'VIEWER']) assert.equal(inv.canInviteRole(requester, role), false);
  }
});

// ---------- Actions da tela de equipe ----------
function loadTeamActions({ role = 'OWNER', allowed = true, db }) {
  const revalidated = [];
  const actions = load('features/settings/actions/invitation-actions.ts', ['createInvitationImpl', 'regenerateInvitationLinkImpl', 'revokeInvitationImpl'], {
    UserRole, z, ActionError,
    revalidatePath: (path) => revalidated.push(path),
    runAction: async (fn) => fn(),
    requireWorkspacePermission: async (permission) => {
      assert.equal(permission, 'TEAM_MANAGE');
      if (!allowed) throw new ActionError('Você não possui permissão para realizar esta operação.');
      return { workspace: { id: 'w1' }, membership: { userId: 'u-owner', role } };
    },
    prisma: db,
    canInviteRole: inv.canInviteRole, generateInvitationToken: inv.generateInvitationToken,
    getInvitationStatus: inv.getInvitationStatus, invitationExpiresAt: inv.invitationExpiresAt,
  });
  return { ...actions, revalidated };
}

test('criar convite: sem TEAM_MANAGE é bloqueado antes do banco', async () => {
  const { db, state } = makeDb();
  const { createInvitationImpl } = loadTeamActions({ allowed: false, db });
  await assert.rejects(createInvitationImpl(form({ email: 'a@b.com', role: 'LAWYER' })), /permissão/);
  assert.equal(state.invitations.length, 0);
});

test('criar convite: valida e-mail e função; administrador não convida proprietário', async () => {
  const { db, state } = makeDb();
  const owner = loadTeamActions({ db });
  await assert.rejects(owner.createInvitationImpl(form({ email: 'invalido', role: 'LAWYER' })), /e-mail válido/);
  await assert.rejects(owner.createInvitationImpl(form({ email: 'a@b.com', role: 'SUPERUSER' })), /função/);
  const admin = loadTeamActions({ role: 'ADMIN', db });
  await assert.rejects(admin.createInvitationImpl(form({ email: 'a@b.com', role: 'OWNER' })), /Apenas um proprietário/);
  assert.equal(state.invitations.length, 0);
  await admin.createInvitationImpl(form({ email: 'a@b.com', role: 'ADMIN' }));
  assert.equal(state.invitations.length, 1);
});

test('criar convite: e-mail que já tem conta é recusado', async () => {
  const { db } = makeDb({ users: [
    { id: 'u1', email: 'membro@x.com', memberships: [{ id: 'm1', workspaceId: 'w1' }] },
    { id: 'u2', email: 'outro@x.com', memberships: [{ id: 'm2', workspaceId: 'w2' }] },
  ] });
  const { createInvitationImpl } = loadTeamActions({ db });
  await assert.rejects(createInvitationImpl(form({ email: 'MEMBRO@x.com', role: 'LAWYER' })), /já faz parte do escritório/);
  await assert.rejects(createInvitationImpl(form({ email: 'outro@x.com', role: 'LAWYER' })), /já possui conta/);
});

test('criar convite: guarda só o hash, normaliza e-mail, expira em 7 dias e invalida convite anterior', async () => {
  const { db, state } = makeDb();
  const { createInvitationImpl, revalidated } = loadTeamActions({ db });
  const first = await createInvitationImpl(form({ email: '  Nova@Email.com ', role: 'INTERN' }));
  const second = await createInvitationImpl(form({ email: 'nova@email.com', role: 'LAWYER' }));
  const token = second.invitePath.replace('/convite/', '');
  assert.ok(inv.isWellFormedInvitationToken(token));
  assert.equal(second.email, 'nova@email.com');
  const [old, current] = state.invitations;
  assert.ok(old.revokedAt, 'o primeiro link deve ser cancelado');
  assert.equal(current.tokenHash, sha256(token));
  assert.ok(!JSON.stringify(state.invitations).includes(token), 'o token não pode ser gravado no banco');
  assert.equal(current.workspaceId, 'w1');
  assert.equal(current.role, 'LAWYER');
  assert.equal(current.invitedByUserId, 'u-owner');
  const ttl = new Date(second.expiresAt).getTime() - Date.now();
  assert.ok(ttl > 7 * DAY - 60_000 && ttl <= 7 * DAY);
  assert.notEqual(first.invitePath, second.invitePath);
  assert.ok(revalidated.includes('/configuracoes/equipe'));
});

test('novo link e cancelamento: só no próprio escritório, só convites abertos, regra de proprietário', async () => {
  const base = { email: 'p@x.com', tokenHash: 'h0', invitedByUserId: 'u', expiresAt: new Date(Date.now() - DAY), acceptedAt: null, revokedAt: null };
  const { db, state } = makeDb({ invitations: [
    { ...base, id: '11111111-1111-4111-8111-111111111111', workspaceId: 'w1', role: 'LAWYER' },
    { ...base, id: '22222222-2222-4222-8222-222222222222', workspaceId: 'w2', role: 'LAWYER' },
    { ...base, id: '33333333-3333-4333-8333-333333333333', workspaceId: 'w1', role: 'OWNER' },
    { ...base, id: '44444444-4444-4444-8444-444444444444', workspaceId: 'w1', role: 'LAWYER', acceptedAt: new Date() },
  ] });
  const owner = loadTeamActions({ db });
  const admin = loadTeamActions({ role: 'ADMIN', db });
  await assert.rejects(owner.regenerateInvitationLinkImpl(form({ invitationId: 'nao-e-uuid' })), /Convite inválido/);
  await assert.rejects(owner.regenerateInvitationLinkImpl(form({ invitationId: '22222222-2222-4222-8222-222222222222' })), /não encontrado/);
  await assert.rejects(owner.regenerateInvitationLinkImpl(form({ invitationId: '44444444-4444-4444-8444-444444444444' })), /já foi aceito/);
  await assert.rejects(admin.regenerateInvitationLinkImpl(form({ invitationId: '33333333-3333-4333-8333-333333333333' })), /proprietário/);
  await assert.rejects(admin.revokeInvitationImpl(form({ invitationId: '33333333-3333-4333-8333-333333333333' })), /proprietário/);

  // Convite expirado pode receber novo link: renova prazo e troca o hash.
  const link = await admin.regenerateInvitationLinkImpl(form({ invitationId: '11111111-1111-4111-8111-111111111111' }));
  const renewed = state.invitations[0];
  assert.equal(renewed.tokenHash, sha256(link.invitePath.replace('/convite/', '')));
  assert.equal(inv.getInvitationStatus(renewed, new Date()), 'PENDENTE');

  await admin.revokeInvitationImpl(form({ invitationId: '11111111-1111-4111-8111-111111111111' }));
  assert.ok(state.invitations[0].revokedAt);
  await assert.rejects(admin.revokeInvitationImpl(form({ invitationId: '11111111-1111-4111-8111-111111111111' })), /já foi cancelado/);
  assert.equal(state.invitations[1].revokedAt, null, 'convite de outro escritório intocado');
});

// ---------- Aceite pelo link (rota pública) ----------
function setupAccept({ invitation, users = [], createUserError = null } = {}) {
  const token = inv.generateInvitationToken().token;
  const invitations = invitation ? [{ id: 'inv-1', workspaceId: 'w1', email: 'novo@x.com', role: 'INTERN', tokenHash: sha256(token), invitedByUserId: 'u-owner', expiresAt: new Date(Date.now() + DAY), acceptedAt: null, revokedAt: null, ...invitation }] : [];
  const { db, state } = makeDb({ users, invitations });
  const calls = { createUser: [], deleteUser: [], signIn: [] };
  const { acceptInvitationAction } = load('features/auth/actions/accept-invitation.ts', ['acceptInvitationAction'], {
    ActionError, prisma: db,
    redirect: (url) => { throw Object.assign(new Error('NEXT_REDIRECT'), { url }); },
    createAdminClient: () => ({ auth: { admin: {
      createUser: async (payload) => { calls.createUser.push(payload); return createUserError ? { data: { user: null }, error: createUserError } : { data: { user: { id: 'auth-uuid-1' } }, error: null }; },
      deleteUser: async (id) => { calls.deleteUser.push(id); return { error: null }; },
    } } }),
    createClient: async () => ({ auth: { signInWithPassword: async (payload) => { calls.signIn.push(payload); return { error: null }; } } }),
    getInvitationStatus: inv.getInvitationStatus, hashInvitationToken: inv.hashInvitationToken,
    invitationUnavailableMessage: inv.invitationUnavailableMessage, isWellFormedInvitationToken: inv.isWellFormedInvitationToken,
    authErrorMessage, acceptInvitationSchema: schemas.acceptInvitationSchema,
  });
  const accept = (values, useToken = token) => acceptInvitationAction(useToken, { error: null }, form(values));
  return { accept, state, calls, token };
}

const validForm = { name: 'Maria Souza', password: 'senhaForte123', passwordConfirm: 'senhaForte123' };

test('aceite: sucesso cria conta com e-mail e função do convite, marca aceito e entra', async () => {
  const { accept, state, calls } = setupAccept({ invitation: {} });
  // Campos extras forjados no formulário são ignorados.
  await assert.rejects(accept({ ...validForm, email: 'atacante@x.com', role: 'OWNER' }), (error) => error.url === '/dashboard');
  assert.equal(calls.createUser.length, 1);
  assert.equal(calls.createUser[0].email, 'novo@x.com');
  assert.equal(calls.createUser[0].email_confirm, true);
  assert.equal(state.users.at(-1).id, 'auth-uuid-1');
  assert.equal(state.users.at(-1).name, 'Maria Souza');
  assert.deepEqual(normalized(state.memberships), [{ userId: 'auth-uuid-1', workspaceId: 'w1', role: 'INTERN' }]);
  assert.ok(state.invitations[0].acceptedAt);
  assert.deepEqual(normalized(calls.signIn), [{ email: 'novo@x.com', password: 'senhaForte123' }]);
  assert.equal(calls.deleteUser.length, 0);
});

test('aceite: link adulterado, inexistente, expirado, cancelado ou já usado não cria conta', async () => {
  const cases = [
    [setupAccept({ invitation: {} }), 'curto-demais', /Convite inválido/],
    [setupAccept({ invitation: {} }), inv.generateInvitationToken().token, /Convite inválido/],
    [setupAccept({ invitation: { expiresAt: new Date(Date.now() - 1000) } }), null, /expirou/],
    [setupAccept({ invitation: { revokedAt: new Date() } }), null, /cancelado/],
    [setupAccept({ invitation: { acceptedAt: new Date() } }), null, /já foi utilizado/],
  ];
  for (const [ctx, token, message] of cases) {
    const result = await ctx.accept(validForm, token ?? ctx.token);
    assert.match(result.error, message);
    assert.equal(ctx.calls.createUser.length, 0);
    assert.equal(ctx.state.memberships.length, 0);
  }
});

test('aceite: senha curta, confirmação diferente ou nome vazio são recusados', async () => {
  const ctx = setupAccept({ invitation: {} });
  assert.match((await ctx.accept({ ...validForm, password: 'curta', passwordConfirm: 'curta' })).error, /pelo menos 8/);
  assert.match((await ctx.accept({ ...validForm, passwordConfirm: 'outraSenha123' })).error, /não coincidem/);
  assert.match((await ctx.accept({ ...validForm, name: ' ' })).error, /nome/);
  assert.match((await ctx.accept({ ...validForm, password: 'a'.repeat(73), passwordConfirm: 'a'.repeat(73) })).error, /no máximo 72/);
  assert.equal(ctx.calls.createUser.length, 0);
});

test('aceite: e-mail já cadastrado (no LexFlow ou só no Auth) mostra mensagem e não vincula', async () => {
  const inLexFlow = setupAccept({ invitation: {}, users: [{ id: 'u9', email: 'novo@x.com' }] });
  assert.match((await inLexFlow.accept(validForm)).error, /Já existe uma conta/);
  assert.equal(inLexFlow.calls.createUser.length, 0);

  const inAuth = setupAccept({ invitation: {}, createUserError: { code: 'email_exists', status: 422, message: 'A user with this email address has already been registered' } });
  const result = await inAuth.accept(validForm);
  assert.match(result.error, /Já existe uma conta/);
  assert.ok(!result.error.includes('registered'), 'mensagem do Supabase não é repassada');
  assert.equal(inAuth.state.memberships.length, 0);
});

test('aceite: convite cancelado/aceito enquanto o formulário estava aberto desfaz a conta criada', async () => {
  const ctx = setupAccept({ invitation: {} });
  ctx.state.lockedOverride = { acceptedAt: new Date() }; // outro envio venceu a corrida
  const result = await ctx.accept(validForm);
  assert.match(result.error, /já foi utilizado/);
  assert.deepEqual(ctx.calls.deleteUser, ['auth-uuid-1']);
  assert.equal(ctx.state.memberships.length, 0);
  assert.equal(ctx.state.users.length, 0);
  assert.equal(ctx.calls.signIn.length, 0);
});

test('aceite: falha no banco remove a identidade do Auth e não vaza detalhes', async () => {
  const ctx = setupAccept({ invitation: {} });
  ctx.state.failCreateMembership = true;
  const result = await ctx.accept(validForm);
  assert.equal(result.error, 'Não foi possível concluir seu cadastro. Tente novamente.');
  assert.deepEqual(ctx.calls.deleteUser, ['auth-uuid-1']);
  assert.equal(ctx.state.users.length, 0, 'transação desfeita');
  assert.equal(ctx.state.invitations[0].acceptedAt, null, 'convite continua disponível');
});

// ---------- Senhas e rotas ----------
test('troca de senha: exige senha atual e nova senha diferente', () => {
  assert.equal(schemas.changePasswordSchema.safeParse({ currentPassword: '', password: 'novaSenha123', passwordConfirm: 'novaSenha123' }).success, false);
  const same = schemas.changePasswordSchema.safeParse({ currentPassword: 'mesmaSenha1', password: 'mesmaSenha1', passwordConfirm: 'mesmaSenha1' });
  assert.match(same.error.issues[0].message, /diferente da atual/);
  assert.equal(schemas.changePasswordSchema.safeParse({ currentPassword: 'antiga123', password: 'novaSenha123', passwordConfirm: 'novaSenha123' }).success, true);
  assert.equal(schemas.newPasswordFormSchema.safeParse({ password: 'novaSenha123', passwordConfirm: 'outra' }).success, false);
});

test('erros do Supabase Auth viram mensagens em português sem repassar o texto original', () => {
  assert.match(authErrorMessage({ code: 'weak_password' }, 'x'), /fraca/);
  assert.match(authErrorMessage({ code: 'same_password' }, 'x'), /diferente/);
  assert.match(authErrorMessage({ status: 429 }, 'x'), /Muitas tentativas/);
  assert.equal(authErrorMessage({ code: 'desconhecido', message: 'internal stack' }, 'padrão'), 'padrão');
});

test('retorno do e-mail (/auth/callback): bloqueia redirecionamento para outro site', () => {
  const { safeNextPath } = load('app/auth/callback/route.ts', ['safeNextPath']);
  assert.equal(safeNextPath('/redefinir-senha'), '/redefinir-senha');
  for (const evil of ['https://evil.com', '//evil.com', '/\\evil.com', 'evil.com', '', null]) {
    assert.equal(safeNextPath(evil), '/dashboard', String(evil));
  }
});

test('middleware: convite e recuperação são públicos; redefinição exige sessão', () => {
  const { isPublicRoute } = load('lib/supabase/proxy.ts', ['isPublicRoute']);
  assert.equal(isPublicRoute('/convite/abc'), true);
  assert.equal(isPublicRoute('/recuperar-senha'), true);
  assert.equal(isPublicRoute('/auth/callback'), true);
  assert.equal(isPublicRoute('/redefinir-senha'), false);
  assert.equal(isPublicRoute('/conviteX'), false);
  assert.equal(isPublicRoute('/configuracoes/equipe'), false);
});
