import Link from "next/link";

import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  FilePlus2,
  Scale,
} from "lucide-react";

import type {
  ClientDetails,
} from "@/features/clients/types";

import {
  CaseStatusBadge,
} from "./case-status-badge";

import {
  PracticeAreaBadge,
} from "./practice-area-badge";

type ClientCasesListProps = {
  clientId:
    string;

  cases:
    ClientDetails["cases"];

  canCreateCase:
    boolean;
};

function formatCreatedAt(
  value:
    string,
): string {
  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric",

      timeZone:
        "America/Sao_Paulo",
    },
  ).format(
    date,
  );
}

export function ClientCasesList({
  clientId,
  cases,
  canCreateCase,
}: ClientCasesListProps) {
  if (
    cases.length ===
    0
  ) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted">
          <Briefcase className="size-5 text-muted-foreground" />
        </div>

        <p className="mt-4 font-medium">
          Nenhum caso cadastrado
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          Este cliente ainda não possui casos cadastrados.
        </p>

        {canCreateCase ? (
          <Link
            href={`/clientes/${clientId}/casos/novo`}
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            <FilePlus2 className="size-4" />

            Novo caso
          </Link>
        ) : null}
      </div>
    );
  }

  const activeCases =
    cases.filter(
      (item) =>
        item.status !==
        "ENCERRADO",
    );

  const closedCases =
    cases.filter(
      (item) =>
        item.status ===
        "ENCERRADO",
    );

  function renderCase(
    item:
      ClientDetails["cases"][number],
  ) {
    const identification =
      item.number
        ? `Processo: ${item.number}`
        : item.administrativeNumber
          ? `NB: ${item.administrativeNumber}`
          : "Sem número informado";

    return (
      <Link
        key={
          item.id
        }
        href={`/clientes/${clientId}/casos/${item.id}`}
        className="group block rounded-2xl border bg-card p-5 transition hover:border-primary/50 hover:shadow-sm"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <PracticeAreaBadge
                area={
                  item.practiceArea
                }
              />

              <CaseStatusBadge
                status={
                  item.status
                }
              />
            </div>

            <h3 className="mt-3 break-words text-base font-semibold">
              {
                item.title
              }
            </h3>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Scale className="size-4" />

                {
                  identification
                }
              </span>

              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-4" />

                Cadastrado em{" "}
                {formatCreatedAt(
                  item.createdAt,
                )}
              </span>
            </div>
          </div>

          <div className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground transition group-hover:border-primary/30 group-hover:text-primary">
            <ArrowRight className="size-4" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-semibold">
              Casos ativos
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {activeCases.length === 1 ? "1 caso em andamento." : `${activeCases.length} casos em andamento.`}
            </p>
          </div>

          {canCreateCase ? (
            <Link
              href={`/clientes/${clientId}/casos/novo`}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition hover:bg-muted"
            >
              <FilePlus2 className="size-4" />

              Novo caso
            </Link>
          ) : null}
        </div>

        {activeCases.length >
        0 ? (
          <div className="space-y-3">
            {activeCases.map(
              renderCase,
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum caso ativo.
            </p>
          </div>
        )}
      </section>

      {closedCases.length >
      0 ? (
        <section className="space-y-3">
          <div>
            <h2 className="font-semibold">
              Casos encerrados
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {closedCases.length === 1 ? "1 caso finalizado." : `${closedCases.length} casos finalizados.`}
            </p>
          </div>

          <div className="space-y-3 opacity-80">
            {closedCases.map(
              renderCase,
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}