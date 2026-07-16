import { prisma } from "@/lib/prisma";
import { getDefaultWorkspace } from "@/lib/workspace";
import { clientDashboardInclude } from "../types";

export async function getClientDashboard(id: string) {
  const workspace = await getDefaultWorkspace();

  return prisma.client.findFirst({
    where: {
      id,
      workspaceId: workspace.id,
    },
    include: clientDashboardInclude.include,
  });
}