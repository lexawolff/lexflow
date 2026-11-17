import {
  WorkItemStatus,
} from "@prisma/client";

import {
  AppShell,
} from "@/components/app-shell/app-shell";

import {
  WorkQueue,
} from "@/features/work/components/work-queue";

import {
  ReopenWorkItemButton,
} from "@/features/work/components/reopen-work-item-button";

import {
  prisma,
} from "@/lib/prisma";

import {
  hasPermission,
  requireWorkspacePagePermission,
} from "@/lib/permissions";

import {
  WorkItemCreateForm,
} from "@/features/work/components/work-item-create-form";

function formatDate(
  date: Date | null,
) {
  if (!date) {
    return null;
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
  ).format(date);
}

type ClientOption = {
  id: string;
  name: string;
};

type CaseOption = {
  id: string;
  clientId: string;
  title: string;
  number: string | null;
};

export default async function WorkPage() {
  const {
    workspace,
    membership,
  } =
    await requireWorkspacePagePermission(
      "WORK_VIEW",
    );

  const canCreate =
    hasPermission(
      membership.role,
      "WORK_CREATE",
    );

  const canEdit =
    hasPermission(
      membership.role,
      "WORK_EDIT",
    );

  const canDelete =
    hasPermission(
      membership.role,
      "WORK_DELETE",
    );

  const clientsPromise:
    Promise<ClientOption[]> =
    canCreate ||
    canEdit
      ? prisma.client.findMany({
          where: {
            workspaceId:
              workspace.id,
          },

          select: {
            id:
              true,

            name:
              true,
          },

          orderBy: {
            name:
              "asc",
          },
        })
      : Promise.resolve([]);

  const casesPromise:
    Promise<CaseOption[]> =
    canCreate ||
    canEdit
      ? prisma.case.findMany({
          where: {
            workspaceId:
              workspace.id,
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
          },

          orderBy: {
            createdAt:
              "desc",
          },
        })
      : Promise.resolve([]);

  const [
    workItems,
    clients,
    cases,
  ] =
    await Promise.all([
      prisma.workItem.findMany({
        relationLoadStrategy:
          "join",

        where: {
          workspaceId:
            workspace.id,

          assignedToMembershipId:
            membership.id,
        },

        include: {
          client: {
            select: {
              id:
                true,

              name:
                true,
            },
          },

          case: {
            select: {
              id:
                true,

              title:
                true,
            },
          },
        },

        orderBy: [
          {
            position:
              "asc",
          },

          {
            createdAt:
              "asc",
          },
        ],
      }),

      clientsPromise,
      casesPromise,
    ]);

  const activeItems =
    workItems.filter(
      (item) =>
        item.status !==
        WorkItemStatus.CONCLUIDA,
    );

  const completedItems =
    workItems
      .filter(
        (item) =>
          item.status ===
          WorkItemStatus.CONCLUIDA,
      )
      .sort(
        (a, b) =>
          (b.completedAt?.getTime() ??
            0) -
          (a.completedAt?.getTime() ??
            0),
      );

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">
            Trabalho
          </h1>

          <p className="mt-1 text-muted-foreground">
            Sua fila de prioridades do
            escritório.
          </p>
        </div>

        {canCreate ? (
  <WorkItemCreateForm
    clients={
      clients
    }
    cases={
      cases
    }
  />
) : null}

        {activeItems.length ===
        0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="font-medium">
              Sua fila está vazia.
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Adicione o primeiro
              trabalho para começar a
              organizar suas prioridades.
            </p>
          </div>
        ) : (
          <WorkQueue
            canEdit={
              canEdit
            }
            canDelete={
              canDelete
            }
            clients={
              clients
            }
            cases={
              cases
            }
            items={activeItems.map(
              (item) => ({
                id:
                  item.id,

                title:
                  item.title,

                description:
                  item.description,

                status:
                  item.status,

                period:
                  item.period,

                dueDate:
                  item.dueDate
                    ?.toISOString() ??
                  null,

                client:
                  item.client,

                case:
                  item.case,
              }),
            )}
          />
        )}

        {completedItems.length >
          0 && (
          <section className="space-y-3 border-t pt-8">
            <div>
              <h2 className="text-lg font-semibold">
                Concluídas
              </h2>

              <p className="text-sm text-muted-foreground">
                Histórico recente do
                trabalho concluído.
              </p>
            </div>

            <div className="space-y-2">
              {completedItems.map(
                (item) => (
                  <div
                    key={
                      item.id
                    }
                    className="flex flex-col gap-3 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium line-through opacity-70">
                        {item.client
                          ?.name ??
                          item.title}
                      </p>

                      {item.client && (
                        <p className="text-sm text-muted-foreground">
                          {
                            item.title
                          }
                        </p>
                      )}

                      {item.completedAt && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Concluída em{" "}
                          {formatDate(
                            item.completedAt,
                          )}
                        </p>
                      )}
                    </div>

                    {canEdit && (
                      <ReopenWorkItemButton
                        workItemId={
                          item.id
                        }
                      />
                    )}
                  </div>
                ),
              )}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}