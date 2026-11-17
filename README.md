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

## Contas e escritórios

- **Novo escritório:** cadastro público em `/cadastro` (nome do escritório,
  nome, e-mail e senha). O Supabase envia um e-mail de confirmação; o
  escritório, o usuário e o vínculo de proprietário só são criados depois da
  confirmação (no retorno do link ou no primeiro login).
- **Equipe:** o proprietário convida membros em *Configurações → Equipe*
  (link de convite, sem depender de e-mail).
- **Abertura do cadastro:** controlada por `SIGNUP_ENABLED` (veja
  `.env.example`). Em produção fica fechado até ser ativado.
- **Antes de abrir em produção:**
  - Supabase → *Authentication → Sign In / Providers → Email*: **Confirm email**
    ligado; e cadastros permitidos ("Allow new users to sign up").
  - SMTP próprio (o envio padrão do Supabase só entrega para membros do projeto).
  - Proteção contra robôs: CAPTCHA do Supabase (Turnstile ou hCaptcha) em
    *Authentication → Attack Protection*.
  - Termos de uso e política de privacidade revisados e preenchidos (veja
    abaixo). Em produção o cadastro não abre enquanto houver campos a preencher.

## Termos de Uso e Política de Privacidade

- Páginas públicas: `/termos` (com o Anexo de Tratamento de Dados) e
  `/privacidade`. Textos em `src/app/termos/page.tsx` e
  `src/app/privacidade/page.tsx`.
- Suboperadores, e-mail de contato e versão: `src/features/legal/legal-info.ts`.
- Nome, CPF, endereço e foro do fornecedor: variáveis `LEGAL_PROVIDER_*` no
  `.env` (e na Vercel), fora do repositório. Campos ausentes aparecem entre
  colchetes, destacados, e geram aviso de minuta.
- O cadastro de escritório e o aceite de convite exigem a caixa de aceite; a
  versão e a data ficam em `User.termsVersion` e `User.termsAcceptedAt`.
- Mudança relevante no texto: aumente `LEGAL_VERSION`, atualize
  `LEGAL_UPDATED_AT` e avise os clientes com a antecedência prevista nos Termos.

## Endereços

| Uso | Endereço |
|---|---|
| Sistema | `https://app.lexflowjuridico.com.br` |
| Site de divulgação (futuro) | `https://lexflowjuridico.com.br` |
| E-mails automáticos (confirmação, senha) | `nao-responda@lexflowjuridico.com.br` |
| Contato, suporte e privacidade | `contato@lexflowjuridico.com.br` |

## E-mail

- **Envio** (confirmação de cadastro e redefinição de senha): serviço SMTP
  com o domínio `lexflowjuridico.com.br` verificado (registros de DNS indicados
  pelo serviço) e configurado no Supabase em *Authentication → Emails → SMTP
  Settings*, remetente `nao-responda@lexflowjuridico.com.br`. Depois de
  escolher o serviço, atualize o item de e-mail em `SUBPROCESSORS`
  (`src/features/legal/legal-info.ts`).
- **Recebimento**: `contato@lexflowjuridico.com.br` aparece nos Termos e na
  Política e precisa de uma caixa de entrada ou de encaminhamento para um
  e-mail pessoal antes da publicação.

## Publicação (Vercel)

1. Importe o repositório na Vercel (plano Pro para uso comercial).
2. Cadastre as variáveis do `.env.example` em *Settings → Environment
   Variables*, com `DATABASE_URL` no pooler em modo transação (porta 6543).
3. As funções rodam em São Paulo (`gru1`, ver `vercel.json`), mesma região do
   banco.
4. Em *Settings → Domains*, adicione `app.lexflowjuridico.com.br` e crie no DNS
   do domínio o registro que a Vercel indicar.
5. No Supabase, em *Authentication → URL Configuration*: **Site URL**
   `https://app.lexflowjuridico.com.br` e, em **Redirect URLs**,
   `https://app.lexflowjuridico.com.br/**` (mantenha
   `http://localhost:3000/**` para desenvolvimento; nunca use curingas como
   `*.vercel.app`).
6. No Google Cloud, cadastre
   `https://app.lexflowjuridico.com.br/api/google-calendar/callback`, use o
   mesmo valor em `GOOGLE_REDIRECT_URI` na Vercel e publique o app OAuth (em
   modo "Testing" a conexão expira a cada 7 dias).
7. Configure o envio de e-mail (seção "E-mail" acima).

## Segredos

`ENCRYPTION_KEY` (senhas Gov.br) e `APP_ENCRYPTION_KEY` (tokens do Google)
cifram dados gravados no banco. Guarde cópias seguras e nunca as troque em um
banco que já tem dados: os dados cifrados ficariam ilegíveis.
