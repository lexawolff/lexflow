# LexFlow

Gestão jurídica para escritórios de advocacia, com foco em direito
previdenciário: clientes, processos, agenda (com Google Agenda), documentos,
financeiro (recebimentos, RPVs/precatórios, contas a pagar), fila de trabalho
e equipe com permissões por função.

Documentação do produto em [`docs/`](docs/).

## Tecnologias

- Next.js 15 (App Router, Server Actions) e React 19
- Prisma 6 + PostgreSQL no Supabase (região São Paulo)
- Supabase Auth (login) e Supabase Storage (documentos)
- Tailwind CSS 4 e shadcn/ui

## Rodando no computador

Requer **Node 22** (veja `.nvmrc`; com nvm-windows: `nvm use 22.14.0`).

1. Instale as dependências (também gera o Prisma Client):
   ```bash
   npm install
   ```
2. Copie `.env.example` para `.env` e preencha os valores.
3. Aplique as migrations no banco:
   ```bash
   npx prisma migrate deploy
   ```
4. Inicie:
   ```bash
   npm run dev
   ```
   e abra http://localhost:3000.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | checagem de tipos (TypeScript) |
| `npm test` | todos os testes de `verificacao/` |
| `npx prisma migrate deploy` | aplica migrations pendentes |

## Testes

Os testes ficam em [`verificacao/`](verificacao/) e executam o código real com
banco e Supabase simulados (não acessam nada externo):

```bash
npm test
```

Roda todos os arquivos `verificacao/test-*.mjs`. Requer Node 22.13 ou superior
(`test-audit.mjs` e `test-gov-ui.mjs` usam `stripTypeScriptTypes`).

## Banco de dados

- Toda alteração de estrutura é feita por migration em `prisma/migrations`.
- Todas as tabelas têm RLS ativo e nenhum acesso para os papéis públicos do
  Supabase (`anon`/`authenticated`); o app acessa o banco só pelo Prisma.
  Migrations novas que criam tabelas devem incluir
  `ALTER TABLE "NovaTabela" ENABLE ROW LEVEL SECURITY;`.
- Conferência de segurança (somente leitura, no SQL Editor do Supabase):
  [`verificacao/supabase-somente-leitura.sql`](verificacao/supabase-somente-leitura.sql).

## Publicação (Vercel)

1. Importe o repositório na Vercel (plano Pro para uso comercial).
2. Cadastre as variáveis do `.env.example` em *Settings → Environment
   Variables*, com `DATABASE_URL` no pooler em modo transação (porta 6543).
3. As funções rodam em São Paulo (`gru1`, ver `vercel.json`), mesma região do
   banco.
4. No Supabase, em *Authentication → URL Configuration*: troque o **Site URL**
   pelo domínio de produção e adicione `https://SEU_DOMINIO/**` em
   **Redirect URLs** (nunca use curingas como `*.vercel.app`).
5. No Google Cloud, cadastre `https://SEU_DOMINIO/api/google-calendar/callback`
   e publique o app OAuth (em modo "Testing" a conexão expira a cada 7 dias).
6. Configure um SMTP próprio no Supabase para os e-mails de recuperação de senha.

## Segredos

`ENCRYPTION_KEY` (senhas Gov.br) e `APP_ENCRYPTION_KEY` (tokens do Google)
cifram dados gravados no banco. Guarde cópias seguras e nunca as troque em um
banco que já tem dados: os dados cifrados ficariam ilegíveis.
