import {
  AdministrativeStatus,
  CaseOrigin,
  CaseStatus,
  PracticeArea,
} from "@prisma/client";

export const PRACTICE_AREA_OPTIONS = [
  { label: "Previdenciário", value: "PREVIDENCIARIO" },
  { label: "Cível", value: "CIVEL" },
  { label: "Família", value: "FAMILIA" },
  { label: "Consumidor", value: "CONSUMIDOR" },
  { label: "Trabalhista", value: "TRABALHISTA" },
  { label: "Administrativo", value: "ADMINISTRATIVO" },
  { label: "Tributário", value: "TRIBUTARIO" },
  { label: "Empresarial", value: "EMPRESARIAL" },
  { label: "Criminal", value: "CRIMINAL" },
  { label: "Outro", value: "OUTRO" },
] as const;

export const CASE_ORIGIN_OPTIONS = [
  {
    label: "Administrativo",
    value: "ADMINISTRATIVO",
  },
  {
    label: "Judicial",
    value: "JUDICIAL",
  },
  {
    label: "Administrativo + Judicial",
    value: "AMBOS",
  },
] as const;

export const ADMINISTRATIVE_STATUS_OPTIONS = [
  {
    label: "Não se aplica",
    value: "NAO_APLICAVEL",
  },
  {
    label: "Requerido",
    value: "REQUERIDO",
  },
  {
    label: "Em análise",
    value: "EM_ANALISE",
  },
  {
    label: "Deferido",
    value: "DEFERIDO",
  },
  {
    label: "Indeferido",
    value: "INDEFERIDO",
  },
  {
    label: "Recurso",
    value: "RECURSO",
  },
] as const;

export const CASE_STATUS_OPTIONS = [
  {
    label: "Atendimento Inicial",
    value: "ATENDIMENTO_INICIAL",
  },
  {
    label: "Documentação Pendente",
    value: "DOCUMENTACAO_PENDENTE",
  },
  {
    label: "Administrativo",
    value: "ADMINISTRATIVO",
  },
  {
    label: "Inicial em Elaboração",
    value: "INICIAL_EM_ELABORACAO",
  },
  {
    label: "Protocolado",
    value: "PROTOCOLADO",
  },
  {
    label: "Aguardando Perícia",
    value: "AGUARDANDO_PERICIA",
  },
  {
    label: "Aguardando Sentença",
    value: "AGUARDANDO_SENTENCA",
  },
  {
    label: "Recurso",
    value: "RECURSO",
  },
  {
    label: "Cumprimento de Sentença",
    value: "CUMPRIMENTO_SENTENCA",
  },
  {
    label: "RPV Expedida",
    value: "RPV_EXPEDIDA",
  },
  {
    label: "RPV Paga",
    value: "RPV_PAGA",
  },
  {
    label: "Encerrado",
    value: "ENCERRADO",
  },
] as const;

/* ===========================
   LABELS
=========================== */

export const PRACTICE_AREA_LABELS: Record<PracticeArea, string> = {
  PREVIDENCIARIO: "Previdenciário",
  CIVEL: "Cível",
  FAMILIA: "Família",
  CONSUMIDOR: "Consumidor",
  TRABALHISTA: "Trabalhista",
  ADMINISTRATIVO: "Administrativo",
  TRIBUTARIO: "Tributário",
  EMPRESARIAL: "Empresarial",
  CRIMINAL: "Criminal",
  OUTRO: "Outro",
};

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  ATENDIMENTO_INICIAL: "Atendimento Inicial",
  DOCUMENTACAO_PENDENTE: "Documentação Pendente",
  ADMINISTRATIVO: "Administrativo",
  INICIAL_EM_ELABORACAO: "Inicial em Elaboração",
  PROTOCOLADO: "Protocolado",
  AGUARDANDO_PERICIA: "Aguardando Perícia",
  AGUARDANDO_SENTENCA: "Aguardando Sentença",
  RECURSO: "Recurso",
  CUMPRIMENTO_SENTENCA: "Cumprimento de Sentença",
  RPV_EXPEDIDA: "RPV Expedida",
  RPV_PAGA: "RPV Paga",
  ENCERRADO: "Encerrado",
};

export const CASE_ORIGIN_LABELS: Record<CaseOrigin, string> = {
  ADMINISTRATIVO: "Administrativo",
  JUDICIAL: "Judicial",
  AMBOS: "Administrativo + Judicial",
};

export const ADMINISTRATIVE_STATUS_LABELS: Record<
  AdministrativeStatus,
  string
> = {
  NAO_APLICAVEL: "Não se aplica",
  REQUERIDO: "Requerido",
  EM_ANALISE: "Em análise",
  DEFERIDO: "Deferido",
  INDEFERIDO: "Indeferido",
  RECURSO: "Recurso",
};  