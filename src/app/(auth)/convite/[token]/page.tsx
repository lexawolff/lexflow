import type {
  Metadata,
} from "next";

import Link from "next/link";

import {
  LogOut,
  MailX,
  UserPlus,
} from "lucide-react";

import {
  AuthCard,
} from "@/features/auth/components/auth-card";

import {
  AcceptInvitationForm,
} from "@/features/auth/components/accept-invitation-form";

import {
  authButtonClass,
} from "@/features/auth/components/auth-styles";

import {
  logoutAction,
} from "@/features/auth/actions/logout";

import {
  getInvitationStatus,
  hashInvitationToken,
  invitationUnavailableMessage,
  isWellFormedInvitationToken,
} from "@/features/settings/lib/invitations";

import {
  TEAM_ROLE_LABELS,
} from "@/features/settings/team-roles";

import {
  getCurrentAuthUser,
} from "@/lib/auth";

import {
  prisma,
} from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Convite | LexFlow",
  robots: {
    index: false,
    follow: false,
  },
};

type InvitationPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InvitationPage({
  params,
}: InvitationPageProps) {
  const { token } = await params;

  const invitation =
    isWellFormedInvitationToken(token)
      ? await prisma.workspaceInvitation.findUnique({
          where: {
            tokenHash: hashInvitationToken(token),
          },
          select: {
            email: true,
            role: true,
            expiresAt: true,
            acceptedAt: true,
            revokedAt: true,
            workspace: {
              select: { name: true },
            },
          },
        })
      : null;

  const status = invitation
    ? getInvitationStatus(invitation, new Date())
    : null;

  if (!invitation || status !== "PENDENTE") {
    return (
      <AuthCard
        icon={<MailX className="size-6" />}
        title="Convite indisponível"
        description={invitationUnavailableMessage(status)}
      >
        <Link
          href="/login"
          className={authButtonClass}
        >
          Ir para o login
        </Link>
      </AuthCard>
    );
  }

  const roleLabel = TEAM_ROLE_LABELS[invitation.role];

  const expiresAt =
    new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(invitation.expiresAt);

  const description = (
    <>
      Você foi convidado(a) para participar do escritório{" "}
      <strong className="text-foreground">{invitation.workspace.name}</strong>{" "}
      no LexFlow, com a função{" "}
      <strong className="text-foreground">{roleLabel}</strong>. O convite vale
      até {expiresAt}.
    </>
  );

  /*
   * Com outra pessoa conectada neste navegador (por exemplo, quem
   * criou o convite testando o link), o cadastro trocaria a sessão.
   * Pedimos para sair antes.
   */
  const currentUser = await getCurrentAuthUser();

  if (currentUser) {
    return (
      <AuthCard
        icon={<UserPlus className="size-6" />}
        title="Convite para o LexFlow"
        description={description}
      >
        <div className="space-y-4">
          <p className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
            Você está conectado como{" "}
            <strong>{currentUser.email}</strong>. Para aceitar este convite,
            saia da conta atual e abra o link novamente.
          </p>

          <form action={logoutAction}>
            <button
              type="submit"
              className={authButtonClass}
            >
              <LogOut className="size-4" />
              Sair da conta atual
            </button>
          </form>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      icon={<UserPlus className="size-6" />}
      title="Convite para o LexFlow"
      description={description}
    >
      <AcceptInvitationForm
        token={token}
        email={invitation.email}
      />
    </AuthCard>
  );
}
