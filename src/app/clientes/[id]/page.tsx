import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell/app-shell";
import { getClientDashboard } from "@/features/clients/services/get-client-dashboard";
import { ClientHeader } from "@/features/clients/components/client-header";
import { ClientStats } from "@/features/clients/components/client-stats";
import { ClientTabs } from "@/features/clients/components/client-tabs";
import { UpcomingClientEvents } from "@/features/clients/components/upcoming-client-events";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ClientePage({ params }: PageProps) {
  const { id } = await params;

  const client = await getClientDashboard(id);

  if (!client) {
    notFound();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <ClientHeader client={client} />

        <ClientStats client={client} />

        <UpcomingClientEvents tasks={client.tasks} />

        <ClientTabs client={client} />

      </div>
    </AppShell>
  );
}