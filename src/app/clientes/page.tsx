import Link from "next/link";

import {
  AppShell,
} from "@/components/app-shell/app-shell";

import {
  ClientsTable,
} from "@/features/clients/components/clients-table";

import {
  getClients,
} from "@/features/clients/services/get-clients";

import {
  hasPermission,
  requireWorkspacePagePermission,
} from "@/lib/permissions";

export default async function ClientesPage() {
  const {
    membership,
  } =
    await requireWorkspacePagePermission(
      "CLIENT_VIEW",
    );

  const canCreateClient =
    hasPermission(
      membership.role,
      "CLIENT_CREATE",
    );

  const clients =
    await getClients();

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Clientes
            </h1>

            <p className="text-muted-foreground">
              Gerencie todos os clientes do escritório.
            </p>
          </div>

          {canCreateClient ? (
            <Link
              href="/clientes/novo"
              className="rounded-lg bg-primary px-4 py-2 text-primary-foreground transition hover:bg-primary/90"
            >
              Novo Cliente
            </Link>
          ) : null}
        </div>

        <div className="rounded-xl border bg-card">
          <ClientsTable
            clients={
              clients
            }
          />
        </div>
      </div>
    </AppShell>
  );
}