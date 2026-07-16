import Link from "next/link";

import { AppShell } from "@/components/app-shell/app-shell";
import { getClients } from "@/features/clients/services/get-clients";
import { ClientsTable } from "@/features/clients/components/clients-table";

export default async function ClientesPage() {
  const clients = await getClients();

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Clientes</h1>
            <p className="text-muted-foreground">
              Gerencie todos os clientes do escritório.
            </p>
          </div>

          <Link
            href="/clientes/novo"
            className="rounded-lg bg-primary px-4 py-2 text-white"
          >
            Novo Cliente
          </Link>
        </div>

        <div className="rounded-xl border bg-card">
          <ClientsTable clients={clients} />
        </div>
      </div>
    </AppShell>
  );
}