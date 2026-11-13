"use server";

import {
  UserRole,
} from "@prisma/client";

import {
  revalidatePath,
} from "next/cache";

import {
  requireCurrentUser,
} from "@/lib/auth";

import {
  requireWorkspacePermission,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

type TeamActionResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

const validRoles =
  new Set<UserRole>([
    UserRole.OWNER,
    UserRole.ADMIN,
    UserRole.LAWYER,
    UserRole.INTERN,
    UserRole.FINANCIAL,
    UserRole.VIEWER,
  ]);

async function getTeamContext() {
  const user =
    await requireCurrentUser();

  const {
    workspace,
    membership,
  } =
    await requireWorkspacePermission(
      "TEAM_MANAGE",
    );

  return {
    user,
    workspace,
    membership,
  };
}

export async function updateMemberRoleAction(
  formData: FormData,
): Promise<TeamActionResult> {
  const {
    user,
    workspace,
    membership:
      requesterMembership,
  } =
    await getTeamContext();

  const membershipIdValue =
    formData.get(
      "membershipId",
    );

  const roleValue =
    formData.get(
      "role",
    );

  const membershipId =
    typeof membershipIdValue ===
    "string"
      ? membershipIdValue
      : "";

  const role =
    typeof roleValue ===
      "string" &&
    validRoles.has(
      roleValue as UserRole,
    )
      ? (
          roleValue as UserRole
        )
      : null;

  if (
    !membershipId ||
    !role
  ) {
    return {
      success: false,

      error:
        "Dados inválidos para alteração da função.",
    };
  }

  const target =
    await prisma.membership.findFirst({
      where: {
        id:
          membershipId,

        workspaceId:
          workspace.id,
      },

      select: {
        id: true,

        userId:
          true,

        role: true,
      },
    });

  if (!target) {
    return {
      success: false,

      error:
        "Membro não encontrado.",
    };
  }

  /*
   * A própria função não pode ser
   * alterada por esta tela.
   */
  if (
    target.userId ===
    user.id
  ) {
    return {
      success: false,

      error:
        "Você não pode alterar sua própria função por esta tela.",
    };
  }

  /*
   * Administradores não podem
   * modificar proprietários.
   */
  if (
    requesterMembership.role ===
      UserRole.ADMIN &&
    target.role ===
      UserRole.OWNER
  ) {
    return {
      success: false,

      error:
        "Administradores não podem alterar a função de um proprietário.",
    };
  }

  /*
   * Apenas OWNER pode promover
   * outra pessoa a OWNER.
   */
  if (
    role ===
      UserRole.OWNER &&
    requesterMembership.role !==
      UserRole.OWNER
  ) {
    return {
      success: false,

      error:
        "Apenas um proprietário pode promover outro membro a proprietário.",
    };
  }

  /*
   * Se estamos rebaixando um OWNER,
   * deve continuar existindo pelo
   * menos um proprietário.
   */
  if (
    target.role ===
      UserRole.OWNER &&
    role !==
      UserRole.OWNER
  ) {
    const ownerCount =
      await prisma.membership.count({
        where: {
          workspaceId:
            workspace.id,

          role:
            UserRole.OWNER,
        },
      });

    if (
      ownerCount <= 1
    ) {
      return {
        success: false,

        error:
          "O escritório precisa possuir pelo menos um proprietário.",
      };
    }
  }

  try {
    await prisma.membership.update({
      where: {
        id:
          target.id,
      },

      data: {
        role,
      },
    });

    revalidatePath(
      "/configuracoes",
    );

    revalidatePath(
      "/configuracoes/equipe",
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "Erro ao alterar função do membro:",
      error,
    );

    return {
      success: false,

      error:
        "Não foi possível alterar a função do membro.",
    };
  }
}

export async function removeMemberAction(
  formData: FormData,
): Promise<TeamActionResult> {
  const {
    user,
    workspace,
    membership:
      requesterMembership,
  } =
    await getTeamContext();

  const membershipIdValue =
    formData.get(
      "membershipId",
    );

  const membershipId =
    typeof membershipIdValue ===
    "string"
      ? membershipIdValue
      : "";

  if (!membershipId) {
    return {
      success: false,

      error:
        "Membro inválido.",
    };
  }

  const target =
    await prisma.membership.findFirst({
      where: {
        id:
          membershipId,

        workspaceId:
          workspace.id,
      },

      select: {
        id: true,

        userId:
          true,

        role: true,
      },
    });

  if (!target) {
    return {
      success: false,

      error:
        "Membro não encontrado.",
    };
  }

  /*
   * A própria conta não pode ser
   * removida por esta tela.
   */
  if (
    target.userId ===
    user.id
  ) {
    return {
      success: false,

      error:
        "Você não pode remover sua própria conta do escritório por esta tela.",
    };
  }

  /*
   * Administradores não podem
   * remover proprietários.
   */
  if (
    requesterMembership.role ===
      UserRole.ADMIN &&
    target.role ===
      UserRole.OWNER
  ) {
    return {
      success: false,

      error:
        "Administradores não podem remover proprietários.",
    };
  }

  /*
   * Nunca podemos deixar o workspace
   * sem pelo menos um OWNER.
   */
  if (
    target.role ===
    UserRole.OWNER
  ) {
    const ownerCount =
      await prisma.membership.count({
        where: {
          workspaceId:
            workspace.id,

          role:
            UserRole.OWNER,
        },
      });

    if (
      ownerCount <= 1
    ) {
      return {
        success: false,

        error:
          "O último proprietário do escritório não pode ser removido.",
      };
    }
  }

  try {
    /*
     * Remove somente o vínculo com
     * este escritório.
     *
     * O User não é apagado.
     */
    await prisma.membership.delete({
      where: {
        id:
          target.id,
      },
    });

    revalidatePath(
      "/configuracoes",
    );

    revalidatePath(
      "/configuracoes/equipe",
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "Erro ao remover membro:",
      error,
    );

    return {
      success: false,

      error:
        "Não foi possível remover o membro.",
    };
  }
}