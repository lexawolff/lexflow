"use server";

import { requireWorkspacePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { recordGovAudit } from "@/lib/security/audit";
import { Vault } from "@/lib/security/vault";

export async function revealGovPassword(
  clientId: string,
  purpose: "reveal" | "copy" = "reveal",
): Promise<{ password: string; accessId: string } | null> {
  const { workspace, membership } = await requireWorkspacePermission("GOV_VIEW");

  // Os argumentos de uma Server Action também podem vir de um request forjado.
  if (typeof clientId !== "string" || !clientId || clientId.length > 128 ||
      (purpose !== "reveal" && purpose !== "copy")) {
    throw new Error("Solicitação inválida.");
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, workspaceId: workspace.id },
    select: { govPasswordEncrypted: true },
  });
  if (!client) throw new Error("Cliente não encontrado neste escritório.");
  if (!client.govPasswordEncrypted) return null;

  const password = Vault.decrypt(client.govPasswordEncrypted);
  if (!password) return null;

  // Fail-closed: se a gravação falhar, nenhuma senha é retornada ao navegador.
  // Registra a liberação pelo servidor, não prova de visualização humana.
  const access = await recordGovAudit(prisma, {
    workspaceId: workspace.id,
    actorUserId: membership.userId,
    clientId,
    action: purpose === "copy"
      ? "GOV_PASSWORD_RELEASED_FOR_COPY"
      : "GOV_PASSWORD_RELEASED_FOR_REVEAL",
  });
  return { password, accessId: access.id };
}
