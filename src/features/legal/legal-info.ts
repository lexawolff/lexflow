import "server-only";

/*
 * Dados dos Termos de Uso e da Política de Privacidade.
 *
 * Ao alterar o texto de forma relevante, aumente LEGAL_VERSION e
 * atualize LEGAL_UPDATED_AT: novos aceites passam a registrar a
 * nova versão (User.termsVersion).
 */
export const LEGAL_VERSION = "1.0";

export const LEGAL_UPDATED_AT = "17/11/2026";

/*
 * E-mail público de contato, suporte e privacidade.
 * A caixa de entrada (ou encaminhamento) precisa existir antes de publicar.
 */
export const LEGAL_CONTACT_EMAIL = "contato@lexflowjuridico.com.br";

/*
 * Dados pessoais do Fornecedor (pessoa física): ficam em variáveis de
 * ambiente para não irem ao repositório. Veja .env.example.
 * Sem eles, as páginas mostram o campo entre colchetes, o aviso de minuta
 * aparece e o cadastro público não abre em produção.
 */
const PROVIDER_PLACEHOLDERS = {
  name: "[NOME COMPLETO]",
  cpf: "[CPF]",
  address: "[ENDEREÇO COMPLETO]",
  forum: "[CIDADE/UF DO FORO]",
} as const;

function fromEnv(
  value: string | undefined,
  placeholder: string,
): string {
  const trimmed = value?.trim();

  return trimmed ? trimmed : placeholder;
}

export function getLegalProvider() {
  return {
    name: fromEnv(process.env.LEGAL_PROVIDER_NAME, PROVIDER_PLACEHOLDERS.name),
    cpf: fromEnv(process.env.LEGAL_PROVIDER_CPF, PROVIDER_PLACEHOLDERS.cpf),
    address: fromEnv(process.env.LEGAL_PROVIDER_ADDRESS, PROVIDER_PLACEHOLDERS.address),
    email: LEGAL_CONTACT_EMAIL,
    forum: fromEnv(process.env.LEGAL_PROVIDER_FORUM, PROVIDER_PLACEHOLDERS.forum),
  };
}

/*
 * Serviços de terceiros (suboperadores) usados pelo LexFlow.
 * Mantenha esta lista igual à infraestrutura real.
 */
export const SUBPROCESSORS = [
  {
    name: "Supabase Inc.",
    purpose: "Banco de dados, autenticação (login e senhas) e armazenamento de documentos.",
    location: "Dados armazenados em São Paulo (AWS sa-east-1). Empresa com sede nos EUA.",
  },
  {
    name: "Vercel Inc.",
    purpose: "Hospedagem e execução do sistema.",
    location: "Execução em São Paulo (região gru1). Empresa com sede nos EUA.",
  },
  {
    name: "Google LLC",
    purpose: "Sincronização com o Google Agenda, apenas para quem conectar a própria conta.",
    location: "Infraestrutura global do Google. Empresa com sede nos EUA.",
  },
  {
    name: "[PROVEDOR DE E-MAIL]",
    purpose: "Envio de e-mails do sistema (confirmação de cadastro e redefinição de senha).",
    location: "[LOCALIZAÇÃO]",
  },
] as const;

export function isPlaceholder(value: string): boolean {
  return value.trim().startsWith("[");
}

export function isLegalInfoComplete(): boolean {
  return (
    Object.values(getLegalProvider()).every((value) => !isPlaceholder(value)) &&
    SUBPROCESSORS.every(
      (item) => !isPlaceholder(item.name) && !isPlaceholder(item.location),
    )
  );
}
