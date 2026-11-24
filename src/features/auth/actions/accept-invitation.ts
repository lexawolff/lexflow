"use server";

import {
  isTeamFullForNewMember,
  TEAM_FULL_ON_ACCEPT_MESSAGE,
} from "@/features/settings/lib/team-capacity";

import {
  redirect,
} from "next/navigation";

import {
  ActionError,
} from "@/lib/actions/action-error";

import {
  prisma,
} from "@/lib/prisma";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  getInvitationStatus,
  hashInvitationToken,
  invitationUnavailableMessage,
  isWellFormedInvitationToken,
} from "@/features/settings/lib/invitations";

import {
  LEGAL_VERSION,
} from "@/features/legal/legal-info";

import {
  authErrorMessage,
} from "../lib/auth-error-message";

import {
  acceptInvitationSchema,
} from "../schemas/auth-schema";

export type AcceptInvitationState = {
  error: string | null;
};

type LockedInvitation = {
  acceptedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date;
};

/*
 * Rota pública: quem tem o link cria a própria conta (nome e senha)
 * com o e-mail e a função definidos pelo escritório no convite.
 */
export async function acceptInvitationAction(
  token: string,
  _previousState: AcceptInvitationState,
  formData: FormData,
): Promise<AcceptInvitationState> {
  if (!isWellFormedInvitationToken(token)) {
    return { error: invitationUnavailableMessage(null) };
  }

  const parsed =
    acceptInvitationSchema.safeParse({
      name: formData.get("name"),
      password: formData.get("password"),
      passwordConfirm: formData.get("passwordConfirm"),
      acceptTerms: formData.get("acceptTerms") ?? undefined,
    });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Dados inválidos.",
    };
  }

  const {
    name,
    password,
  } = parsed.data;

  const invitation =
    await prisma.workspaceInvitation.findUnique({
      where: {
        tokenHash: hashInvitationToken(token),
      },
    });

  const status = invitation
    ? getInvitationStatus(invitation, new Date())
    : null;

  if (!invitation || status !== "PENDENTE") {
    return { error: invitationUnavailableMessage(status) };
  }

  const existingUser =
    await prisma.user.findUnique({
      where: { email: invitation.email },
      select: { id: true },
    });

  if (existingUser) {
    return {
      error: authErrorMessage(
        { code: "email_exists" },
        "",
      ),
    };
  }

  // Antes de criar a conta: escritório lotado não recebe novos membros.
  if (await isTeamFullForNewMember(prisma, invitation.workspaceId)) {
    return { error: TEAM_FULL_ON_ACCEPT_MESSAGE };
  }

  const admin = createAdminClient();

  const {
    data: authData,
    error: authError,
  } =
    await admin.auth.admin.createUser({
      email: invitation.email,
      password,
      // O escritório informou o e-mail e a pessoa recebeu o link por ele.
      email_confirm: true,
      user_metadata: { name },
    });

  if (authError || !authData.user) {
    console.error(
      "Falha ao criar usuário a partir de convite:",
      authError?.code ?? authError?.status ?? "sem código",
    );

    return {
      error: authErrorMessage(
        authError,
        "Não foi possível criar sua conta. Tente novamente.",
      ),
    };
  }

  const authUserId = authData.user.id;

  try {
    await prisma.$transaction(async (tx) => {
      /*
       * Bloqueia o convite: dois envios simultâneos do mesmo link
       * não criam dois vínculos, e um convite cancelado enquanto o
       * formulário estava aberto não é aceito.
       */
      const locked = await tx.$queryRaw<LockedInvitation[]>`
        SELECT "acceptedAt", "revokedAt", "expiresAt"
        FROM "WorkspaceInvitation"
        WHERE "id" = ${invitation.id}
        FOR UPDATE
      `;

      const current = locked[0];
      const currentStatus = current
        ? getInvitationStatus(current, new Date())
        : null;

      if (currentStatus !== "PENDENTE") {
        throw new ActionError(
          invitationUnavailableMessage(currentStatus),
        );
      }

        // Escritório lotado desde o envio do convite.
        if (await isTeamFullForNewMember(tx, invitation.workspaceId)) {
          throw new ActionError(TEAM_FULL_ON_ACCEPT_MESSAGE);
        }

      await tx.user.create({
        data: {
          // Mesmo UUID do Supabase Auth.
          id: authUserId,
          name,
          email: invitation.email,
          // Aceite registrado pelo servidor no momento do cadastro.
          termsVersion: LEGAL_VERSION,
          termsAcceptedAt: new Date(),
        },
      });

      await tx.membership.create({
        data: {
          userId: authUserId,
          workspaceId: invitation.workspaceId,
          role: invitation.role,
        },
      });

      await tx.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });
    });
  } catch (error) {
    // Sem o cadastro no LexFlow, a identidade no Auth ficaria órfã.
    await admin.auth.admin
      .deleteUser(authUserId)
      .catch(() => {
        console.error("Falha ao remover usuário órfão do Auth após erro no convite.");
      });

    if (error instanceof ActionError) {
      return { error: error.message };
    }

    // Não registrar o objeto do Prisma: pode conter dados da consulta.
    console.error("Falha ao concluir cadastro por convite.");

    return { error: "Não foi possível concluir seu cadastro. Tente novamente." };
  }

  const supabase = await createClient();

  const { error: loginError } =
    await supabase.auth.signInWithPassword({
      email: invitation.email,
      password,
    });

  if (loginError) {
    redirect("/login");
  }

  redirect("/dashboard");
}
