// Node >= 20.17; usa o TypeScript já instalado no projeto. Executa as funções reais de
// formatação de datas e do upload direto ao Storage com dependências simuladas.
// Uso: node --test verificacao/test-datas-upload.mjs   (a partir da raiz do projeto)
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
  return runInNewContext(`${js}\n;({${names.join(',')}})`, { ...deps, console, FormData });
}

const normalized = (value) => JSON.parse(JSON.stringify(value));
class ActionError extends Error {}

// ---------- Datas ----------
const dates = load('lib/format/date.ts', ['formatDate', 'formatDateOnly', 'formatDateTime', 'OFFICE_TIME_ZONE']);

test('data sem horário mostra o dia certo, gravada à 00:00 ou às 12:00 UTC', () => {
  assert.equal(dates.formatDateOnly(new Date('1980-03-05T00:00:00Z')), '05/03/1980'); // nascimento (00:00 UTC)
  assert.equal(dates.formatDateOnly(new Date('2026-12-10T12:00:00Z')), '10/12/2026'); // DER/distribuição (12:00 UTC)
  assert.equal(dates.formatDateOnly(null), '—');
});

test('momentos usam o horário de São Paulo, mesmo com servidor em UTC', () => {
  // 01:30 UTC do dia 17 = 22:30 do dia 16 em São Paulo.
  const lateNight = new Date('2026-11-17T01:30:00Z');
  assert.equal(dates.OFFICE_TIME_ZONE, 'America/Sao_Paulo');
  assert.equal(dates.formatDate(lateNight), '16/11/2026');
  assert.match(dates.formatDateTime(lateNight), /^16\/11\/2026,? 22:30$/);
  assert.match(dates.formatDateTime(new Date('2026-11-17T15:00:00Z')), /12:00$/);
});

test('linha do tempo formata no horário de São Paulo', () => {
  const source = readFileSync(resolve(root, 'src/features/timeline/components/timeline-date.tsx'), 'utf8');
  assert.ok(!/from "date-fns"/.test(source), 'não deve depender do fuso do servidor');
  assert.equal((source.match(/timeZone: OFFICE_TIME_ZONE/g) || []).length, 2);
});

// ---------- Regras de caminho no Storage ----------
const rules = load('features/documents/document-upload-rules.ts', ['getFileExtension', 'isAllowedDocumentFile', 'validateDocumentFile', 'MAX_DOCUMENT_SIZE_BYTES', 'MAX_DOCUMENT_SIZE_MB']);
let uuidCounter = 0;
const storageService = load('features/documents/services/upload-file.ts', ['buildDocumentStoragePath', 'isDocumentStoragePathFor'], {
  randomUUID: () => `aaaaaaaa-bbbb-4ccc-8ddd-${String(++uuidCounter).padStart(12, '0')}`,
  getFileExtension: rules.getFileExtension,
  isAllowedDocumentFile: rules.isAllowedDocumentFile,
  getStorage: () => { throw new Error('não deve acessar o Storage'); },
});

const W = '11111111-1111-4111-8111-111111111111';
const C = '22222222-2222-4222-8222-222222222222';

test('caminho no Storage: gerado pelo servidor, sem o nome original, extensão normalizada', () => {
  const path = storageService.buildDocumentStoragePath({ workspaceId: W, clientId: C, fileName: 'Laudo Médico FINAL.PDF' });
  assert.match(path, new RegExp(`^${W}/clients/${C}/[0-9a-f-]{36}\\.pdf$`));
  assert.ok(!path.includes('Laudo'));
  assert.equal(storageService.isDocumentStoragePathFor({ storagePath: path, workspaceId: W, clientId: C }), true);
});

test('caminho no Storage: outro escritório, outro cliente, traversal ou tipo proibido são recusados', () => {
  const name = 'aaaaaaaa-bbbb-4ccc-8ddd-000000000001';
  const valid = `${W}/clients/${C}/${name}.pdf`;
  assert.equal(storageService.isDocumentStoragePathFor({ storagePath: valid, workspaceId: W, clientId: C }), true);
  for (const storagePath of [
    `33333333-3333-4333-8333-333333333333/clients/${C}/${name}.pdf`,
    `${W}/clients/44444444-4444-4444-8444-444444444444/${name}.pdf`,
    `${W}/clients/${C}/../${C}/${name}.pdf`,
    `${W}/clients/${C}/${name}.html`,
    `${W}/clients/${C}/${name}.svg`,
    `${W}/clients/${C}/laudo.pdf`,
    `${W}/clients/${C}/${name}.pdf/../../x.pdf`,
  ]) {
    assert.equal(storageService.isDocumentStoragePathFor({ storagePath, workspaceId: W, clientId: C }), false, storagePath);
  }
});

// ---------- Actions de upload ----------
const schemas = load('features/documents/schemas/upload-document-schema.ts', ['prepareDocumentUploadSchema', 'registerUploadedDocumentSchema'], {
  z, DocumentCategory: { LAUDO: 'LAUDO', RG: 'RG', OUTRO: 'OUTRO' }, validateDocumentFile: rules.validateDocumentFile,
});
const { parseFormData } = load('lib/actions/parse-form-data.ts', ['parseFormData'], { ActionError });

function setupUpload({ stored = { size: 2_000_000, contentType: 'application/pdf' }, failCreate = false, existing = null } = {}) {
  const calls = { signed: [], info: [], deleted: [], created: [], timeline: [], revalidated: [] };
  const actions = load('features/documents/actions/upload-document.ts', ['prepareDocumentUploadImpl', 'registerUploadedDocumentImpl'], {
    requireWorkspacePermission: async (permission) => { assert.equal(permission, 'DOCUMENT_CREATE'); return { workspace: { id: W } }; },
    parseFormData,
    prepareDocumentUploadSchema: schemas.prepareDocumentUploadSchema,
    registerUploadedDocumentSchema: schemas.registerUploadedDocumentSchema,
    prisma: {
      client: { findFirst: async ({ where }) => (where.id === C && where.workspaceId === W ? { id: C } : null) },
      document: {
        findFirst: async () => existing,
        create: async ({ data }) => { if (failCreate) throw new Error('falha simulada'); calls.created.push(data); return { id: 'd1', ...data }; },
      },
    },
    buildDocumentStoragePath: storageService.buildDocumentStoragePath,
    isDocumentStoragePathFor: storageService.isDocumentStoragePathFor,
    createSignedDocumentUpload: async (path) => { calls.signed.push(path); return { token: 'token-de-upload' }; },
    getStoredDocumentInfo: async (path) => { calls.info.push(path); return stored; },
    deleteFile: async ({ storagePath }) => { calls.deleted.push(storagePath); },
    registerDocumentUploaded: async (event) => { calls.timeline.push(event); },
    revalidatePath: (path) => calls.revalidated.push(path),
    MAX_DOCUMENT_SIZE_BYTES: rules.MAX_DOCUMENT_SIZE_BYTES,
    MAX_DOCUMENT_SIZE_MB: rules.MAX_DOCUMENT_SIZE_MB,
  });
  return { ...actions, calls };
}

test('preparar upload: valida tipo e tamanho antes de autorizar; cliente de outro escritório é recusado', async () => {
  const ctx = setupUpload();
  await assert.rejects(ctx.prepareDocumentUploadImpl({ clientId: C, fileName: 'pagina.html', size: 10 }), /Tipo de arquivo não permitido/);
  await assert.rejects(ctx.prepareDocumentUploadImpl({ clientId: C, fileName: 'grande.pdf', size: 16 * 1024 * 1024 }), /limite é 15 MB/);
  const foreign = await ctx.prepareDocumentUploadImpl({ clientId: '55555555-5555-4555-8555-555555555555', fileName: 'a.pdf', size: 10 });
  assert.equal(foreign.success, false);
  assert.equal(ctx.calls.signed.length, 0, 'nenhuma autorização emitida');

  const ok = await ctx.prepareDocumentUploadImpl({ clientId: C, fileName: 'laudo.pdf', size: 1000, category: 'LAUDO' });
  assert.equal(ok.success, true);
  assert.equal(ok.data.token, 'token-de-upload');
  assert.ok(storageService.isDocumentStoragePathFor({ storagePath: ok.data.storagePath, workspaceId: W, clientId: C }));
});

test('registrar upload: tamanho e tipo vêm do Storage; histórico e revalidação', async () => {
  const ctx = setupUpload({ stored: { size: 3_210_000, contentType: 'application/pdf' } });
  const path = storageService.buildDocumentStoragePath({ workspaceId: W, clientId: C, fileName: 'x.pdf' });
  const result = await ctx.registerUploadedDocumentImpl({ clientId: C, storagePath: path, originalName: 'Laudo.pdf', category: 'LAUDO' });
  assert.equal(result.success, true);
  assert.deepEqual(normalized(ctx.calls.created[0]), { workspaceId: W, clientId: C, originalName: 'Laudo.pdf', storagePath: path, fileType: 'application/pdf', size: 3_210_000, category: 'LAUDO' });
  assert.equal(ctx.calls.timeline.length, 1);
  assert.deepEqual(ctx.calls.revalidated, [`/clientes/${C}`]);
});

test('registrar upload: caminho forjado, arquivo ausente, duplicado ou grande demais não viram documento', async () => {
  const path = storageService.buildDocumentStoragePath({ workspaceId: W, clientId: C, fileName: 'x.pdf' });

  const forged = setupUpload();
  const otherOffice = path.replace(W, '33333333-3333-4333-8333-333333333333');
  assert.equal((await forged.registerUploadedDocumentImpl({ clientId: C, storagePath: otherOffice, originalName: 'a.pdf' })).success, false);
  assert.equal(forged.calls.info.length, 0, 'nem consulta o Storage');

  const missing = setupUpload({ stored: null });
  assert.match((await missing.registerUploadedDocumentImpl({ clientId: C, storagePath: path, originalName: 'a.pdf' })).message, /não chegou/);

  const duplicate = setupUpload({ existing: { id: 'd0' } });
  assert.match((await duplicate.registerUploadedDocumentImpl({ clientId: C, storagePath: path, originalName: 'a.pdf' })).message, /já foi registrado/);

  const tooBig = setupUpload({ stored: { size: 20 * 1024 * 1024, contentType: 'application/pdf' } });
  const big = await tooBig.registerUploadedDocumentImpl({ clientId: C, storagePath: path, originalName: 'a.pdf' });
  assert.match(big.message, /excede o limite/);
  assert.deepEqual(tooBig.calls.deleted, [path], 'arquivo grande demais é apagado do Storage');

  for (const ctx of [forged, missing, duplicate, tooBig]) assert.equal(ctx.calls.created.length, 0);
});

test('registrar upload: falha no banco remove o arquivo do Storage', async () => {
  const ctx = setupUpload({ failCreate: true });
  const path = storageService.buildDocumentStoragePath({ workspaceId: W, clientId: C, fileName: 'x.pdf' });
  await assert.rejects(ctx.registerUploadedDocumentImpl({ clientId: C, storagePath: path, originalName: 'a.pdf' }), /falha simulada/);
  assert.deepEqual(ctx.calls.deleted, [path]);
});
