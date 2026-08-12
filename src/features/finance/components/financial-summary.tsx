import {
  CircleCheck,
  Clock3,
  FileText,
  WalletCards,
} from "lucide-react";

import { ClientDetails } from "@/features/clients/types";

import { getEffectiveFinancialStatus } from "../lib/receivable-display";

type Props = {
  client: ClientDetails;
};

function formatMoney(
  value: number,
): string {
  return value.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  );
}

export function FinancialSummary({
  client,
}: Props) {
  const receivables =
    client.receivables;

  let totalContracted = 0;
  let totalReceived = 0;
  let totalToReceive = 0;
  let totalOverdue = 0;

  let openCount = 0;
  let overdueCount = 0;
  let receivedCount = 0;
  let contractedCount = 0;

  for (
    const receivable of receivables
  ) {
    const status =
      getEffectiveFinancialStatus(
        receivable.status,
        receivable.dueDate,
      );

    const totalAmount = Number(
      receivable.totalAmount,
    );

    const paidAmount = Number(
      receivable.paidAmount,
    );

    const remainingAmount =
      Math.max(
        totalAmount -
          paidAmount,
        0,
      );

    /*
     * Cobranças canceladas não fazem
     * parte dos indicadores financeiros.
     */
    if (
      status === "CANCELADO"
    ) {
      continue;
    }

    totalContracted +=
      totalAmount;

    totalReceived +=
      paidAmount;

    contractedCount += 1;

    if (
      remainingAmount > 0
    ) {
      totalToReceive +=
        remainingAmount;

      openCount += 1;
    }

    if (
      status === "ATRASADO" &&
      remainingAmount > 0
    ) {
      totalOverdue +=
        remainingAmount;

      overdueCount += 1;
    }

    if (
      status === "PAGO"
    ) {
      receivedCount += 1;
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        title="A receber"
        value={totalToReceive}
        description={
          openCount === 1
            ? "1 cobrança em aberto"
            : `${openCount} cobranças em aberto`
        }
        icon={
          <WalletCards className="size-5" />
        }
      />

      <SummaryCard
        title="Em atraso"
        value={totalOverdue}
        description={
          overdueCount === 1
            ? "1 cobrança vencida"
            : `${overdueCount} cobranças vencidas`
        }
        icon={
          <Clock3 className="size-5" />
        }
      />

      <SummaryCard
        title="Recebido"
        value={totalReceived}
        description={
          receivedCount === 1
            ? "1 cobrança quitada"
            : `${receivedCount} cobranças quitadas`
        }
        icon={
          <CircleCheck className="size-5" />
        }
      />

      <SummaryCard
        title="Total contratado"
        value={totalContracted}
        description={
          contractedCount === 1
            ? "1 cobrança válida"
            : `${contractedCount} cobranças válidas`
        }
        icon={
          <FileText className="size-5" />
        }
      />
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;

  value: number;

  description: string;

  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          {title}
        </p>

        <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          {icon}
        </div>
      </div>

      <p className="mt-4 text-2xl font-bold tracking-tight">
        {formatMoney(value)}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}