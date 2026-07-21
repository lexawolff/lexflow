import { formatDate } from "@/lib/format/date";

import { CaseDetails } from "../../types";
import {
  ADMINISTRATIVE_STATUS_LABELS,
  CASE_ORIGIN_LABELS,
} from "../../constants";

type Props = {
  caseData: CaseDetails;
};

function Item({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p className="font-medium">
        {value ?? "-"}
      </p>
    </div>
  );
}

export function OverviewTab({
  caseData,
}: Props) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <h2 className="mb-6 text-lg font-semibold">
        Resumo da Demanda
      </h2>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

        <Item
          label="Número do Processo"
          value={caseData.number || "-"}
        />

        <Item
          label="Número do Benefício (NB)"
          value={caseData.administrativeNumber || "-"}
        />

        <Item
          label="Origem"
          value={CASE_ORIGIN_LABELS[caseData.origin]}
        />

        <Item
          label="Situação Administrativa"
          value={
            ADMINISTRATIVE_STATUS_LABELS[
              caseData.administrativeStatus
            ]
          }
        />

        <Item
          label="Vara"
          value={caseData.court || "-"}
        />

        <Item
          label="Juiz"
          value={caseData.judge || "-"}
        />

        <Item
          label="Próximo Prazo"
          value={
            caseData.nextDeadline
              ? formatDate(caseData.nextDeadline)
              : "-"
          }
        />

        <Item
          label="Criado em"
          value={formatDate(caseData.createdAt)}
        />

        <Item
          label="Valor da Causa"
          value={
            caseData.claimValue
              ? new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
              }).format(Number(caseData.claimValue))
              : "-"
          }
        />

      </div>

      {caseData.notes && (
        <div className="mt-8 border-t pt-6">
          <h3 className="mb-2 font-semibold">
            Observações
          </h3>

          <p className="whitespace-pre-line text-sm text-muted-foreground">
            {caseData.notes}
          </p>
        </div>
      )}
    </div>
  );
}