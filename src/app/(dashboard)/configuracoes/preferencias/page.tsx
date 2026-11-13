import {
  SlidersHorizontal,
} from "lucide-react";

import {
  AppShell,
} from "@/components/app-shell/app-shell";

import {
  SettingsNav,
} from "@/components/settings/settings-nav";

import {
  PreferencesForm,
} from "@/features/settings/components/preferences-form";

import {
  requireCurrentUser,
} from "@/lib/auth";

import {
  prisma,
} from "@/lib/prisma";

import {
  getDefaultWorkspace,
} from "@/lib/workspace";

export default async function PreferenciasPage() {
  const user =
    await requireCurrentUser();

  const workspace =
    await getDefaultWorkspace();

  const membership =
    await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId:
            user.id,

          workspaceId:
            workspace.id,
        },
      },

      select: {
        agendaShowCompleted:
          true,

        agendaDefaultStatus:
          true,

        agendaItemsPerDay:
          true,

        agendaShowAttention:
          true,
      },
    });

  if (!membership) {
    throw new Error(
      "Você não pertence a este escritório.",
    );
  }

  return (
    <AppShell>
      <div className="space-y-7">
        <header className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <SlidersHorizontal className="size-5" />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Preferências
              </h1>

              <p className="mt-1 max-w-2xl text-muted-foreground">
                Personalize como o LexFlow apresenta sua rotina de trabalho.
              </p>
            </div>
          </div>

          <SettingsNav />
        </header>

        <PreferencesForm
          agendaShowCompleted={
            membership.agendaShowCompleted
          }
          agendaDefaultStatus={
            membership.agendaDefaultStatus
          }
          agendaItemsPerDay={
            membership.agendaItemsPerDay
          }
          agendaShowAttention={
            membership.agendaShowAttention
          }
        />
      </div>
    </AppShell>
  );
}