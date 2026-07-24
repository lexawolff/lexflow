import { DocumentCategory } from "@prisma/client";

export const DOCUMENT_CATEGORY_OPTIONS = [
  {
    value: DocumentCategory.RG,
    label: "RG",
  },
  {
    value: DocumentCategory.CPF,
    label: "CPF",
  },
  {
    value: DocumentCategory.CNIS,
    label: "CNIS",
  },
  {
    value: DocumentCategory.CTPS,
    label: "CTPS",
  },
  {
    value: DocumentCategory.COMPROVANTE_RESIDENCIA,
    label: "Comprovante de Residência",
  },
  {
    value: DocumentCategory.LAUDO,
    label: "Laudo",
  },
  {
    value: DocumentCategory.EXAME,
    label: "Exame",
  },
  {
    value: DocumentCategory.RECEITA,
    label: "Receita Médica",
  },
  {
    value: DocumentCategory.ATESTADO,
    label: "Atestado",
  },
  {
    value: DocumentCategory.CONTRATO,
    label: "Contrato",
  },
  {
    value: DocumentCategory.PROCURACAO,
    label: "Procuração",
  },
  {
    value: DocumentCategory.PETICAO,
    label: "Petição",
  },
  {
    value: DocumentCategory.SENTENCA,
    label: "Sentença",
  },
  {
    value: DocumentCategory.ACORDAO,
    label: "Acórdão",
  },
  {
    value: DocumentCategory.OUTRO,
    label: "Outro",
  },
] as const;