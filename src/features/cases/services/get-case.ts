import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/prisma/serialize";
import { getDefaultWorkspace } from "@/lib/workspace";

export async function getCase(clientId: string, caseId: string) {
  const workspace = await getDefaultWorkspace();

  const demand = await prisma.case.findFirst({
    where: {
      id: caseId,
      clientId,
      workspaceId: workspace.id,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!demand) {
    return null;
  }

  return serializePrisma(demand);
}