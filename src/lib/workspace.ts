import "server-only";

import {
  prisma,
} from "@/lib/prisma";

import {
  requireCurrentUser,
} from "@/lib/auth";

export async function getDefaultWorkspace() {
  const user =
    await requireCurrentUser();

  const membership =
    await prisma.membership.findFirst({
      where: {
        userId:
          user.id,
      },

      include: {
        workspace:
          true,
      },

      orderBy: {
        createdAt:
          "asc",
      },
    });

  if (!membership) {
    throw new Error(
      "O usuário não possui vínculo com nenhum escritório.",
    );
  }

  return membership.workspace;
}