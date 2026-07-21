import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell/app-shell";
import { prisma } from "@/lib/prisma";
import { getDefaultWorkspace } from "@/lib/workspace";

import { CaseForm } from "@/features/cases/components/case-form";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function NovoCasoPage({
  params,
}: PageProps) {
  const { id } = await params;

  const workspace = await getDefaultWorkspace();

  const client = await prisma.client.findFirst({
    where: {
      id,
      workspaceId: workspace.id,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!client) {
    notFound();
  }

  return (
    <AppShell>
      <div className="space-y-6">

        <div>
          <h1 className="text-3xl font-bold">
            Nova Demanda
          </h1>

          <p className="text-muted-foreground">
            Cliente: <strong>{client.name}</strong>
          </p>
        </div>

        <CaseForm clientId={client.id} />

      </div>
    </AppShell>
  );
}