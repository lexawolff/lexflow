import Link from "next/link";

import type {
  ReactNode,
} from "react";

import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  CircleDollarSign,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import {
  getEffectiveFinancialStatus,
  toDateInputValue,
} from "../lib/receivable-display";

import type {
  OfficeFinancialData,
} from "../types/office-financial";

type Props = {
  data: OfficeFinancialData;
};

type SummaryTone =
  | "income"
  | "expense"
  | "positive"
  | "negative"
  | "projection";

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

function formatSignedMoney(
  value: number,
): string {
  const formatted =
    Math.abs(value).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      },
    );

  if (value > 0) {
    return `+ ${formatted}`;
  }

  if (value < 0) {
    return `- ${formatted}`;
  }

  return formatted;
}

export function OfficeFinancialDashboard({
  data,
}: Props) {
  const currentMonth =
    data.todayKey.slice(
      0,
      7,
    );

  /*
   * ==========================
   * RECEITAS
   * ==========================
   */

  let totalToReceive = 0;

  let overdueReceivableAmount =
    0;

  let overdueReceivableCount =
    0;

  let receivedThisMonth = 0;

  let openReceivablesThisMonth =
    0;

  for (
    const receivable of
    data.receivables
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

    const remaining =
      Math.max(
        receivable.totalAmount -
          receivable.paidAmount,
        0,
      );

    if (remaining > 0) {
      totalToReceive +=
        remaining;
    }

    if (
      status === "ATRASADO" &&
      remaining > 0
    ) {
      overdueReceivableAmount +=
        remaining;

      overdueReceivableCount +=
        1;
    }

    const receivedAt =
      toDateInputValue(
        receivable.receivedAt,
      );

    if (
      receivable.paidAmount >
        0 &&
      receivedAt.startsWith(
        currentMonth,
      )
    ) {
      receivedThisMonth +=
        receivable.paidAmount;
    }

    const dueDate =
      toDateInputValue(
        receivable.dueDate,
      );

    if (
      remaining > 0 &&
      dueDate.startsWith(
        currentMonth,
      )
    ) {
      openReceivablesThisMonth +=
        remaining;
    }
  }

  /*
   * ==========================
   * DESPESAS
   * ==========================
   */

  let totalToPay = 0;

  let overduePayableAmount =
    0;

  let overduePayableCount =
    0;

  let paidThisMonth = 0;

  let openPayablesThisMonth =
    0;

  for (
    const payable of
    data.payables
  ) {
    const status =
      getEffectiveFinancialStatus(
        payable.status,
        payable.dueDate,
      );

    if (
      status === "CANCELADO"
    ) {
      continue;
    }

    if (
      status !== "PAGO"
    ) {
      totalToPay +=
        payable.amount;
    }

    if (
      status === "ATRASADO"
    ) {
      overduePayableAmount +=
        payable.amount;

      overduePayableCount +=
        1;
    }

    const paidAt =
      toDateInputValue(
        payable.paidAt,
      );

    if (
      status === "PAGO" &&
      paidAt.startsWith(
        currentMonth,
      )
    ) {
      paidThisMonth +=
        payable.amount;
    }

    const dueDate =
      toDateInputValue(
        payable.dueDate,
      );

    if (
      status !== "PAGO" &&
      dueDate.startsWith(
        currentMonth,
      )
    ) {
      openPayablesThisMonth +=
        payable.amount;
    }
  }

  /*
   * ==========================
   * RESULTADOS
   * ==========================
   */

  const realizedResult =
    receivedThisMonth -
    paidThisMonth;

  const projectedReceipts =
    receivedThisMonth +
    openReceivablesThisMonth;

  const projectedExpenses =
    paidThisMonth +
    openPayablesThisMonth;

  const projectedResult =
    projectedReceipts -
    projectedExpenses;

  const realizedResultTone: SummaryTone =
    realizedResult >= 0
      ? "positive"
      : "negative";

  const projectedResultTone: SummaryTone =
    projectedResult >= 0
      ? "projection"
      : "negative";

  return (
    <div className="space-y-8">
      {/* ==========================
          INDICADORES PRINCIPAIS
      ========================== */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Recebido no mês"
          value={receivedThisMonth}
          description="Entradas realizadas neste mês"
          icon={
            <ArrowDownToLine className="size-5" />
          }
          tone="income"
        />

        <SummaryCard
          title="Pago no mês"
          value={paidThisMonth}
          description="Despesas pagas neste mês"
          icon={
            <ArrowUpFromLine className="size-5" />
          }
          tone="expense"
        />

        <SummaryCard
          title="Resultado do mês"
          value={realizedResult}
          description="Entradas menos saídas realizadas"
          icon={
            realizedResult >= 0 ? (
              <CircleDollarSign className="size-5" />
            ) : (
              <TrendingDown className="size-5" />
            )
          }
          tone={
            realizedResultTone
          }
          signed
        />

        <SummaryCard
          title="Resultado previsto"
          value={projectedResult}
          description="Projeção até o fim do mês"
          icon={
            projectedResult >= 0 ? (
              <TrendingUp className="size-5" />
            ) : (
              <TrendingDown className="size-5" />
            )
          }
          tone={
            projectedResultTone
          }
          signed
        />
      </section>

      {/* ==========================
          RECEITAS E DESPESAS
      ========================== */}

      <section className="grid gap-5 xl:grid-cols-2">
        <FinancialAreaCard
          title="Receitas"
          description="Honorários e demais valores dos clientes."
          href="/financeiro/recebimentos"
          buttonLabel="Abrir recebimentos"
          icon={
            <ArrowDownToLine className="size-5" />
          }
          tone="income"
          primaryLabel="A receber"
          primaryValue={
            totalToReceive
          }
          secondaryLabel="Em atraso"
          secondaryValue={
            overdueReceivableAmount
          }
          alertCount={
            overdueReceivableCount
          }
          alertLabel={
            overdueReceivableCount ===
            1
              ? "1 cobrança vencida"
              : `${overdueReceivableCount} cobranças vencidas`
          }
        />

        <FinancialAreaCard
          title="Despesas"
          description="Contas e obrigações financeiras do escritório."
          href="/financeiro/contas-a-pagar"
          buttonLabel="Abrir contas a pagar"
          icon={
            <ArrowUpFromLine className="size-5" />
          }
          tone="expense"
          primaryLabel="A pagar"
          primaryValue={
            totalToPay
          }
          secondaryLabel="Em atraso"
          secondaryValue={
            overduePayableAmount
          }
          alertCount={
            overduePayableCount
          }
          alertLabel={
            overduePayableCount ===
            1
              ? "1 conta vencida"
              : `${overduePayableCount} contas vencidas`
          }
        />
      </section>

      {/* ==========================
          PROJEÇÃO DO MÊS
      ========================== */}

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="border-b bg-muted/20 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
              <TrendingUp className="size-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Projeção do mês
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Entradas, saídas e
                resultado esperado
                até o encerramento
                do mês atual.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <ProjectionGroup
              title="Entradas"
              description="Receitas do escritório"
              icon={
                <ArrowDownToLine className="size-5" />
              }
              tone="income"
              realizedLabel="Realizadas"
              realizedValue={
                receivedThisMonth
              }
              pendingLabel="A realizar"
              pendingValue={
                openReceivablesThisMonth
              }
              totalLabel="Total previsto"
              totalValue={
                projectedReceipts
              }
            />

            <ProjectionGroup
              title="Saídas"
              description="Despesas do escritório"
              icon={
                <ArrowUpFromLine className="size-5" />
              }
              tone="expense"
              realizedLabel="Realizadas"
              realizedValue={
                paidThisMonth
              }
              pendingLabel="A realizar"
              pendingValue={
                openPayablesThisMonth
              }
              totalLabel="Total previsto"
              totalValue={
                projectedExpenses
              }
            />
          </div>

          <div
            className={`mt-5 rounded-xl border p-5 ${
              projectedResult >=
              0
                ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20"
                : "border-red-200 bg-red-50/70 dark:border-red-900 dark:bg-red-950/20"
            }`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-10 items-center justify-center rounded-xl ${
                    projectedResult >=
                    0
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300"
                  }`}
                >
                  {projectedResult >=
                  0 ? (
                    <TrendingUp className="size-5" />
                  ) : (
                    <TrendingDown className="size-5" />
                  )}
                </div>

                <div>
                  <p className="font-semibold">
                    Resultado projetado
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Saldo esperado
                    considerando
                    entradas e saídas
                    deste mês.
                  </p>
                </div>
              </div>

              <div className="sm:text-right">
                <p
                  className={`text-2xl font-bold tracking-tight ${
                    projectedResult >=
                    0
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-red-700 dark:text-red-300"
                  }`}
                >
                  {formatSignedMoney(
                    projectedResult,
                  )}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  até o fim do mês
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/*
 * ==========================
 * CARD PRINCIPAL
 * ==========================
 */

function SummaryCard({
  title,
  value,
  description,
  icon,
  tone,
  signed = false,
}: {
  title: string;

  value: number;

  description: string;

  icon: ReactNode;

  tone: SummaryTone;

  signed?: boolean;
}) {
  const styles =
    getSummaryToneStyles(
      tone,
    );

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
        {signed
          ? formatSignedMoney(
              value,
            )
          : formatMoney(value)}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

/*
 * ==========================
 * RECEITAS / DESPESAS
 * ==========================
 */

function FinancialAreaCard({
  title,
  description,
  href,
  buttonLabel,
  icon,
  tone,
  primaryLabel,
  primaryValue,
  secondaryLabel,
  secondaryValue,
  alertCount,
  alertLabel,
}: {
  title: string;

  description: string;

  href: string;

  buttonLabel: string;

  icon: ReactNode;

  tone:
    | "income"
    | "expense";

  primaryLabel: string;

  primaryValue: number;

  secondaryLabel: string;

  secondaryValue: number;

  alertCount: number;

  alertLabel: string;
}) {
  const isIncome =
    tone === "income";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-card ${
        isIncome
          ? "border-emerald-200/80 dark:border-emerald-900"
          : "border-rose-200/80 dark:border-rose-900"
      }`}
    >
      <div
        className={`absolute inset-y-0 left-0 w-1 ${
          isIncome
            ? "bg-emerald-500"
            : "bg-rose-500"
        }`}
      />

      <div className="p-5 pl-6">
        <div className="flex items-start gap-3">
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
              isIncome
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
            }`}
          >
            {icon}
          </div>

          <div>
            <h2 className="text-base font-semibold">
              {title}
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div
            className={`rounded-xl p-4 ${
              isIncome
                ? "bg-emerald-50/80 dark:bg-emerald-950/20"
                : "bg-rose-50/80 dark:bg-rose-950/20"
            }`}
          >
            <p className="text-xs font-medium text-muted-foreground">
              {primaryLabel}
            </p>

            <p
              className={`mt-1 text-xl font-bold ${
                isIncome
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-rose-700 dark:text-rose-300"
              }`}
            >
              {formatMoney(
                primaryValue,
              )}
            </p>
          </div>

          <div
            className={`rounded-xl p-4 ${
              alertCount > 0
                ? "bg-amber-50 dark:bg-amber-950/20"
                : "bg-muted/40"
            }`}
          >
            <p className="text-xs font-medium text-muted-foreground">
              {secondaryLabel}
            </p>

            <p
              className={`mt-1 text-xl font-bold ${
                alertCount > 0
                  ? "text-amber-700 dark:text-amber-300"
                  : ""
              }`}
            >
              {formatMoney(
                secondaryValue,
              )}
            </p>
          </div>
        </div>

        <div
          className={`mt-5 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            alertCount > 0
              ? "bg-amber-50 text-amber-800 dark:bg-amber-950/20 dark:text-amber-300"
              : "bg-muted/40 text-muted-foreground"
          }`}
        >
          {alertCount > 0 ? (
            <AlertTriangle className="size-4 shrink-0" />
          ) : (
            <WalletCards className="size-4 shrink-0" />
          )}

          {alertCount > 0
            ? alertLabel
            : "Nenhuma pendência vencida."}
        </div>

        <div className="mt-5 border-t pt-4">
          <Link
            href={href}
            className={`inline-flex items-center gap-2 text-sm font-semibold transition hover:gap-3 ${
              isIncome
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-rose-700 dark:text-rose-300"
            }`}
          >
            {buttonLabel}

            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/*
 * ==========================
 * PROJEÇÃO
 * ==========================
 */

function ProjectionGroup({
  title,
  description,
  icon,
  tone,
  realizedLabel,
  realizedValue,
  pendingLabel,
  pendingValue,
  totalLabel,
  totalValue,
}: {
  title: string;

  description: string;

  icon: ReactNode;

  tone:
    | "income"
    | "expense";

  realizedLabel: string;

  realizedValue: number;

  pendingLabel: string;

  pendingValue: number;

  totalLabel: string;

  totalValue: number;
}) {
  const isIncome =
    tone === "income";

  return (
    <div
      className={`rounded-xl border p-4 ${
        isIncome
          ? "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/10"
          : "border-rose-200 bg-rose-50/40 dark:border-rose-900 dark:bg-rose-950/10"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex size-9 items-center justify-center rounded-lg ${
            isIncome
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
              : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
          }`}
        >
          {icon}
        </div>

        <div>
          <h3 className="font-semibold">
            {title}
          </h3>

          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <ProjectionItem
          label={
            realizedLabel
          }
          value={
            realizedValue
          }
        />

        <ProjectionItem
          label={
            pendingLabel
          }
          value={
            pendingValue
          }
        />
      </div>

      <div className="mt-4 border-t pt-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-medium text-muted-foreground">
            {totalLabel}
          </span>

          <span
            className={`font-bold ${
              isIncome
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-rose-700 dark:text-rose-300"
            }`}
          >
            {formatMoney(
              totalValue,
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

function ProjectionItem({
  label,
  value,
}: {
  label: string;

  value: number;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold">
        {formatMoney(value)}
      </p>
    </div>
  );
}

/*
 * ==========================
 * CORES DOS CARDS
 * ==========================
 */

function getSummaryToneStyles(
  tone: SummaryTone,
) {
  switch (tone) {
    case "income":
      return {
        container:
          "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20",

        accent:
          "bg-emerald-500",

        title:
          "text-emerald-800 dark:text-emerald-300",

        value:
          "text-emerald-800 dark:text-emerald-200",

        icon:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
      };

    case "expense":
      return {
        container:
          "border-rose-200 bg-rose-50/60 dark:border-rose-900 dark:bg-rose-950/20",

        accent:
          "bg-rose-500",

        title:
          "text-rose-800 dark:text-rose-300",

        value:
          "text-rose-800 dark:text-rose-200",

        icon:
          "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300",
      };

    case "positive":
      return {
        container:
          "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/15",

        accent:
          "bg-emerald-500",

        title:
          "text-emerald-800 dark:text-emerald-300",

        value:
          "text-emerald-700 dark:text-emerald-300",

        icon:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
      };

    case "negative":
      return {
        container:
          "border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/20",

        accent:
          "bg-red-500",

        title:
          "text-red-800 dark:text-red-300",

        value:
          "text-red-700 dark:text-red-300",

        icon:
          "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300",
      };

    case "projection":
      return {
        container:
          "border-blue-200 bg-blue-50/60 dark:border-blue-900 dark:bg-blue-950/20",

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