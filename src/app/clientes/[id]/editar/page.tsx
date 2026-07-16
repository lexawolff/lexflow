import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell/app-shell";
import { ClientForm } from "@/features/clients/components/client-form";
import { getClientDashboard } from "@/features/clients/services/get-client-dashboard";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarClientePage({ params }: PageProps) {
  const { id } = await params;

  const client = await getClientDashboard(id);

  if (!client) {
    notFound();
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Editar Cliente</h1>

          <p className="mt-2 text-muted-foreground">
            Atualize as informações do cliente.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <ClientForm client={client} />
        </div>
      </div>
    </AppShell>
  );
}