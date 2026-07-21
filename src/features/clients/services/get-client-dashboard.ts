import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/prisma/serialize";
import { getDefaultWorkspace } from "@/lib/workspace";

import { clientDashboardInclude } from "../types";

export async function getClientDashboard(id: string) {
  const workspace = await getDefaultWorkspace();

  const client = await prisma.client.findFirst({
    where: {
      id,
      workspaceId: workspace.id,
    },
    include: clientDashboardInclude.include,
  });

  if (!client) {
    return null;
  }

  return serializePrisma(client);
}