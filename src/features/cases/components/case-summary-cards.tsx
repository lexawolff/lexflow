import { formatDate } from "@/lib/format/date";

import type { CaseDetails } from "../types";

type Props = {
  caseData: CaseDetails;
};

function SummaryCard({
  title,
  value,
}: {
  title: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-sm text-muted-foreground">
        {title}
      </p>

      <p className="mt-2 font-semibold break-words">
        {value}
      </p>
    </div>
  );
}

export function CaseSummaryCards({
  caseData,
}: Props) {
  const currency =
    caseData.claimValue != null
      ? new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(Number(caseData.claimValue))
      : "-";

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

      <SummaryCard
        title="Próximo Prazo"
        value={
          caseData.nextDeadline
            ? formatDate(caseData.nextDeadline)
            : "-"
        }
      />

      <SummaryCard
        title="Processo"
        value={caseData.number || "-"}
      />

      <SummaryCard
        title="NB"
        value={caseData.administrativeNumber || "-"}
      />

      <SummaryCard
        title="Valor da Causa"
        value={currency}
      />

    </div>
  );
}