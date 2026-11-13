import type {
  ElementType,
  ReactNode,
} from "react";

import {
  TaskType,
} from "@prisma/client";

import {
  CalendarClock,
  ClockAlert,
  FileText,
  Scale,
} from "lucide-react";

import type {
  CaseDetails,
} from "../types";

import type {
  CaseAgendaTask,
} from "../services/get-case-agenda-data";

type Props = {
  caseData:
    CaseDetails;

  tasks:
    CaseAgendaTask[];

  todayKey:
    string;
};

const TIME_ZONE =
  "America/Sao_Paulo";

function formatDateKey(
  value:
    string,
): string {
  const dateKey =
    value.slice(
      0,
      10,
    );

  const [
    year,
    month,
    day,
  ] =
    dateKey.split(
      "-",
    );

  return `${day}/${month}/${year}`;
}

function formatTime(
  value:
    string,
): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      hour:
        "2-digit",

      minute:
        "2-digit",

      hour12:
        false,

      timeZone:
        TIME_ZONE,
    },
  ).format(
    new Date(
      value,
    ),
  );
}

function isAppointmentType(
  type:
    TaskType,
): boolean {
  return (
    type ===
      TaskType.PERICIA ||
    type ===
      TaskType.AUDIENCIA ||
    type ===
      TaskType.ATENDIMENTO
  );
}

function getAppointmentLabel(
  type:
    TaskType,
): string {
  switch (
    type
  ) {
    case TaskType.PERICIA:
      return "Perícia";

    case TaskType.AUDIENCIA:
      return "Audiência";

    case TaskType.ATENDIMENTO:
      return "Atendimento";

    default:
      return "Compromisso";
  }
}

type SummaryCardProps = {
  title:
    string;

  value:
    ReactNode;

  description?:
    ReactNode;

  icon:
    ElementType;

  tone:
    "neutral" |
    "blue" |
    "amber" |
    "rose" |
    "emerald";
};

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  tone,
}: SummaryCardProps) {
  const styles = {
    neutral: {
      container:
        "border-slate-200 bg-card dark:border-slate-800",

      accent:
        "bg-slate-300 dark:bg-slate-700",

      icon:
        "bg-muted text-muted-foreground",

      value:
        "text-foreground",
    },

    blue: {
      container:
        "border-blue-200 bg-blue-50/20 dark:border-blue-900 dark:bg-blue-950/10",

      accent:
        "bg-blue-400 dark:bg-blue-700",

      icon:
        "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",

      value:
        "text-blue-950 dark:text-blue-100",
    },

    amber: {
      container:
        "border-amber-200 bg-amber-50/20 dark:border-amber-900 dark:bg-amber-950/10",

      accent:
        "bg-amber-400 dark:bg-amber-700",

      icon:
        "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",

      value:
        "text-amber-950 dark:text-amber-100",
    },

    rose: {
      container:
        "border-rose-200 bg-rose-50/30 dark:border-rose-900 dark:bg-rose-950/10",

      accent:
        "bg-rose-500 dark:bg-rose-700",

      icon:
        "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",

      value:
        "text-rose-700 dark:text-rose-300",
    },

    emerald: {
      container:
        "border-emerald-200 bg-emerald-50/20 dark:border-emerald-900 dark:bg-emerald-950/10",

      accent:
        "bg-emerald-400 dark:bg-emerald-700",

      icon:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",

      value:
        "text-emerald-800 dark:text-emerald-200",
    },
  }[
    tone
  ];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${styles.container}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 ${styles.accent}`}
      />

      <div className="flex items-start gap-4">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
        >
          <Icon className="size-5" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>

          <div
            className={`mt-1.5 break-words text-lg font-bold tracking-tight ${styles.value}`}
          >
            {value}
          </div>

          {description ? (
            <div className="mt-1 text-xs leading-5 text-muted-foreground">
              {description}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function CaseSummaryCards({
  caseData,
  tasks,
  todayKey,
}: Props) {
  /*
   * Primeiro prazo processual
   * ativo do caso.
   */

  const nextDeadline =
    tasks.find(
      (
        task,
      ) =>
        task.type ===
        TaskType.PRAZO_PROCESSUAL,
    ) ??
    null;

  /*
   * Próxima perícia,
   * audiência ou atendimento.
   */

  const nextAppointment =
    tasks.find(
      (
        task,
      ) => {
        const dateKey =
          task.dueDate.slice(
            0,
            10,
          );

        return (
          dateKey >=
            todayKey &&
          isAppointmentType(
            task.type,
          )
        );
      },
    ) ??
    null;

  const deadlineIsOverdue =
    nextDeadline
      ? nextDeadline.dueDate.slice(
          0,
          10,
        ) <
        todayKey
      : false;

  const currency =
    caseData.claimValue !=
    null
      ? new Intl.NumberFormat(
          "pt-BR",
          {
            style:
              "currency",

            currency:
              "BRL",
          },
        ).format(
          Number(
            caseData.claimValue,
          ),
        )
      : "-";

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {/* ==========================
          PRAZO
      ========================== */}

      <SummaryCard
        title={
          deadlineIsOverdue
            ? "Prazo vencido"
            : "Próximo prazo"
        }
        icon={
          deadlineIsOverdue
            ? ClockAlert
            : CalendarClock
        }
        tone={
          deadlineIsOverdue
            ? "rose"
            : "amber"
        }
        value={
          nextDeadline
            ? formatDateKey(
                nextDeadline.dueDate,
              )
            : "-"
        }
        description={
          nextDeadline
            ?.title ??
          "Nenhum prazo ativo"
        }
      />

      {/* ==========================
          COMPROMISSO
      ========================== */}

      <SummaryCard
        title="Próximo compromisso"
        icon={
          CalendarClock
        }
        tone="blue"
        value={
          nextAppointment
            ? formatDateKey(
                nextAppointment.dueDate,
              )
            : "-"
        }
        description={
          nextAppointment ? (
            <>
              {
                getAppointmentLabel(
                  nextAppointment.type,
                )
              }

              {nextAppointment.startsAt
                ? ` • ${formatTime(
                    nextAppointment.startsAt,
                  )}`
                : ""}
            </>
          ) : (
            "Nenhum compromisso futuro"
          )
        }
      />

      {/* ==========================
          IDENTIFICAÇÃO
      ========================== */}

      <SummaryCard
        title="Identificação"
        icon={
          FileText
        }
        tone="neutral"
        value={
          caseData.number ??
          caseData.administrativeNumber ??
          "-"
        }
        description={
          caseData.number &&
          caseData.administrativeNumber
            ? `NB ${caseData.administrativeNumber}`
            : caseData.number
              ? "Processo judicial"
              : caseData.administrativeNumber
                ? "Número do benefício"
                : "Sem numeração informada"
        }
      />

      {/* ==========================
          VALOR
      ========================== */}

      <SummaryCard
        title="Valor da causa"
        icon={
          Scale
        }
        tone="emerald"
        value={
          currency
        }
        description="Valor cadastrado no caso"
      />
    </div>
  );
}