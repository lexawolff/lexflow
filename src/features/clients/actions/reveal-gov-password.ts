"use server";

import {
  requireWorkspacePermission,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

import {
  Vault,
} from "@/lib/security/vault";

export async function revealGovPassword(
  clientId:
    string,
) {
  const {
    workspace,
  } =
    await requireWorkspacePermission(
      "GOV_VIEW",
    );

  const client =
    await prisma.client.findFirst({
      where: {
        id:
          clientId,

        workspaceId:
          workspace.id,
      },

      select: {
        govPasswordEncrypted:
          true,
      },
    });

  if (!client) {
    throw new Error(
      "Cliente não encontrado neste escritório.",
    );
  }

  if (
    !client.govPasswordEncrypted
  ) {
    return null;
  }

  return Vault.decrypt(
    client.govPasswordEncrypted,
  );
}