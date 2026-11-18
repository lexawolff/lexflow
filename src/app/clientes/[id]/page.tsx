import {
  notFound,
} from "next/navigation";

import {
  AppShell,
} from "@/components/app-shell/app-shell";

import {
  ClientHeader,
} from "@/features/clients/components/client-header";

import {
  ClientStats,
} from "@/features/clients/components/client-stats";

import {
  ClientTabs,
} from "@/features/clients/components/client-tabs";

import {
  UpcomingClientEvents,
} from "@/features/clients/components/upcoming-client-events";

import {
  getClientDashboard,
} from "@/features/clients/services/get-client-dashboard";

import {
  canUsePermission,
  hasPermission,
  requireWorkspacePagePermission,
} from "@/lib/permissions";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ClientePage({
  params,
}: PageProps) {
  const {
    membership,
  } =
    await requireWorkspacePagePermission(
      "CLIENT_VIEW",
    );

  const canCreateCase =
    canUsePermission(
      membership,
      "CASE_CREATE",
    );

  const canCreateWork =
    canUsePermission(
      membership,
      "WORK_CREATE",
    );

  const canEditClient =
    canUsePermission(
      membership,
      "CLIENT_EDIT",
    );

  const canDeleteClient =
    canUsePermission(
      membership,
      "CLIENT_DELETE",
    );

  const canViewAgenda =
    hasPermission(
      membership.role,
      "AGENDA_VIEW",
    );

  const canCreateAgenda =
    canUsePermission(
      membership,
      "AGENDA_CREATE",
    );

  const canViewDocuments =
    hasPermission(
      membership.role,
      "DOCUMENT_VIEW",
    );

  const canCreateDocuments =
    canUsePermission(
      membership,
      "DOCUMENT_CREATE",
    );

  const canDeleteDocuments =
    canUsePermission(
      membership,
      "DOCUMENT_DELETE",
    );

  const canViewFinance =
    hasPermission(
      membership.role,
      "FINANCE_VIEW",
    );

  const canWriteFinance =
    canUsePermission(
      membership,
      "FINANCE_WRITE",
    );

  const canViewGov =
    hasPermission(
      membership.role,
      "GOV_VIEW",
    );

  const {
    id,
  } =
    await params;

  const client =
    await getClientDashboard(
      id,
      {
        canViewAgenda,
        canViewDocuments,
        canViewFinance,
        canViewGov,
      },
    );

  if (!client) {
    notFound();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <ClientHeader
          client={
            client
          }
          canCreateCase={
            canCreateCase
          }
          canCreateWork={
            canCreateWork
          }
          canEditClient={
            canEditClient
          }
          canDeleteClient={
            canDeleteClient
          }
        />

        <ClientStats
          client={
            client
          }
          canViewAgenda={
            canViewAgenda
          }
          canViewDocuments={
            canViewDocuments
          }
          canViewFinance={
            canViewFinance
          }
        />

        {canViewAgenda ? (
          <UpcomingClientEvents
            clientId={
              client.id
            }
            clientName={
              client.name
            }
            cases={
              client.cases
            }
            tasks={
              client.tasks
            }
          />
        ) : null}

        <ClientTabs
          client={
            client
          }
          canCreateCase={
            canCreateCase
          }
          canViewDocuments={
            canViewDocuments
          }
          canCreateDocuments={
            canCreateDocuments
          }
          canDeleteDocuments={
            canDeleteDocuments
          }
          canViewFinance={
            canViewFinance
          }
          canWriteFinance={
            canWriteFinance
          }
          canViewGov={
            canViewGov
          }
          canCreateAgenda={
            canCreateAgenda
          }
          canEditClient={
            canEditClient
          }
        />
      </div>
    </AppShell>
  );
}