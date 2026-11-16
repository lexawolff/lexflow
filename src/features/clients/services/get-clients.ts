import "server-only";

import { prisma } from "@/lib/prisma";
import { requireWorkspacePermission } from "@/lib/permissions";

export async function getClients() {
  const { workspace } = await requireWorkspacePermission("CLIENT_VIEW");

  // Somente os campos usados por ClientsTable atravessam a fronteira do cliente.
  // Um tipo TypeScript mais estreito no componente não remove campos em runtime.
  return prisma.client.findMany({
    where: { workspaceId: workspace.id },
    select: {
      id: true,
      name: true,
      cpf: true,
      phone: true,
      whatsapp: true,
      city: true,
      state: true,
      _count: { select: { cases: true } },
    },
    orderBy: { name: "asc" },
  });
}
