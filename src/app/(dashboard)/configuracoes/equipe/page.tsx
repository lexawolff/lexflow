import {
  UsersRound,
} from "lucide-react";

import {
  AppShell,
} from "@/components/app-shell/app-shell";

import {
  SettingsNav,
} from "@/components/settings/settings-nav";

import {
  TeamMembers,
} from "@/features/settings/components/team-members";

import {
  requireCurrentUser,
} from "@/lib/auth";

import {
  requireWorkspacePagePermission,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

export default async function EquipePage() {
  const user =
    await requireCurrentUser();

  const {
    workspace,
    membership,
  } =
    await requireWorkspacePagePermission(
      "TEAM_MANAGE",
    );

  const memberships =
    await prisma.membership.findMany({
      where: {
        workspaceId:
          workspace.id,
      },

      orderBy: {
        createdAt:
          "asc",
      },

      select: {
        id: true,

        role: true,

        createdAt:
          true,

        user: {
          select: {
            id: true,

            name: true,

            email: true,

            imageUrl:
              true,
          },
        },
      },
    });

  const members =
    memberships.map(
      (
        item,
      ) => ({
        membershipId:
          item.id,

        userId:
          item.user.id,

        name:
          item.user.name,

        email:
          item.user.email,

        imageUrl:
          item.user.imageUrl,

        role:
          item.role,

        joinedAt:
          item.createdAt.toISOString(),
      }),
    );

  return (
    <AppShell>
      <div className="space-y-7">
        <header className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <UsersRound className="size-5" />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Equipe e permissões
              </h1>

              <p className="mt-1 max-w-2xl text-muted-foreground">
                Gerencie os usuários vinculados ao escritório e suas funções no LexFlow.
              </p>
            </div>
          </div>

          <SettingsNav />
        </header>

        <TeamMembers
          members={
            members
          }

          currentUserId={
            user.id
          }

          currentRole={
            membership.role
          }

          canManage
        />
      </div>
    </AppShell>
  );
}