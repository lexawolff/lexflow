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

        workspace:
          true,
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

  return {
    user:
      membership.user,

    workspace:
      membership.workspace,

    membership,
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

  return access;
}
