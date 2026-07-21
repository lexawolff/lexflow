import { PracticeArea } from "@prisma/client";

import { PRACTICE_AREA_LABELS } from "../constants";

type Props = {
  area: PracticeArea;
};

const AREA_COLORS: Record<PracticeArea, string> = {
  PREVIDENCIARIO:
    "bg-blue-100 text-blue-700 border-blue-200",

  CIVEL:
    "bg-slate-100 text-slate-700 border-slate-200",

  FAMILIA:
    "bg-pink-100 text-pink-700 border-pink-200",

  TRABALHISTA:
    "bg-orange-100 text-orange-700 border-orange-200",

  CONSUMIDOR:
    "bg-teal-100 text-teal-700 border-teal-200",

  ADMINISTRATIVO:
    "bg-indigo-100 text-indigo-700 border-indigo-200",

  TRIBUTARIO:
    "bg-yellow-100 text-yellow-700 border-yellow-200",

  EMPRESARIAL:
    "bg-violet-100 text-violet-700 border-violet-200",

  CRIMINAL:
    "bg-red-100 text-red-700 border-red-200",

  OUTRO:
    "bg-zinc-100 text-zinc-700 border-zinc-200",
};

export function PracticeAreaBadge({ area }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${AREA_COLORS[area]}`}
    >
      {PRACTICE_AREA_LABELS[area]}
    </span>
  );
}