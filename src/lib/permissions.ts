import {
  cache,
} from "react";

import {
  UserRole,
} from "@prisma/client";

import {
  redirect,
} from "next/navigation";

import {
  prisma,
} from "@/lib/prisma";

import {
  getCurrentAuthUserId,
} from "@/lib/auth";

import {
  ActionError,
} from "@/lib/actions/action-error";

import {
  isWorkspaceReadOnly,
  TRIAL_ENDED_MESSAGE,
} from "@/lib/trial";

export type Permission =
  | "CLIENT_VIEW"
  | "CLIENT_CREATE"
  | "CLIENT_EDIT"
  | "CLIENT_DELETE"

  | "CASE_VIEW"
  | "CASE_CREATE"
  | "CASE_EDIT"
  | "CASE_DELETE"

  | "WORK_VIEW"
  | "WORK_CREATE"
  | "WORK_EDIT"
  | "WORK_DELETE"

  | "AGENDA_VIEW"
  | "AGENDA_CREATE"
  | "AGENDA_EDIT"
  | "AGENDA_DELETE"

  | "DOCUMENT_VIEW"
  | "DOCUMENT_CREATE"
  | "DOCUMENT_DELETE"

  | "FINANCE_VIEW"
  | "FINANCE_WRITE"

  | "OFFICE_MANAGE"
  | "TEAM_MANAGE"
  | "BILLING_MANAGE"

  | "GOV_VIEW"
  | "GOV_MANAGE";

const ownerPermissions: Permission[] = [
  "CLIENT_VIEW",
  "CLIENT_CREATE",
  "CLIENT_EDIT",
  "CLIENT_DELETE",

  "CASE_VIEW",
  "CASE_CREATE",
  "CASE_EDIT",
  "CASE_DELETE",

  "WORK_VIEW",
  "WORK_CREATE",
  "WORK_EDIT",
  "WORK_DELETE",

  "AGENDA_VIEW",
  "AGENDA_CREATE",
  "AGENDA_EDIT",
  "AGENDA_DELETE",

  "DOCUMENT_VIEW",
  "DOCUMENT_CREATE",
  "DOCUMENT_DELETE",

  "FINANCE_VIEW",
  "FINANCE_WRITE",

  "OFFICE_MANAGE",
  "TEAM_MANAGE",
  "BILLING_MANAGE",

  "GOV_VIEW",
  "GOV_MANAGE",
];

const adminPermissions: Permission[] = [
  "CLIENT_VIEW",
  "CLIENT_CREATE",
  "CLIENT_EDIT",
  "CLIENT_DELETE",

  "CASE_VIEW",
  "CASE_CREATE",
  "CASE_EDIT",
  "CASE_DELETE",

  "WORK_VIEW",
  "WORK_CREATE",
  "WORK_EDIT",
  "WORK_DELETE",

  "AGENDA_VIEW",
  "AGENDA_CREATE",
  "AGENDA_EDIT",
  "AGENDA_DELETE",

  "DOCUMENT_VIEW",
  "DOCUMENT_CREATE",
  "DOCUMENT_DELETE",

  "FINANCE_VIEW",
  "FINANCE_WRITE",

  "OFFICE_MANAGE",
  "TEAM_MANAGE",

  "GOV_VIEW",
  "GOV_MANAGE",
];

const lawyerPermissions: Permission[] = [
  "CLIENT_VIEW",
  "CLIENT_CREATE",
  "CLIENT_EDIT",

  "CASE_VIEW",
  "CASE_CREATE",
  "CASE_EDIT",

  "WORK_VIEW",
  "WORK_CREATE",
  "WORK_EDIT",
  "WORK_DELETE",

  "AGENDA_VIEW",
  "AGENDA_CREATE",
  "AGENDA_EDIT",
  "AGENDA_DELETE",

  "DOCUMENT_VIEW",
  "DOCUMENT_CREATE",
  "DOCUMENT_DELETE",

  "GOV_VIEW",
  "GOV_MANAGE",
];

const internPermissions: Permission[] = [
  "CLIENT_VIEW",
  "CLIENT_CREATE",
  "CLIENT_EDIT",

  "CASE_VIEW",
  "CASE_CREATE",
  "CASE_EDIT",

  "WORK_VIEW",
  "WORK_CREATE",
  "WORK_EDIT",

  "AGENDA_VIEW",
  "AGENDA_CREATE",
  "AGENDA_EDIT",

  "DOCUMENT_VIEW",
  "DOCUMENT_CREATE",
];

const financialPermissions: Permission[] = [
  "CLIENT_VIEW",
  "CASE_VIEW",

  "FINANCE_VIEW",
  "FINANCE_WRITE",
];

const viewerPermissions: Permission[] = [
  "CLIENT_VIEW",
  "CASE_VIEW",
  "WORK_VIEW",
  "AGENDA_VIEW",
  "DOCUMENT_VIEW",
];

const rolePermissions: Record<
  UserRole,
  readonly Permission[]
> = {
  OWNER:
    ownerPermissions,

  ADMIN:
    adminPermissions,

  LAWYER:
    lawyerPermissions,

  INTERN:
    internPermissions,

  FINANCIAL:
    financialPermissions,

  VIEWER:
    viewerPermissions,
};

export function hasPermission(
  role: UserRole,
  permission: Permission,
) {
  return rolePermissions[
    role
  ].includes(
    permission,
  );
}

/*
 * Com o teste grátis encerrado, o escritório fica só para consulta. Continuam
 * liberados ver os dados, cuidar da cobrança e gerenciar a equipe, para que o
 * proprietário possa retirar o acesso de quem saiu.
 */
export function isAllowedWhileReadOnly(
  permission: Permission,
) {
  return (
    permission.endsWith("_VIEW") ||
    permission === "BILLING_MANAGE" ||
    permission === "TEAM_MANAGE"
  );
}

export function canUsePermission(
  member: {
    role: UserRole;
    workspaceReadOnly: boolean;
  },
  permission: Permission,
) {
  return (
    hasPermission(
      member.role,
      permission,
    ) &&
    (
      !member.workspaceReadOnly ||
      isAllowedWhileReadOnly(
        permission,
      )
    )
  );
}

async function getCurrentWorkspaceAccessUncached() {
  const userId =
    await getCurrentAuthUserId();

  if (!userId) {
    redirect(
      "/login",
    );
  }

  const membership =
    await prisma.membership.findFirst({
      relationLoadStrategy:
        "join",

      where: {
        userId,
      },

      include: {
        user:
          true,

        workspace: {
          include: {
            subscription: {
              select: {
                status:
                  true,

                trialEndsAt:
                  true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt:
          "asc",
      },
    });

  if (!membership) {
    throw new ActionError(
      "Você não pertence a nenhum escritório.",
    );
  }

  const {
    subscription,
    ...workspace
  } =
    membership.workspace;

  const readOnly =
    isWorkspaceReadOnly(
      subscription,
    );

  return {
    user:
      membership.user,

    workspace,

    membership: {
      ...membership,

      workspace,

      workspaceReadOnly:
        readOnly,
    },

    readOnly,
  };
}

export const getCurrentWorkspaceAccess =
  cache(
    getCurrentWorkspaceAccessUncached,
  );

/*
 * Usado em Server Actions.
 *
 * Se não houver permissão,
 * interrompe a operação.
 */
export async function requireWorkspacePermission(
  permission: Permission,
) {
  const access =
    await getCurrentWorkspaceAccess();

  if (
    !hasPermission(
      access.membership.role,
      permission,
    )
  ) {
    throw new ActionError(
      "Você não possui permissão para realizar esta operação.",
    );
  }

  if (
    !canUsePermission(
      access.membership,
      permission,
    )
  ) {
    throw new ActionError(
      TRIAL_ENDED_MESSAGE,
    );
  }

  return access;
}

/*
 * Usado em páginas e layouts.
 *
 * Em vez de gerar erro de servidor,
 * envia o usuário para uma tela
 * apropriada de acesso negado.
 */
export async function requireWorkspacePagePermission(
  permission: Permission,
) {
  const access =
    await getCurrentWorkspaceAccess();

  if (
    !hasPermission(
      access.membership.role,
      permission,
    )
  ) {
    redirect(
      "/sem-acesso",
    );
  }

  // A página do escritório continua visível, com os campos bloqueados.
  if (
    permission !== "OFFICE_MANAGE" &&
    !canUsePermission(
      access.membership,
      permission,
    )
  ) {
    redirect(
      "/assinar",
    );
  }

  return access;
}
