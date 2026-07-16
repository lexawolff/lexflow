"use server";

import { prisma } from "@/lib/prisma";
import { Vault } from "@/lib/security/vault";
import { getDefaultWorkspace } from "@/lib/workspace";

export async function revealGovPassword(clientId: string) {
  const workspace = await getDefaultWorkspace();

  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      workspaceId: workspace.id,
    },
    select: {
      govPasswordEncrypted: true,
    },
  });

  if (!client?.govPasswordEncrypted) {
    return null;
  }

  return Vault.decrypt(client.govPasswordEncrypted);
}