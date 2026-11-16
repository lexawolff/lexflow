"use server";

import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { hasPermission, requireWorkspacePermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type TeamActionResult =
  | { success: true }
  | { success: false; error: string };

type LockedMembership = { id: string; userId: string; role: UserRole };
const validRoles = new Set<UserRole>(Object.values(UserRole));

async function changeMember(
  operation: "role" | "remove",
  formData: FormData,
): Promise<TeamActionResult> {
  const { workspace, membership } = await requireWorkspacePermission("TEAM_MANAGE");
  const membershipIdValue = formData.get("membershipId");
  const roleValue = formData.get("role");
  const membershipId = typeof membershipIdValue === "string" ? membershipIdValue : "";
  const role = typeof roleValue === "string" && validRoles.has(roleValue as UserRole)
    ? roleValue as UserRole : null;

  if (!membershipId || membershipId.length > 128 || (operation === "role" && !role)) {
    return { success: false, error: "Dados inválidos para a operação." };
  }

  try {
    const result = await prisma.$transaction(async (tx): Promise<TeamActionResult> => {
      // Serializa mudanças de equipe deste escritório, inclusive a contagem de OWNER.
      const offices = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "Workspace" WHERE "id" = ${workspace.id} FOR UPDATE
      `;
      if (!offices.length) return { success: false, error: "Escritório não encontrado." };

      // A função pode ter mudado enquanto esta requisição aguardava o bloqueio.
      const requester = await tx.membership.findFirst({
        where: { userId: membership.userId, workspaceId: workspace.id },
        select: { id: true, role: true },
      });
      if (!requester || !hasPermission(requester.role, "TEAM_MANAGE")) {
        return { success: false, error: "Você não possui permissão para gerenciar a equipe." };
      }

      // FOR UPDATE também impede nova FK de WorkItem enquanto contamos e removemos.
      const targets = await tx.$queryRaw<LockedMembership[]>`
        SELECT "id", "userId", "role" FROM "Membership"
        WHERE "id" = ${membershipId} AND "workspaceId" = ${workspace.id}
        FOR UPDATE
      `;
      const target = targets[0];
      if (!target) return { success: false, error: "Membro não encontrado." };
      if (target.userId === membership.userId) {
        return { success: false, error: "Você não pode alterar sua função ou remover seu próprio vínculo por esta tela." };
      }
      if (target.role === UserRole.OWNER && requester.role !== UserRole.OWNER) {
        return { success: false, error: "Apenas proprietários podem alterar ou remover outro proprietário." };
      }
      if (operation === "role" && role === UserRole.OWNER && requester.role !== UserRole.OWNER) {
        return { success: false, error: "Apenas um proprietário pode promover outro membro a proprietário." };
      }
      if (target.role === UserRole.OWNER && (operation === "remove" || role !== UserRole.OWNER)) {
        const owners = await tx.membership.count({
          where: { workspaceId: workspace.id, role: UserRole.OWNER },
        });
        if (owners <= 1) {
          return { success: false, error: "O escritório precisa manter pelo menos um proprietário." };
        }
      }

      if (operation === "role") {
        if (!role) return { success: false, error: "Função inválida." };
        await tx.membership.update({
          where: { id: target.id, workspaceId: workspace.id },
          data: { role },
        });
      } else {
        const workCount = await tx.workItem.count({
          where: { assignedToMembershipId: target.id },
        });
        if (workCount > 0) {
          return {
            success: false,
            error: "Este membro possui trabalhos vinculados, inclusive possíveis trabalhos concluídos. A remoção foi bloqueada para preservar o histórico. Regularize a responsabilidade pelos trabalhos antes de remover o vínculo.",
          };
        }

        // Mantém os vínculos dos eventos, mas encerra a integração local do membro.
        // Não afirma revogação do consentimento na conta Google.
        await tx.googleCalendarConnection.updateMany({
          where: { workspaceId: workspace.id, userId: target.userId },
          data: {
            syncFromGoogle: false,
            syncToGoogle: false,
            refreshTokenEncrypted: "",
            syncToken: null,
            watchChannelId: null,
            watchResourceId: null,
            watchExpiresAt: null,
          },
        });
        await tx.membership.delete({
          where: { id: target.id, workspaceId: workspace.id },
        });
      }
      return { success: true };
    });

    if (result.success) {
      revalidatePath("/configuracoes");
      revalidatePath("/configuracoes/equipe");
      revalidatePath("/configuracoes/integracoes");
    }
    return result;
  } catch {
    // Não registrar o objeto de erro do Prisma: pode incluir dados da consulta.
    console.error("Falha ao alterar vínculo ou função da equipe.");
    return { success: false, error: "Não foi possível concluir a operação na equipe. Tente novamente." };
  }
}

export async function updateMemberRoleAction(formData: FormData): Promise<TeamActionResult> {
  return changeMember("role", formData);
}

export async function removeMemberAction(formData: FormData): Promise<TeamActionResult> {
  return changeMember("remove", formData);
}
