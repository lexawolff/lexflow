import { CaseStatus } from "@prisma/client";

import { CASE_STATUS_LABELS } from "../constants";

type Props = {
  status: CaseStatus;
};

const STATUS_COLORS: Record<CaseStatus, string> = {
  ATENDIMENTO_INICIAL:
    "bg-slate-100 text-slate-700 border-slate-200",

  DOCUMENTACAO_PENDENTE:
    "bg-amber-100 text-amber-700 border-amber-200",

  ADMINISTRATIVO:
    "bg-blue-100 text-blue-700 border-blue-200",

  INICIAL_EM_ELABORACAO:
    "bg-indigo-100 text-indigo-700 border-indigo-200",

  PROTOCOLADO:
    "bg-cyan-100 text-cyan-700 border-cyan-200",

  AGUARDANDO_PERICIA:
    "bg-violet-100 text-violet-700 border-violet-200",

  AGUARDANDO_SENTENCA:
    "bg-orange-100 text-orange-700 border-orange-200",

  RECURSO:
    "bg-red-100 text-red-700 border-red-200",

  CUMPRIMENTO_SENTENCA:
    "bg-purple-100 text-purple-700 border-purple-200",

  RPV_EXPEDIDA:
    "bg-emerald-100 text-emerald-700 border-emerald-200",

  RPV_PAGA:
    "bg-green-100 text-green-700 border-green-200",

  ENCERRADO:
    "bg-zinc-100 text-zinc-700 border-zinc-200",
};

export function CaseStatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${STATUS_COLORS[status]}`}
    >
      {CASE_STATUS_LABELS[status]}
    </span>
  );
}