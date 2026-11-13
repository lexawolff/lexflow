import Link from "next/link";

import {
  CaseStatus,
} from "@prisma/client";

import {
  BriefcaseBusiness,
  ChevronRight,
  CircleCheckBig,
  Clock3,
  Plus,
  Search,
} from "lucide-react";

import {
  AppShell,
} from "@/components/app-shell/app-shell";

import {
  CASE_STATUS_LABELS,
  PRACTICE_AREA_LABELS,
} from "@/features/cases/constants";

import {
  hasPermission,
  requireWorkspacePagePermission,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

/* =========================================
   TIPOS
========================================= */

type Props = {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
};

/* =========================================
   STATUS
========================================= */

function isCaseStatus(
  value:
    string | undefined,
): value is CaseStatus {
  if (!value) {
    return false;
  }

  return Object.values(
    CaseStatus,
  ).includes(
    value as CaseStatus,
  );
}

function getStatusClasses(
  status:
    CaseStatus,
): string {
  switch (status) {
    case CaseStatus.ATENDIMENTO_INICIAL:
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300";

    case CaseStatus.DOCUMENTACAO_PENDENTE:
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300";

    case CaseStatus.ADMINISTRATIVO:
      return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-300";

    case CaseStatus.INICIAL_EM_ELABORACAO:
      return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-300";

    case CaseStatus.PROTOCOLADO:
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300";

    case CaseStatus.AGUARDANDO_PERICIA:
      return "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-300";

    case CaseStatus.AGUARDANDO_SENTENCA:
      return "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300";

    case CaseStatus.RECURSO:
      return "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950/30 dark:text-purple-300";

    case CaseStatus.CUMPRIMENTO_SENTENCA:
      return "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-300";

    case CaseStatus.RPV_EXPEDIDA:
      return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-300";

    case CaseStatus.RPV_PAGA:
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300";

    case CaseStatus.ENCERRADO:
      return "border-border bg-muted text-muted-foreground";

    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

/* =========================================
   DATA
========================================= */

function formatDate(
  value:
    Date,
): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric",
    },
  ).format(
    value,
  );
}

/* =========================================
   PAGE
========================================= */

export default async function CasesPage({
  searchParams,
}: Props) {
  const {
    workspace,
    membership,
  } =
    await requireWorkspacePagePermission(
      "CASE_VIEW",
    );

  const canCreateCase =
    hasPermission(
      membership.role,
      "CASE_CREATE",
    );

  const params =
    await searchParams;

  const query =
    params.q
      ?.trim() ??
    "";

  const selectedStatus =
    isCaseStatus(
      params.status,
    )
      ? params.status
      : undefined;

  /* =======================================
     RESUMOS
  ======================================= */

  const [
    totalCases,
    activeCases,
    closedCases,
    cases,
  ] =
    await Promise.all([
      prisma.case.count({
        where: {
          workspaceId:
            workspace.id,
        },
      }),

      prisma.case.count({
        where: {
          workspaceId:
            workspace.id,

          status: {
            not:
              CaseStatus.ENCERRADO,
          },
        },
      }),

      prisma.case.count({
        where: {
          workspaceId:
            workspace.id,

          status:
            CaseStatus.ENCERRADO,
        },
      }),

      prisma.case.findMany({
        where: {
          workspaceId:
            workspace.id,

          status:
            selectedStatus,

          ...(query
            ? {
                OR: [
                  {
                    title: {
                      contains:
                        query,

                      mode:
                        "insensitive",
                    },
                  },

                  {
                    number: {
                      contains:
                        query,

                      mode:
                        "insensitive",
                    },
                  },

                  {
                    administrativeNumber: {
                      contains:
                        query,

                      mode:
                        "insensitive",
                    },
                  },

                  {
                    administrativeProcess: {
                      contains:
                        query,

                      mode:
                        "insensitive",
                    },
                  },

                  {
                    opposingParty: {
                      contains:
                        query,

                      mode:
                        "insensitive",
                    },
                  },

                  {
                    client: {
                      name: {
                        contains:
                          query,

                        mode:
                          "insensitive",
                      },
                    },
                  },
                ],
              }
            : {}),
        },

        select: {
          id:
            true,

          clientId:
            true,

          title:
            true,

          number:
            true,

          administrativeNumber:
            true,

          practiceArea:
            true,

          status:
            true,

          updatedAt:
            true,

          client: {
            select: {
              id:
                true,

              name:
                true,
            },
          },
        },

        orderBy: {
          updatedAt:
            "desc",
        },
      }),
    ]);

  const hasFilters =
    Boolean(
      query ||
      selectedStatus,
    );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* ================================
            CABEÇALHO
        ================================= */}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Casos
            </h1>

            <p className="mt-1 text-muted-foreground">
              Acompanhe todas as casos
              administrativas e judiciais
              do escritório.
            </p>
          </div>

          {canCreateCase ? (
            <Link
              href="/clientes"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              <Plus className="size-4" />

              Novo caso
            </Link>
          ) : null}
        </div>

        {/* ================================
            CARDS
        ================================= */}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900 dark:bg-blue-950/10">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                <BriefcaseBusiness className="size-5" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Total de casos
                </p>

                <p className="text-2xl font-bold">
                  {totalCases}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900 dark:bg-amber-950/10">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                <Clock3 className="size-5" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Em andamento
                </p>

                <p className="text-2xl font-bold">
                  {activeCases}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-900 dark:bg-emerald-950/10">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                <CircleCheckBig className="size-5" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground">
                  Encerrados
                </p>

                <p className="text-2xl font-bold">
                  {closedCases}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================================
            FILTROS
        ================================= */}

        <form
          method="get"
          className="rounded-2xl border bg-card p-4"
        >
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <input
                name="q"
                defaultValue={
                  query
                }
                placeholder="Pesquisar por título, processo, cliente, NB ou parte contrária..."
                className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>

            <select
              name="status"
              defaultValue={
                selectedStatus ??
                ""
              }
              className="h-10 rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20 lg:w-64"
            >
              <option value="">
                Todos os status
              </option>

              {Object.values(
                CaseStatus,
              ).map(
                (
                  status,
                ) => (
                  <option
                    key={
                      status
                    }
                    value={
                      status
                    }
                  >
                    {
                      CASE_STATUS_LABELS[
                        status
                      ]
                    }
                  </option>
                ),
              )}
            </select>

            <button
              type="submit"
              className="h-10 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Filtrar
            </button>

            {hasFilters ? (
              <Link
                href="/casos"
                className="inline-flex h-10 items-center justify-center rounded-lg border bg-background px-4 text-sm font-medium transition hover:bg-muted"
              >
                Limpar
              </Link>
            ) : null}
          </div>
        </form>

        {/* ================================
            LISTA
        ================================= */}

        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="border-b px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold">
                  Casos
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {cases.length === 1
                    ? "1 caso encontrado"
                    : `${cases.length} casos encontrados`}
                </p>
              </div>
            </div>
          </div>

          {cases.length === 0 ? (
            <div className="p-10 text-center">
              <BriefcaseBusiness className="mx-auto size-10 text-muted-foreground/40" />

              <h3 className="mt-4 font-semibold">
                Nenhum caso encontrado
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                {hasFilters
                  ? "Tente alterar os filtros utilizados."
                  : "As casos cadastrados no escritório aparecerão aqui."}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {cases.map(
                (
                  caseItem,
                ) => {
                  const identifier =
                    caseItem.number ??
                    caseItem.administrativeNumber;

                  return (
                    <Link
                      key={
                        caseItem.id
                      }
                      href={`/clientes/${caseItem.clientId}/casos/${caseItem.id}`}
                      className="group block px-5 py-4 transition hover:bg-muted/40"
                    >
                      <div className="flex items-center gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate font-semibold">
                              {
                                caseItem.title
                              }
                            </h3>

                            <span
                              className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${getStatusClasses(
                                caseItem.status,
                              )}`}
                            >
                              {
                                CASE_STATUS_LABELS[
                                  caseItem.status
                                ]
                              }
                            </span>
                          </div>

                          <p className="mt-1 text-sm font-medium text-muted-foreground">
                            {
                              caseItem
                                .client
                                .name
                            }
                          </p>

                          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                            <span>
                              {
                                PRACTICE_AREA_LABELS[
                                  caseItem
                                    .practiceArea
                                ]
                              }
                            </span>

                            {identifier ? (
                              <span>
                                {caseItem.number
                                  ? "Processo"
                                  : "NB"}
                                :{" "}
                                {
                                  identifier
                                }
                              </span>
                            ) : null}

                            <span>
                              Atualizado em{" "}
                              {formatDate(
                                caseItem.updatedAt,
                              )}
                            </span>
                          </div>
                        </div>

                        <ChevronRight className="size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                      </div>
                    </Link>
                  );
                },
              )}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}