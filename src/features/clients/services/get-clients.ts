import { prisma } from "@/lib/prisma";
import { getDefaultWorkspace } from "@/lib/workspace";

export async function getClients() {
  const workspace = await getDefaultWorkspace();

  return prisma.client.findMany({
    where: {
      workspaceId: workspace.id,
    },
    include: {
      _count: {
        select: {
          cases: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}