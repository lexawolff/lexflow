import {
  UserRound,
} from "lucide-react";

import {
  UserRole,
} from "@prisma/client";

import {
  AppShell,
} from "@/components/app-shell/app-shell";

import {
  SettingsNav,
} from "@/components/settings/settings-nav";

import {
  ProfileForm,
} from "@/features/settings/components/profile-form";

import {
  ChangePasswordForm,
} from "@/features/settings/components/change-password-form";

import {
  requireCurrentUser,
} from "@/lib/auth";

import {
  prisma,
} from "@/lib/prisma";

import {
  getDefaultWorkspace,
} from "@/lib/workspace";

const roleLabels: Record<
  UserRole,
  string
> = {
  OWNER:
    "Proprietária",

  ADMIN:
    "Administradora",

  LAWYER:
    "Advogada",

  INTERN:
    "Estagiária",

  FINANCIAL:
    "Financeiro",

  VIEWER:
    "Visualização",
};

export default async function PerfilPage() {
  const currentUser =
    await requireCurrentUser();

  const workspace =
    await getDefaultWorkspace();

  const [
    user,
    membership,
  ] =
    await Promise.all([
      prisma.user.findUnique({
        where: {
          id:
            currentUser.id,
        },

        select: {
          id: true,

          name: true,

          email: true,

          imageUrl:
            true,
        },
      }),

      prisma.membership.findUnique({
        where: {
          userId_workspaceId: {
            userId:
              currentUser.id,

            workspaceId:
              workspace.id,
          },
        },

        select: {
          role: true,
        },
      }),
    ]);

  if (!user) {
    throw new Error(
      "Usuário não encontrado.",
    );
  }

  const role =
    membership
      ? roleLabels[
          membership.role
        ]
      : "Usuária";

  return (
    <AppShell>
      <div className="space-y-7">
        <header className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <UserRound className="size-5" />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Perfil e conta
              </h1>

              <p className="mt-1 max-w-2xl text-muted-foreground">
                Consulte e atualize as informações da sua conta no LexFlow.
              </p>
            </div>
          </div>

          <SettingsNav />
        </header>

        <ProfileForm
          name={
            user.name
          }

          email={
            user.email
          }

          imageUrl={
            user.imageUrl
          }

          role={
            role
          }

          workspaceName={
            workspace.name
          }
        />

        <ChangePasswordForm />
      </div>
    </AppShell>
  );
}