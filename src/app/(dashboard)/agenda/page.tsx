import {
  AppShell,
} from "@/components/app-shell/app-shell";

import {
  AgendaMonth,
} from "@/features/agenda/components/agenda-month";

import {
  getAgendaData,
} from "@/features/agenda/services/get-agenda-data";

import {
  hasPermission,
  requireWorkspacePagePermission,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

type Props = {
  searchParams: Promise<{
    month?: string;
  }>;
};

export default async function AgendaPage({
  searchParams,
}: Props) {
  const {
    membership,
  } =
    await requireWorkspacePagePermission(
      "AGENDA_VIEW",
    );

  const canCreateAgenda =
    hasPermission(
      membership.role,
      "AGENDA_CREATE",
    );

  const canEditAgenda =
    hasPermission(
      membership.role,
      "AGENDA_EDIT",
    );

  const canDeleteAgenda =
    hasPermission(
      membership.role,
      "AGENDA_DELETE",
    );

  /*
   * O helper de permissões retorna
   * somente id e role do membership.
   *
   * As preferências pessoais da Agenda
   * são buscadas separadamente.
   */
  const agendaPreferences =
    await prisma.membership.findUniqueOrThrow({
      where: {
        id:
          membership.id,
      },

      select: {
        agendaShowCompleted:
          true,

        agendaDefaultStatus:
          true,

        agendaItemsPerDay:
          true,

        agendaShowAttention:
          true,
      },
    });

  const params =
    await searchParams;

  const data =
    await getAgendaData(
      params.month,
    );

  return (
    <AppShell>
      <AgendaMonth
        data={
          data
        }
        showCompleted={
          agendaPreferences.agendaShowCompleted
        }
        defaultStatusFilter={
          agendaPreferences.agendaDefaultStatus
        }
        itemsPerDay={
          agendaPreferences.agendaItemsPerDay
        }
        showAttention={
          agendaPreferences.agendaShowAttention
        }
        canCreateAgenda={
          canCreateAgenda
        }
        canEditAgenda={
          canEditAgenda
        }
        canDeleteAgenda={
          canDeleteAgenda
        }
      />
    </AppShell>
  );
}