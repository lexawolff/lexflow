"use client";

import type { ReactNode } from "react";

import {
  CalendarClock,
  CircleCheck,
  Clock3,
  WalletCards,
} from "lucide-react";

import {
  getEffectiveFinancialStatus,
  toDateInputValue,
} from "../lib/receivable-display";

import type { OfficeReceivable } from "../types/office-financial";

type Props = {
  receivables: OfficeReceivable[];
  todayKey: string;
};

type CardTone =
  | "receivable"
  | "overdue"
  | "received"
  | "forecast";

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

export function OfficeFinancialSummary({
  receivables,
  todayKey,
}: Props) {
  const currentMonth =
    todayKey.slice(0, 7);

  let totalToReceive = 0;
  let totalOverdue = 0;
  let receivedThisMonth = 0;
  let expectedThisMonth = 0;

  let openCount = 0;
  let overdueCount = 0;
  let receivedThisMonthCount = 0;
  let expectedThisMonthCount = 0;

  for (
    const receivable of
    receivables
  ) {
    const status =
      getEffectiveFinancialStatus(
        receivable.status,
        receivable.dueDate,
      );

    if (
      status === "CANCELADO"
    ) {
      continue;
    }

    const remainingAmount =
      Math.max(
        receivable.totalAmount -
          receivable.paidAmount,
        0,
      );

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

    const receivedAt =
      toDateInputValue(
        receivable.receivedAt,
      );

    if (
      receivable.paidAmount > 0 &&
      receivedAt.startsWith(
        currentMonth,
      )
    ) {
      receivedThisMonth +=
        receivable.paidAmount;

      receivedThisMonthCount += 1;
    }

    const dueDate =
      toDateInputValue(
        receivable.dueDate,
      );

    if (
      remainingAmount > 0 &&
      dueDate.startsWith(
        currentMonth,
      )
    ) {
      expectedThisMonth +=
        remainingAmount;

      expectedThisMonthCount += 1;
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
        tone="receivable"
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
        tone="overdue"
      />

      <SummaryCard
        title="Recebido no mês"
        value={receivedThisMonth}
        description={
          receivedThisMonthCount ===
          1
            ? "1 recebimento realizado"
            : `${receivedThisMonthCount} recebimentos realizados`
        }
        icon={
          <CircleCheck className="size-5" />
        }
        tone="received"
      />

      <SummaryCard
        title="Previsto neste mês"
        value={expectedThisMonth}
        description={
          expectedThisMonthCount ===
          1
            ? "1 cobrança prevista"
            : `${expectedThisMonthCount} cobranças previstas`
        }
        icon={
          <CalendarClock className="size-5" />
        }
        tone="forecast"
      />
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon,
  tone,
}: {
  title: string;
  value: number;
  description: string;
  icon: ReactNode;
  tone: CardTone;
}) {
  const styles =
    getToneStyles(tone);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 ${styles.container}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 ${styles.accent}`}
      />

      <div className="flex items-center justify-between gap-3">
        <p
          className={`text-sm font-semibold ${styles.title}`}
        >
          {title}
        </p>

        <div
          className={`flex size-10 items-center justify-center rounded-xl ${styles.icon}`}
        >
          {icon}
        </div>
      </div>

      <p
        className={`mt-5 text-2xl font-bold tracking-tight ${styles.value}`}
      >
        {formatMoney(value)}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function getToneStyles(
  tone: CardTone,
) {
  switch (tone) {
    case "receivable":
      return {
        container:
          "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/15",

        accent:
          "bg-emerald-500",

        title:
          "text-emerald-800 dark:text-emerald-300",

        value:
          "text-emerald-800 dark:text-emerald-200",

        icon:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
      };

    case "overdue":
      return {
        container:
          "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/15",

        accent:
          "bg-red-500",

        title:
          "text-red-800 dark:text-red-300",

        value:
          "text-red-700 dark:text-red-300",

        icon:
          "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300",
      };

    case "received":
      return {
        container:
          "border-teal-200 bg-teal-50/50 dark:border-teal-900 dark:bg-teal-950/15",

        accent:
          "bg-teal-500",

        title:
          "text-teal-800 dark:text-teal-300",

        value:
          "text-teal-800 dark:text-teal-200",

        icon:
          "bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300",
      };

    case "forecast":
      return {
        container:
          "border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/15",

        accent:
          "bg-blue-500",

        title:
          "text-blue-800 dark:text-blue-300",

        value:
          "text-blue-800 dark:text-blue-200",

        icon:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300",
      };
  }
}