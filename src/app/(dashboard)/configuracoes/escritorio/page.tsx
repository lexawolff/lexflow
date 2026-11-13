import {
  Building2,
} from "lucide-react";

import {
  AppShell,
} from "@/components/app-shell/app-shell";

import {
  SettingsNav,
} from "@/components/settings/settings-nav";

import {
  WorkspaceForm,
} from "@/features/settings/components/workspace-form";

import {
  requireWorkspacePagePermission,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

export default async function EscritorioPage() {
  const {
    workspace: currentWorkspace,
  } =
    await requireWorkspacePagePermission(
      "OFFICE_MANAGE",
    );

  const workspace =
    await prisma.workspace.findUnique({
      where: {
        id:
          currentWorkspace.id,
      },

      select: {
        name: true,

        legalName:
          true,

        cnpj: true,

        oabRegistration:
          true,

        oabState:
          true,

        email: true,

        phone: true,

        whatsapp:
          true,

        website:
          true,

        cep: true,

        address:
          true,

        addressNumber:
          true,

        complement:
          true,

        neighborhood:
          true,

        city: true,

        state: true,
      },
    });

  if (!workspace) {
    throw new Error(
      "Escritório não encontrado.",
    );
  }

  return (
    <AppShell>
      <div className="space-y-7">
        <header className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <Building2 className="size-5" />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Escritório
              </h1>

              <p className="mt-1 max-w-2xl text-muted-foreground">
                Gerencie os dados institucionais e profissionais do escritório.
              </p>
            </div>
          </div>

          <SettingsNav />
        </header>

        <WorkspaceForm
          workspace={
            workspace
          }
          canEdit
        />
      </div>
    </AppShell>
  );
}