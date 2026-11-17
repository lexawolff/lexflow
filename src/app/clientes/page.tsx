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

type Props = {
  searchParams: Promise<{
    q?: string;
    pagina?: string;
    ordem?: string;
  }>;
};

export default async function ClientesPage({
  searchParams,
}: Props) {
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

  const params =
    await searchParams;

  /*
   * Busca, página e ordenação ficam na URL:
   * o banco devolve só a página pedida.
   */
  const result =
    await getClients({
      q:
        params.q ?? "",

      page:
        Number(
          params.pagina ?? "1",
        ),

      sort:
        params.ordem,
    });

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
              result.clients
            }
            total={
              result.total
            }
            page={
              result.page
            }
            pageCount={
              result.pageCount
            }
            query={
              result.q
            }
            sort={
              result.sort
            }
          />
        </div>
      </div>
    </AppShell>
  );
}