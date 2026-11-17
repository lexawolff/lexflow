// Migra o LexFlow de um projeto Supabase (origem) para outro (destino).
//
// Origem:  .env            (projeto atual; SOMENTE LEITURA)
// Destino: .env.sao-paulo  (projeto novo, vazio)
//
// Uso (na raiz do projeto):
//   node scripts/migrar-supabase.mjs --verificar   confere acessos e contagens (só leitura)
//   node scripts/migrar-supabase.mjs --executar    migra estrutura, usuários, dados e documentos
//   node scripts/migrar-supabase.mjs --trocar-env  faz o app passar a usar o destino
//
// Nunca imprime senhas, chaves ou dados de clientes: só contagens.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const root = process.cwd();
const require = createRequire(resolve(root, "package.json"));
const dotenv = require("dotenv");
const { PrismaClient, Prisma } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");

const ORIGIN_FILE = ".env";
const TARGET_FILE = ".env.sao-paulo";
const BUCKET = "documents";
const BUCKET_LIMIT_BYTES = 15 * 1024 * 1024;

// Ordem respeita as chaves estrangeiras.
const MODELS = [
  "user", "workspace", "subscription", "billingProfile", "membership",
  "client", "case", "rpv", "receivable", "payable",
  "googleCalendarConnection", "task", "workItem", "extraService",
  "document", "clientEvent", "caseEvent", "timelineEvent",
  "auditLog", "workspaceInvitation",
];

// Campos Json que podem ser nulos (createMany exige Prisma.DbNull).
const NULLABLE_JSON_FIELDS = { timelineEvent: ["metadata"] };

const PLACEHOLDER = /COLE_AQUI|YOUR-PASSWORD|\[SENHA\]|SEU_PROJETO/;

// Aceita os nomes do painel do Supabase (chaves novas e antigas).
const TARGET_ALIASES = {
  DATABASE_URL: ["DATABASE_URL"],
  DIRECT_URL: ["DIRECT_URL"],
  SUPABASE_URL: ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"],
  PUBLIC_KEY: [
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY",
  ],
  SECRET_KEY: ["SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
};

// Variáveis do Supabase no .env do app que serão substituídas pelo destino.
const APP_SUPABASE_KEYS = [
  "DATABASE_URL", "DIRECT_URL", "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY",
];

function pick(env, names) {
  return names.map((name) => env[name]).find((value) => value && !PLACEHOLDER.test(value));
}

function readTarget() {
  const env = readEnv(TARGET_FILE);
  const values = Object.fromEntries(
    Object.entries(TARGET_ALIASES).map(([key, names]) => [key, pick(env, names)]),
  );
  const missing = Object.entries(values).filter(([, value]) => !value).map(([key]) => key);
  if (missing.length) fail(`preencha em ${TARGET_FILE}: ${missing.join(", ")}`);
  return values;
}

function projectRefFromUrl(url) {
  return (/^https:\/\/([a-z0-9]{20})\.supabase\.co/.exec(url ?? "") ?? [])[1] ?? null;
}

function projectRefFromDatabaseUrl(url) {
  try {
    return (/\.([a-z0-9]{20})$/.exec(decodeURIComponent(new URL(url).username)) ?? [])[1] ?? null;
  } catch {
    return null;
  }
}

function fail(message) {
  console.error(`\nERRO: ${message}`);
  process.exit(1);
}

function readEnv(file) {
  if (!existsSync(resolve(root, file))) fail(`arquivo ${file} não encontrado.`);
  return dotenv.parse(readFileSync(resolve(root, file)));
}

function hostOf(url) {
  try {
    const parsed = new URL(url);
    return `${decodeURIComponent(parsed.username)}@${parsed.hostname}:${parsed.port}`;
  } catch {
    return null;
  }
}

function describe(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}:${parsed.port}`;
  } catch {
    return "URL inválida";
  }
}

function loadConfig() {
  const origin = readEnv(ORIGIN_FILE);
  const target = readTarget();

  const originUrl = pick(origin, TARGET_ALIASES.SUPABASE_URL);
  const originServiceKey = pick(origin, TARGET_ALIASES.SECRET_KEY);
  if (!origin.DATABASE_URL || !originUrl || !originServiceKey) {
    fail(`${ORIGIN_FILE} precisa de DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL e a chave secreta (service_role).`);
  }

  // Tudo no destino precisa ser do MESMO projeto (URL, banco e conexão direta).
  const targetRef = projectRefFromUrl(target.SUPABASE_URL);
  const targetRefs = [
    projectRefFromDatabaseUrl(target.DATABASE_URL),
    projectRefFromDatabaseUrl(target.DIRECT_URL),
  ];
  if (!targetRef || targetRefs.some((ref) => ref !== targetRef)) {
    fail(`em ${TARGET_FILE}, a URL do projeto e as conexões do banco são de projetos diferentes.`);
  }

  if (
    targetRef === projectRefFromUrl(originUrl) ||
    hostOf(origin.DATABASE_URL) === hostOf(target.DATABASE_URL)
  ) {
    fail(`${TARGET_FILE} aponta para o MESMO projeto do ${ORIGIN_FILE}. Copie os valores do projeto novo.`);
  }

  // Trava contra confusão de projetos: o destino precisa estar em São Paulo.
  const targetHosts = [target.DATABASE_URL, target.DIRECT_URL].map((url) => new URL(url).hostname);
  if (!args.has("--qualquer-regiao") && !targetHosts.every((host) => host.includes("sa-east-1"))) {
    fail(`o banco de destino não está em São Paulo (sa-east-1): ${targetHosts.join(", ")}`);
  }

  return {
    origin: {
      databaseUrl: origin.DIRECT_URL || origin.DATABASE_URL,
      supabaseUrl: originUrl,
      serviceKey: originServiceKey,
    },
    target: {
      databaseUrl: target.DIRECT_URL,
      supabaseUrl: target.SUPABASE_URL,
      serviceKey: target.SECRET_KEY,
      values: target,
    },
  };
}

function prismaFor(url) {
  // Sem log: erros esperados (tabela ainda inexistente) são tratados no código.
  return new PrismaClient({ datasourceUrl: url, log: [] });
}

function supabaseFor({ supabaseUrl, serviceKey }) {
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    // O script não usa realtime; evita exigir WebSocket nativo (Node < 22).
    realtime: { transport: globalThis.WebSocket ?? class NoRealtime {} },
  });
}

async function countAll(prisma) {
  const counts = {};
  for (const model of MODELS) {
    try {
      counts[model] = await prisma[model].count();
    } catch {
      counts[model] = null; // tabela ainda não existe
    }
  }
  return counts;
}

async function readAuthUsers(prisma) {
  return prisma.$queryRaw`
    SELECT id::text AS id, email, encrypted_password, email_confirmed_at, raw_user_meta_data
    FROM auth.users
    ORDER BY created_at`;
}

// ---------------------------------------------------------------- verificar
async function verify() {
  const config = loadConfig();
  const origin = prismaFor(config.origin.databaseUrl);
  const target = prismaFor(config.target.databaseUrl);

  try {
    console.log(`Origem:  ${describe(config.origin.databaseUrl)} (somente leitura)`);
    console.log(`Destino: ${describe(config.target.databaseUrl)}`);

    const [originCounts, targetCounts, originUsers, targetUsers] = await Promise.all([
      countAll(origin),
      countAll(target),
      readAuthUsers(origin),
      readAuthUsers(target),
    ]);

    const region = await target.$queryRaw`SELECT current_setting('server_version') AS version`;
    console.log(`Postgres do destino: ${region[0].version}`);

    console.log("\nTabela                     origem  destino");
    for (const model of MODELS) {
      const destination = targetCounts[model] === null ? "(sem tabela)" : targetCounts[model];
      console.log(`${model.padEnd(26)} ${String(originCounts[model]).padStart(6)}  ${destination}`);
    }
    console.log(`${"auth.users".padEnd(26)} ${String(originUsers.length).padStart(6)}  ${targetUsers.length}`);

    const withoutHash = originUsers.filter((user) => !user.encrypted_password).length;
    if (withoutHash) console.log(`\nAtenção: ${withoutHash} usuário(s) sem senha (precisarão usar "Esqueci minha senha").`);

    const targetHasData = MODELS.some((model) => targetCounts[model]) || targetUsers.length > 0;
    console.log(targetHasData
      ? "\nO destino JÁ tem dados. Use --executar --retomar apenas para continuar uma migração interrompida."
      : "\nDestino vazio: pronto para --executar.");
  } finally {
    await Promise.all([origin.$disconnect(), target.$disconnect()]);
  }
}

// ---------------------------------------------------------------- executar
function migrateSchema(config) {
  console.log("\n[1/5] Criando a estrutura no destino (prisma migrate deploy)...");
  const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    cwd: root,
    shell: process.platform === "win32",
    encoding: "utf8",
    env: {
      ...process.env,
      // dotenv do prisma.config.ts não sobrescreve variáveis já definidas.
      DATABASE_URL: config.target.databaseUrl,
      DIRECT_URL: config.target.databaseUrl,
    },
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`.replace(/postgres(ql)?:\/\/\S+/g, "<url>");
  if (result.status !== 0) fail(`prisma migrate deploy falhou:\n${output}`);
  console.log(output.includes("No pending migrations") ? "      estrutura já existia." : "      estrutura criada (inclui RLS em todas as tabelas).");
}

async function migrateAuthUsers(origin, targetSupabase) {
  console.log("\n[2/5] Recriando usuários (mesmo ID e mesma senha)...");
  const users = await readAuthUsers(origin);
  let created = 0;
  let skipped = 0;

  for (const user of users) {
    const { data: existing } = await targetSupabase.auth.admin.getUserById(user.id);
    if (existing?.user) {
      skipped += 1;
      continue;
    }

    const { error } = await targetSupabase.auth.admin.createUser({
      id: user.id,
      email: user.email,
      ...(user.encrypted_password ? { password_hash: user.encrypted_password } : {}),
      email_confirm: Boolean(user.email_confirmed_at),
      user_metadata: user.raw_user_meta_data ?? {},
    });

    if (error) fail(`não foi possível recriar um usuário (${error.code ?? error.status ?? "sem código"}).`);
    created += 1;
  }

  console.log(`      ${created} criado(s), ${skipped} já existente(s).`);
}

function prepareRows(model, rows) {
  const jsonFields = NULLABLE_JSON_FIELDS[model] ?? [];
  if (!jsonFields.length) return rows;
  return rows.map((row) => {
    const copy = { ...row };
    for (const field of jsonFields) if (copy[field] === null) copy[field] = Prisma.DbNull;
    return copy;
  });
}

async function migrateData(origin, target) {
  console.log("\n[3/5] Copiando dados...");
  for (const model of MODELS) {
    const rows = await origin[model].findMany();
    for (let start = 0; start < rows.length; start += 500) {
      const chunk = prepareRows(model, rows.slice(start, start + 500));
      await target[model].createMany({ data: chunk, skipDuplicates: true });
    }
    if (rows.length) console.log(`      ${model}: ${rows.length}`);
  }
}

async function migrateDocuments(target, originSupabase, targetSupabase) {
  console.log("\n[4/5] Copiando documentos do Storage...");

  const { data: bucket } = await targetSupabase.storage.getBucket(BUCKET);
  if (!bucket) {
    const { error } = await targetSupabase.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: BUCKET_LIMIT_BYTES,
    });
    if (error) fail(`não foi possível criar o bucket "${BUCKET}": ${error.message}`);
    console.log(`      bucket "${BUCKET}" criado (privado, limite de 15 MB).`);
  }

  const documents = await target.document.findMany({ select: { storagePath: true } });
  let copied = 0;

  for (const [index, { storagePath }] of documents.entries()) {
    const { data: file, error: downloadError } = await originSupabase.storage.from(BUCKET).download(storagePath);
    if (downloadError || !file) fail(`não foi possível baixar o documento ${index + 1} de ${documents.length} da origem.`);

    const { error: uploadError } = await targetSupabase.storage.from(BUCKET).upload(storagePath, file, {
      upsert: true,
      contentType: file.type || "application/octet-stream",
    });
    if (uploadError) fail(`não foi possível enviar um documento ao destino: ${uploadError.message}`);
    copied += 1;
  }

  console.log(`      ${copied} de ${documents.length} documento(s) copiado(s).`);
  return { copied, total: documents.length };
}

async function compare(origin, target, originSupabase, targetSupabase, documents) {
  console.log("\n[5/5] Conferindo...");
  const [originCounts, targetCounts, originUsers, targetUsers] = await Promise.all([
    countAll(origin), countAll(target), readAuthUsers(origin), readAuthUsers(target),
  ]);

  const differences = MODELS.filter((model) => originCounts[model] !== targetCounts[model]);
  if (originUsers.length !== targetUsers.length) differences.push("auth.users");

  const sameHashes = originUsers.every((user) =>
    targetUsers.some((candidate) => candidate.id === user.id && candidate.encrypted_password === user.encrypted_password));
  if (!sameHashes) differences.push("senhas dos usuários");

  if (documents.copied !== documents.total) differences.push("documentos");

  // Amostra: o primeiro documento abre no destino.
  if (documents.total > 0) {
    const sample = await target.document.findFirst({ select: { storagePath: true } });
    const { data } = await targetSupabase.storage.from(BUCKET).createSignedUrl(sample.storagePath, 60);
    if (!data?.signedUrl) differences.push("acesso aos documentos no destino");
  }

  if (differences.length) fail(`diferenças encontradas: ${differences.join(", ")}`);
  console.log("      todas as tabelas, usuários (com senhas) e documentos conferem.");
}

async function execute({ resume }) {
  const config = loadConfig();
  const origin = prismaFor(config.origin.databaseUrl);
  const target = prismaFor(config.target.databaseUrl);
  const originSupabase = supabaseFor(config.origin);
  const targetSupabase = supabaseFor(config.target);

  try {
    const targetCounts = await countAll(target);
    const targetUsers = await readAuthUsers(target);
    const hasData = MODELS.some((model) => targetCounts[model]) || targetUsers.length > 0;
    if (hasData && !resume) fail("o destino já tem dados. Rode --verificar; para continuar uma migração interrompida, use --executar --retomar.");

    console.log(`Origem:  ${describe(config.origin.databaseUrl)} (somente leitura)`);
    console.log(`Destino: ${describe(config.target.databaseUrl)}`);

    migrateSchema(config);
    await migrateAuthUsers(origin, targetSupabase);
    await migrateData(origin, target);
    const documents = await migrateDocuments(target, originSupabase, targetSupabase);
    await compare(origin, target, originSupabase, targetSupabase, documents);

    console.log("\nMigração concluída. Próximo passo: node scripts/migrar-supabase.mjs --trocar-env");
  } finally {
    await Promise.all([origin.$disconnect(), target.$disconnect()]);
  }
}

// ---------------------------------------------------------------- trocar-env
function switchEnv() {
  const config = loadConfig();
  const backup = ".env.backup-ohio";
  if (existsSync(resolve(root, backup))) fail(`${backup} já existe; o .env provavelmente já foi trocado.`);

  const target = config.target.values;
  const newValues = {
    DATABASE_URL: target.DATABASE_URL,
    DIRECT_URL: target.DIRECT_URL,
    NEXT_PUBLIC_SUPABASE_URL: target.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: target.PUBLIC_KEY,
    SUPABASE_SECRET_KEY: target.SECRET_KEY,
  };

  // Remove todas as variáveis do Supabase antigo (inclusive anon/service_role,
  // que o app ignoraria, mas confundiriam) e grava as do destino.
  const lines = readFileSync(resolve(root, ORIGIN_FILE), "utf8")
    .split(/\r?\n/)
    .filter((line) => {
      const match = /^\s*([A-Z0-9_]+)\s*=/.exec(line);
      return !(match && APP_SUPABASE_KEYS.includes(match[1]));
    });

  const output = [
    "# Supabase São Paulo (sa-east-1)",
    ...Object.entries(newValues).map(([key, value]) => `${key}="${value}"`),
    "",
    ...lines,
  ];

  copyFileSync(resolve(root, ORIGIN_FILE), resolve(root, backup));
  writeFileSync(resolve(root, ORIGIN_FILE), output.join("\n"));
  console.log(`.env agora aponta para o projeto de São Paulo (backup do anterior em ${backup}).`);
  console.log("Chaves de criptografia e variáveis do Google foram mantidas. Reinicie o npm run dev.");
}

const args = new Set(process.argv.slice(2));
if (args.has("--verificar")) await verify();
else if (args.has("--executar")) await execute({ resume: args.has("--retomar") });
else if (args.has("--trocar-env")) switchEnv();
else console.log("Use --verificar, --executar ou --trocar-env (veja o início do arquivo).");
