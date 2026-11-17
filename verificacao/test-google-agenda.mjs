// Node >= 20.17; usa o TypeScript já instalado no projeto. Executa a regra real de importação
// do Google Agenda (applyGoogleEvent) com banco simulado; não acessa o Google.
// Uso: node --test verificacao/test-google-agenda.mjs   (a partir da raiz do projeto)
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const root = resolve(process.argv[2] || '.');
const typescript = createRequire(resolve(root, 'package.json'))('typescript');

const TaskSource = { LEXFLOW: 'LEXFLOW', GOOGLE_CALENDAR: 'GOOGLE_CALENDAR' };
const TaskStatus = { PENDENTE: 'PENDENTE', EM_ANDAMENTO: 'EM_ANDAMENTO', CONCLUIDA: 'CONCLUIDA', CANCELADA: 'CANCELADA', ATRASADA: 'ATRASADA' };
const TaskType = { OUTRO: 'OUTRO', AUDIENCIA: 'AUDIENCIA' };

function setup(tasks = []) {
  const state = { tasks: structuredClone(tasks), created: [], updated: [] };
  const matches = (row, where) => Object.entries(where).every(([key, value]) => row[key] === value);
  const prisma = {
    task: {
      findFirst: async ({ where }) => state.tasks.find((row) => matches(row, where)) ?? null,
      create: async ({ data }) => { state.created.push(data); return data; },
      update: async ({ where, data }) => { state.updated.push({ id: where.id, data }); return data; },
    },
  };
  const ts = readFileSync(resolve(root, 'src/features/settings/services/sync-google-calendar.ts'), 'utf8');
  const js = typescript.transpileModule(ts, { compilerOptions: { target: typescript.ScriptTarget.ES2022, module: typescript.ModuleKind.ESNext } })
    .outputText.replace(/^import[\s\S]*?;\s*/gm, '').replace(/\bexport\s+/g, '');
  const { applyGoogleEvent } = runInNewContext(`${js}\n;({ applyGoogleEvent })`, {
    prisma, TaskSource, TaskStatus, TaskType, console, Intl, Date,
    google: {}, decryptSecret: () => '', createGoogleOAuthClient: () => ({}),
  });
  return { apply: (event) => applyGoogleEvent(connection, event), state };
}

const connection = { id: 'conn-1', workspaceId: 'w1', userId: 'u1', calendarId: 'primary' };
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
const later = new Date(tomorrow.getTime() + 60 * 60 * 1000);
const timed = { start: { dateTime: tomorrow.toISOString() }, end: { dateTime: later.toISOString() } };
const lexflowTag = (taskId) => ({ extendedProperties: { private: { lexflowTaskId: taskId, lexflowWorkspaceId: 'w1' } } });

test('evento pessoal novo do Google não vira tarefa do escritório', async () => {
  const ctx = setup();
  const result = await ctx.apply({ id: 'g-pessoal', summary: 'Consulta médica', status: 'confirmed', ...timed });
  assert.equal(result.imported, 0);
  assert.equal(ctx.state.created.length, 0);
});

test('evento pessoal já importado deixa de ser atualizado ou cancelado', async () => {
  const legacy = { id: 't-legado', workspaceId: 'w1', source: 'GOOGLE_CALENDAR', status: 'PENDENTE', googleConnectionId: 'conn-1', googleEventId: 'g-antigo' };
  const ctx = setup([legacy]);
  await ctx.apply({ id: 'g-antigo', summary: 'Novo título pessoal', status: 'confirmed', ...timed });
  await ctx.apply({ id: 'g-antigo', status: 'cancelled' });
  assert.equal(ctx.state.updated.length, 0);
});

test('compromisso criado no LexFlow continua sincronizando a partir do Google', async () => {
  const task = { id: 't-lexflow', workspaceId: 'w1', source: 'LEXFLOW', status: 'PENDENTE', googleConnectionId: 'conn-1', googleEventId: 'g-lexflow' };
  const ctx = setup([task]);
  const moved = await ctx.apply({ id: 'g-lexflow', summary: 'Audiência remarcada', status: 'confirmed', ...timed, ...lexflowTag('t-lexflow') });
  assert.equal(moved.updated, 1);
  assert.equal(ctx.state.updated[0].data.title, 'Audiência remarcada');

  const cancelled = await ctx.apply({ id: 'g-lexflow', status: 'cancelled', ...lexflowTag('t-lexflow') });
  assert.equal(cancelled.cancelled, 1);
});

test('tarefa do LexFlow publicada sem marca (versão antiga) continua sincronizando', async () => {
  const task = { id: 't-antiga', workspaceId: 'w1', source: 'LEXFLOW', status: 'PENDENTE', googleConnectionId: 'conn-1', googleEventId: 'g-sem-marca' };
  const ctx = setup([task]);
  const result = await ctx.apply({ id: 'g-sem-marca', summary: 'Perícia', status: 'confirmed', ...timed });
  assert.equal(result.updated, 1);
});

test('evento marcado de outro escritório é ignorado', async () => {
  const ctx = setup();
  const result = await ctx.apply({ id: 'g-outro', summary: 'X', status: 'confirmed', ...timed, extendedProperties: { private: { lexflowTaskId: 't9', lexflowWorkspaceId: 'w2' } } });
  assert.deepEqual([result.imported, result.updated], [0, 0]);
  assert.equal(ctx.state.created.length + ctx.state.updated.length, 0);
});
