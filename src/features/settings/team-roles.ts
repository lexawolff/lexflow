export type TeamRoleValue =
  | "OWNER"
  | "ADMIN"
  | "LAWYER"
  | "INTERN"
  | "FINANCIAL"
  | "VIEWER";

export const TEAM_ROLE_OPTIONS: Array<{
  value: TeamRoleValue;
  label: string;
  description: string;
}> = [
  {
    value: "OWNER",
    label: "Proprietário",
    description: "Acesso total, inclusive assinatura.",
  },
  {
    value: "ADMIN",
    label: "Administrador",
    description: "Acesso total, exceto assinatura.",
  },
  {
    value: "LAWYER",
    label: "Advogado",
    description: "Clientes, processos, agenda, documentos e Gov.br. Sem financeiro.",
  },
  {
    value: "INTERN",
    label: "Estagiário",
    description: "Cadastra e edita clientes, processos e agenda. Sem exclusões, financeiro ou Gov.br.",
  },
  {
    value: "FINANCIAL",
    label: "Financeiro",
    description: "Financeiro completo; consulta clientes e processos.",
  },
  {
    value: "VIEWER",
    label: "Visualização",
    description: "Somente consulta.",
  },
];

export const TEAM_ROLE_LABELS: Record<TeamRoleValue, string> =
  Object.fromEntries(
    TEAM_ROLE_OPTIONS.map((option) => [option.value, option.label]),
  ) as Record<TeamRoleValue, string>;
