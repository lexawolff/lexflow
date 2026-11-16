"use server";

import { requireWorkspacePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function reportGovPasswordCopy(accessId: string): Promise<void> {
  const { workspace, membership } = await requireWorkspacePermission("GOV_VIEW");
  if (typeof accessId !== "string" || !accessId || accessId.length > 128) {
    throw new Error("Solicitação inválida.");
  }

  // O cliente não escolhe usuário, escritório nem cliente do evento.
  const access = await prisma.auditLog.findFirst({
    where: {
      id: accessId,
      workspaceId: workspace.id,
      actorUserId: membership.userId,
      action: "GOV_PASSWORD_RELEASED_FOR_COPY",
      createdAt: { gte: new Date(Date.now() - 5 * 60_000) },
    },
    select: { id: true, clientId: true },
  });
  if (!access) throw new Error("Solicitação de cópia não encontrada ou expirada.");

  // Um único relato por liberação. Não altera nem apaga o evento anterior.
  // É uma declaração do navegador, não atestado independente de cópia.
  await prisma.auditLog.upsert({
    where: { parentEventId: access.id },
    create: {
      workspaceId: workspace.id,
      actorUserId: membership.userId,
      clientId: access.clientId,
      action: "GOV_PASSWORD_COPY_REPORTED",
      parentEventId: access.id,
    },
    update: {},
    select: { id: true },
  });
}
