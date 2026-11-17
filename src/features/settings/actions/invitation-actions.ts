"use server";

import {
  UserRole,
} from "@prisma/client";

import {
  revalidatePath,
} from "next/cache";

import {
  z,
} from "zod";

import {
  ActionError,
} from "@/lib/actions/action-error";

import {
  runAction,
} from "@/lib/actions/run-action";

import {
  requireWorkspacePermission,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

import {
  canInviteRole,
  generateInvitationToken,
  getInvitationStatus,
  invitationExpiresAt,
} from "../lib/invitations";

export type InvitationLink = {
  invitePath: string;
  email: string;
  expiresAt: string;
};

const createInvitationSchema =
  z.object({
    email: z
      .string({ message: "Informe o e-mail da pessoa convidada." })
      .trim()
      .max(254, "E-mail muito longo.")
      .email("Informe um e-mail válido.")
      .transform((value) => value.toLowerCase()),

    role: z.nativeEnum(UserRole, {
      message: "Escolha a função do novo membro.",
    }),
  });

const invitationIdSchema =
  z.string().uuid("Convite inválido.");

function revalidateTeam() {
  revalidatePath("/configuracoes");
  revalidatePath("/configuracoes/equipe");
}

function toLink(
  token: string,
  email: string,
  expiresAt: Date,
): InvitationLink {
  /*
   * Só o caminho: o navegador completa com o próprio endereço
   * (window.location.origin), sem depender de cabeçalhos.
   */
  return {
    invitePath: `/convite/${token}`,
    email,
    expiresAt: expiresAt.toISOString(),
  };
}

async function createInvitationImpl(
  formData: FormData,
): Promise<InvitationLink> {
  const {
    workspace,
    membership,
  } =
    await requireWorkspacePermission(
      "TEAM_MANAGE",
    );

  const parsed =
    createInvitationSchema.safeParse({
      email: formData.get("email"),
      role: formData.get("role"),
    });

  if (!parsed.success) {
    throw new ActionError(
      parsed.error.issues[0]?.message ??
        "Dados inválidos.",
    );
  }

  const {
    email,
    role,
  } = parsed.data;

  if (
    !canInviteRole(
      membership.role,
      role,
    )
  ) {
    throw new ActionError(
      "Apenas um proprietário pode convidar outro proprietário.",
    );
  }

  /*
   * Cada pessoa pertence a um único escritório no LexFlow
   * (o acesso usa o primeiro vínculo). Um e-mail que já tem
   * conta não pode receber convite.
   */
  const existingUser =
    await prisma.user.findUnique({
      where: { email },
      select: {
        memberships: {
          where: { workspaceId: workspace.id },
          select: { id: true },
        },
      },
    });

  if (existingUser) {
    throw new ActionError(
      existingUser.memberships.length > 0
        ? "Esta pessoa já faz parte do escritório."
        : "Este e-mail já possui conta no LexFlow. Use outro e-mail.",
    );
  }

  const now = new Date();
  const expiresAt = invitationExpiresAt(now);
  const { token, tokenHash } = generateInvitationToken();

  await prisma.$transaction(async (tx) => {
    // Um convite válido por e-mail: o link anterior deixa de funcionar.
    await tx.workspaceInvitation.updateMany({
      where: {
        workspaceId: workspace.id,
        email,
        acceptedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: now },
    });

    await tx.workspaceInvitation.create({
      data: {
        workspaceId: workspace.id,
        email,
        role,
        tokenHash,
        invitedByUserId: membership.userId,
        expiresAt,
      },
    });
  });

  revalidateTeam();

  return toLink(token, email, expiresAt);
}

async function findManageableInvitation(
  formData: FormData,
) {
  const {
    workspace,
    membership,
  } =
    await requireWorkspacePermission(
      "TEAM_MANAGE",
    );

  const parsedId =
    invitationIdSchema.safeParse(
      formData.get("invitationId"),
    );

  if (!parsedId.success) {
    throw new ActionError("Convite inválido.");
  }

  const invitation =
    await prisma.workspaceInvitation.findFirst({
      where: {
        id: parsedId.data,
        workspaceId: workspace.id,
      },
    });

  if (!invitation) {
    throw new ActionError("Convite não encontrado.");
  }

  const status = getInvitationStatus(invitation, new Date());

  if (status === "ACEITO" || status === "CANCELADO") {
    throw new ActionError(
      status === "ACEITO"
        ? "Este convite já foi aceito."
        : "Este convite já foi cancelado.",
    );
  }

  if (
    !canInviteRole(
      membership.role,
      invitation.role,
    )
  ) {
    throw new ActionError(
      "Apenas um proprietário pode gerenciar convites de proprietário.",
    );
  }

  return { workspace, invitation };
}

/*
 * Gera um novo link (o anterior deixa de valer) e renova o prazo.
 * Serve para link perdido ou convite expirado.
 */
async function regenerateInvitationLinkImpl(
  formData: FormData,
): Promise<InvitationLink> {
  const { workspace, invitation } =
    await findManageableInvitation(formData);

  const expiresAt = invitationExpiresAt(new Date());
  const { token, tokenHash } = generateInvitationToken();

  const updated =
    await prisma.workspaceInvitation.updateMany({
      where: {
        id: invitation.id,
        workspaceId: workspace.id,
        acceptedAt: null,
        revokedAt: null,
      },
      data: { tokenHash, expiresAt },
    });

  if (updated.count === 0) {
    throw new ActionError("Este convite não está mais disponível.");
  }

  revalidateTeam();

  return toLink(token, invitation.email, expiresAt);
}

async function revokeInvitationImpl(
  formData: FormData,
): Promise<{ success: true }> {
  const { workspace, invitation } =
    await findManageableInvitation(formData);

  await prisma.workspaceInvitation.updateMany({
    where: {
      id: invitation.id,
      workspaceId: workspace.id,
      acceptedAt: null,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });

  revalidateTeam();

  return { success: true };
}

export async function createInvitationAction(
  ...args: Parameters<typeof createInvitationImpl>
) {
  return runAction(
    () =>
      createInvitationImpl(
        ...args,
      ),
  );
}

export async function regenerateInvitationLinkAction(
  ...args: Parameters<typeof regenerateInvitationLinkImpl>
) {
  return runAction(
    () =>
      regenerateInvitationLinkImpl(
        ...args,
      ),
  );
}

export async function revokeInvitationAction(
  ...args: Parameters<typeof revokeInvitationImpl>
) {
  return runAction(
    () =>
      revokeInvitationImpl(
        ...args,
      ),
  );
}
