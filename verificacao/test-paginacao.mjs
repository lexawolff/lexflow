// Node >= 20.17; usa o TypeScript já instalado no projeto. Executa a paginação real de
// clientes (servidor) e o paginador das listas do financeiro, com banco simulado.
// Uso: node --test verificacao/test-paginacao.mjs   (a partir da raiz do projeto)
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const root = resolve(process.argv[2] || '.');
const typescript = createRequire(resolve(root, 'package.json'))('typescript');

function load(file, names, deps = {}) {
  const ts = readFileSync(resolve(root, 'src', file), 'utf8');
  const js = typescript.transpileModule(ts, { compilerOptions: { target: typescript.ScriptTarget.ES2022, module: typescript.ModuleKind.ESNext, jsx: typescript.JsxEmit.ReactJSX } }).outputText.replace(/^export\s*\{\s*\};?\s*$/gm, '').replace(/^import[\s\S]*?;\s*/gm, '').replace(/\bexport\s+/g, '');
  return runInNewContext(`${js}\n;({${names.join(',')}})`, { ...deps, console });
}

const normalized = (value) => JSON.parse(JSON.stringify(value));

// ---------- Clientes (paginação no servidor) ----------
function setupClients({ total = 45, matchingIds = [] } = {}) {
  const calls = { count: [], findMany: [], raw: [] };
  const { getClients, parseClientSort } = load('features/clients/services/get-clients.ts', ['getClients', 'parseClientSort'], {
    requireWorkspacePermission: async (permission) => { assert.equal(permission, 'CLIENT_VIEW'); return { workspace: { id: 'w1' } }; },
    prisma: {
      $queryRaw: async (strings, ...values) => { calls.raw.push({ sql: strings.join('?'), values }); return matchingIds.map((id) => ({ id })); },
      client: {
        count: async (query) => { calls.count.push(query); return total; },
        findMany: async (query) => { calls.findMany.push(query); return []; },
      },
    },
  });
  return { getClients, parseClientSort, calls };
}

test('clientes: devolve só a página pedida, com 20 por página', async () => {
  const ctx = setupClients({ total: 45 });
  const result = await ctx.getClients({ page: 2 });
  const query = ctx.calls.findMany[0];
  assert.equal(result.page, 2);
  assert.equal(result.pageCount, 3);
  assert.equal(result.total, 45);
  assert.equal(query.skip, 20);
  assert.equal(query.take, 20);
  assert.equal(query.where.workspaceId, 'w1');
  assert.equal(ctx.calls.raw.length, 0, 'sem busca não executa SQL manual');
});

test('clientes: página fora do intervalo é corrigida', async () => {
  for (const [requested, expected] of [[99, 3], [0, 1], [-5, 1], [Number.NaN, 1], [2.7, 2]]) {
    const ctx = setupClients({ total: 45 });
    const result = await ctx.getClients({ page: requested });
    assert.equal(result.page, expected, `página ${requested}`);
    assert.equal(ctx.calls.findMany[0].skip, (expected - 1) * 20);
  }
  const empty = setupClients({ total: 0 });
  assert.equal((await empty.getClients({ page: 5 })).page, 1, 'lista vazia fica na página 1');
});

test('clientes: busca filtra no banco pelo escritório e pelos ids encontrados', async () => {
  const ctx = setupClients({ total: 2, matchingIds: ['c1', 'c2'] });
  await ctx.getClients({ q: '  João (11) 9876 ' });
  const raw = ctx.calls.raw[0];
  assert.ok(raw.sql.includes('"workspaceId" ='), 'a busca SQL é restrita ao escritório');
  assert.equal(raw.values[0], 'w1');
  assert.ok(raw.values.includes('joao (11) 9876'), 'termo normalizado sem acento e minúsculo');
  assert.ok(raw.values.includes('119876'), 'números extraídos para CPF/telefone');
  assert.deepEqual(normalized(ctx.calls.findMany[0].where), { workspaceId: 'w1', id: { in: ['c1', 'c2'] } });
  assert.deepEqual(normalized(ctx.calls.count[0].where), normalized(ctx.calls.findMany[0].where), 'contagem e lista usam o mesmo filtro');
});

test('clientes: ordenação aceita só valores conhecidos e sempre tem desempate', async () => {
  const ctx = setupClients();
  assert.equal(ctx.parseClientSort('-cidade'), '-cidade');
  assert.equal(ctx.parseClientSort('senha'), 'nome', 'valor desconhecido volta ao padrão');
  assert.equal(ctx.parseClientSort(undefined), 'nome');

  const expectations = {
    nome: [{ name: 'asc' }, { id: 'asc' }],
    '-nome': [{ name: 'desc' }, { id: 'asc' }],
    cidade: [{ city: { sort: 'asc', nulls: 'last' } }, { name: 'asc' }, { id: 'asc' }],
    '-processos': [{ cases: { _count: 'desc' } }, { name: 'asc' }, { id: 'asc' }],
    'DROP TABLE': [{ name: 'asc' }, { id: 'asc' }],
  };
  for (const [sort, orderBy] of Object.entries(expectations)) {
    const run = setupClients();
    const result = await run.getClients({ sort });
    assert.deepEqual(normalized(run.calls.findMany[0].orderBy), orderBy, sort);
    assert.ok(['nome', '-nome', 'cidade', '-cidade', 'processos', '-processos'].includes(result.sort));
  }
});

test('clientes: termo muito longo é limitado antes de ir ao banco', async () => {
  const ctx = setupClients({ matchingIds: [] });
  await ctx.getClients({ q: 'a'.repeat(500) + '9'.repeat(100) });
  const values = ctx.calls.raw[0].values.filter((value) => typeof value === 'string');
  assert.ok(values.every((value) => value.length <= 100), 'nenhum parâmetro com mais de 100 caracteres');
});

// ---------- Listas do financeiro (paginação no navegador) ----------
const { paginate } = load('components/pagination/pagination-bar.tsx', ['paginate'], {
  Link: () => null, ChevronLeft: () => null, ChevronRight: () => null,
});

test('financeiro: paginate fatia a lista e corrige páginas inválidas', () => {
  const items = Array.from({ length: 45 }, (_, index) => index + 1);
  assert.deepEqual(normalized(paginate(items, 1, 20).pageItems), items.slice(0, 20));
  assert.deepEqual(normalized(paginate(items, 3, 20).pageItems), [41, 42, 43, 44, 45]);
  assert.equal(paginate(items, 3, 20).pageCount, 3);
  assert.equal(paginate(items, 10, 20).page, 3, 'filtro que reduz a lista não deixa a página vazia');
  assert.equal(paginate(items, 0, 20).page, 1);
  assert.deepEqual(normalized(paginate([], 4, 20)), { pageItems: [], page: 1, pageCount: 1 });
});
