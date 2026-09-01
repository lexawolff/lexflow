import type {
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
    dateKey.split("-");

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
  switch (type) {
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

function SummaryCard({
  title,
  value,
  description,
  icon,
  className = "",
}: {
  title:
    string;

  value:
    ReactNode;

  description?:
    ReactNode;

  icon:
    ReactNode;

  className?:
    string;
}) {
  return (
    <div
      className={`rounded-2xl border bg-card p-5 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {icon}
        </div>

        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {title}
          </p>

          <div className="mt-1 break-words font-semibold">
            {value}
          </div>

          {description ? (
            <div className="mt-1 text-xs text-muted-foreground">
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
   * ativo do processo.
   */
  const nextDeadline =
    tasks.find(
      (task) =>
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
      (task) => {
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
        ) < todayKey
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
      <SummaryCard
        title={
          deadlineIsOverdue
            ? "Prazo vencido"
            : "Próximo prazo"
        }
        icon={
          deadlineIsOverdue ? (
            <div className="flex size-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              <ClockAlert className="size-5" />
            </div>
          ) : (
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
              <CalendarClock className="size-5" />
            </div>
          )
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
        className={
          deadlineIsOverdue
            ? "border-rose-200 bg-rose-50/30 dark:border-rose-900 dark:bg-rose-950/10"
            : "border-amber-200 bg-amber-50/30 dark:border-amber-900 dark:bg-amber-950/10"
        }
      />

      <SummaryCard
        title="Próximo compromisso"
        icon={
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            <CalendarClock className="size-5" />
          </div>
        }
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
              {getAppointmentLabel(
                nextAppointment.type,
              )}

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
        className="border-blue-200 bg-blue-50/30 dark:border-blue-900 dark:bg-blue-950/10"
      />

      <SummaryCard
        title="Identificação"
        icon={
          <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <FileText className="size-5" />
          </div>
        }
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

      <SummaryCard
        title="Valor da causa"
        icon={
          <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Scale className="size-5" />
          </div>
        }
        value={
          currency
        }
        description="Valor cadastrado na demanda"
      />
    </div>
  );
}