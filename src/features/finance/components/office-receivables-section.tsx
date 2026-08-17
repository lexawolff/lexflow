import Link from "next/link";

import type {
  ReactNode,
} from "react";

import {
  AlertTriangle,
  CalendarDays,
  CircleCheck,
} from "lucide-react";

import {
  formatReceivableDate,
  getDateTimestamp,
  getEffectiveFinancialStatus,
} from "../lib/receivable-display";

import type {
  OfficeFinancialData,
} from "../types/office-financial";

import { OfficeFinancialSummary } from "./office-financial-summary";
import { OfficeReceivablesList } from "./office-receivables-list";

type Props = {
  data: OfficeFinancialData;
};

type AttentionTone =
  | "danger"
  | "upcoming";

function parseDateKey(
  value: string,
): number {
  const [
    year,
    month,
    day,
  ] =
    value
      .split("-")
      .map(Number);

  return Date.UTC(
    year,
    month - 1,
    day,
    12,
  );
}

function getFutureTimestamp(
  todayKey: string,
  days: number,
): number {
  return (
    parseDateKey(
      todayKey,
    ) +
    days *
      24 *
      60 *
      60 *
      1000
  );
}

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

export function OfficeReceivablesSection({
  data,
}: Props) {
  const overdue =
    data.receivables
      .filter(
        (receivable) => {
          const status =
            getEffectiveFinancialStatus(
              receivable.status,
              receivable.dueDate,
            );

          const remaining =
            Math.max(
              receivable.totalAmount -
                receivable.paidAmount,
              0,
            );

          return (
            status ===
              "ATRASADO" &&
            remaining > 0
          );
        },
      )
      .sort(
        (
          first,
          second,
        ) =>
          (getDateTimestamp(
            first.dueDate,
          ) ?? 0) -
          (getDateTimestamp(
            second.dueDate,
          ) ?? 0),
      )
      .slice(0, 5);

  const todayTimestamp =
    parseDateKey(
      data.todayKey,
    );

  const nextSevenDays =
    getFutureTimestamp(
      data.todayKey,
      7,
    );

  const upcoming =
    data.receivables
      .filter(
        (receivable) => {
          const status =
            getEffectiveFinancialStatus(
              receivable.status,
              receivable.dueDate,
            );

          if (
            status === "PAGO" ||
            status === "CANCELADO"
          ) {
            return false;
          }

          const dueTimestamp =
            getDateTimestamp(
              receivable.dueDate,
            );

          if (
            dueTimestamp === null
          ) {
            return false;
          }

          return (
            dueTimestamp >=
              todayTimestamp &&
            dueTimestamp <=
              nextSevenDays
          );
        },
      )
      .sort(
        (
          first,
          second,
        ) =>
          (getDateTimestamp(
            first.dueDate,
          ) ?? 0) -
          (getDateTimestamp(
            second.dueDate,
          ) ?? 0),
      )
      .slice(0, 5);

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CircleCheck className="size-5" />
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              Visão dos recebimentos
            </h2>

            <p className="text-sm text-muted-foreground">
              Resumo das receitas e
              valores ainda a receber.
            </p>
          </div>
        </div>

        <OfficeFinancialSummary
          receivables={
            data.receivables
          }
          todayKey={
            data.todayKey
          }
        />
      </section>

      {(overdue.length > 0 ||
        upcoming.length > 0) ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">
              Atenção
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Cobranças que merecem
              acompanhamento imediato
              ou estão próximas do
              vencimento.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <AttentionCard
              title="Em atraso"
              description="Cobranças que já ultrapassaram o vencimento."
              icon={
                <AlertTriangle className="size-5" />
              }
              receivables={
                overdue
              }
              emptyMessage="Nenhuma cobrança em atraso."
              tone="danger"
            />

            <AttentionCard
              title="Próximos 7 dias"
              description="Recebimentos com vencimento próximo."
              icon={
                <CalendarDays className="size-5" />
              }
              receivables={
                upcoming
              }
              emptyMessage="Nenhum vencimento nos próximos 7 dias."
              tone="upcoming"
            />
          </div>
        </section>
      ) : null}

      <OfficeReceivablesList
        receivables={
          data.receivables
        }
        clients={
          data.clients
        }
        todayKey={
          data.todayKey
        }
      />
    </div>
  );
}

type AttentionReceivable =
  OfficeFinancialData["receivables"][number];

function AttentionCard({
  title,
  description,
  icon,
  receivables,
  emptyMessage,
  tone,
}: {
  title: string;

  description: string;

  icon: ReactNode;

  receivables:
    AttentionReceivable[];

  emptyMessage: string;

  tone: AttentionTone;
}) {
  const isDanger =
    tone === "danger";

  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-card ${
        isDanger
          ? "border-red-200 dark:border-red-900"
          : "border-blue-200 dark:border-blue-900"
      }`}
    >
      <div
        className={`border-b p-4 ${
          isDanger
            ? "bg-red-50/50 dark:bg-red-950/15"
            : "bg-blue-50/50 dark:bg-blue-950/15"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex size-10 items-center justify-center rounded-xl ${
              isDanger
                ? "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300"
                : "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300"
            }`}
          >
            {icon}
          </div>

          <div>
            <h3
              className={`font-semibold ${
                isDanger
                  ? "text-red-900 dark:text-red-200"
                  : "text-blue-900 dark:text-blue-200"
              }`}
            >
              {title}
            </h3>

            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </div>

      {receivables.length ===
      0 ? (
        <div className="p-5 text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="divide-y">
          {receivables.map(
            (receivable) => {
              const remaining =
                Math.max(
                  receivable.totalAmount -
                    receivable.paidAmount,
                  0,
                );

              return (
                <div
                  key={
                    receivable.id
                  }
                  className="flex items-center justify-between gap-4 p-4 transition hover:bg-muted/30"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/clientes/${receivable.clientId}`}
                      className="text-sm font-semibold hover:underline"
                    >
                      {
                        receivable.clientName
                      }
                    </Link>

                    <p className="truncate text-sm text-muted-foreground">
                      {
                        receivable.description
                      }
                    </p>

                    <p
                      className={`mt-1 text-xs ${
                        isDanger
                          ? "font-medium text-red-700 dark:text-red-300"
                          : "text-blue-700 dark:text-blue-300"
                      }`}
                    >
                      {formatReceivableDate(
                        receivable.dueDate,
                      )}
                    </p>
                  </div>

                  <p
                    className={`shrink-0 font-bold ${
                      isDanger
                        ? "text-red-700 dark:text-red-300"
                        : "text-blue-700 dark:text-blue-300"
                    }`}
                  >
                    {formatMoney(
                      remaining,
                    )}
                  </p>
                </div>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}