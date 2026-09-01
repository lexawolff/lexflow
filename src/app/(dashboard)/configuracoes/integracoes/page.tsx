import {
  AppShell,
} from "@/components/app-shell/app-shell";

import {
  GoogleCalendarConnection,
} from "@/features/settings/components/google-calendar-connection";

import {
  requireCurrentUser,
} from "@/lib/auth";

import {
  prisma,
} from "@/lib/prisma";

import {
  getDefaultWorkspace,
} from "@/lib/workspace";

type Props = {
  searchParams: Promise<{
    google?: string;
  }>;
};

function getGoogleMessage(
  value:
    string | undefined,
) {
  switch (value) {
    case "connected":
      return {
        tone:
          "success" as const,

        message:
          "Google Agenda conectado com sucesso.",
      };

    case "denied":
      return {
        tone:
          "warning" as const,

        message:
          "A autorização do Google Agenda foi cancelada.",
      };

    case "invalid_state":
      return {
        tone:
          "error" as const,

        message:
          "Não foi possível validar a autorização do Google. Tente novamente.",
      };

    case "error":
      return {
        tone:
          "error" as const,

        message:
          "Não foi possível concluir a conexão com o Google Agenda.",
      };

    default:
      return null;
  }
}

export default async function IntegrationsPage({
  searchParams,
}: Props) {
  const params =
    await searchParams;

  const user =
    await requireCurrentUser();

  const workspace =
    await getDefaultWorkspace();

  const connection =
    await prisma.googleCalendarConnection.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId:
            workspace.id,

          userId:
            user.id,
        },
      },

      select: {
        googleAccountEmail:
          true,

        lastSyncedAt:
          true,
      },
    });

  const message =
    getGoogleMessage(
      params.google,
    );

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Integrações
          </h1>

          <p className="mt-1 text-muted-foreground">
            Conecte o LexFlow aos
            serviços utilizados no
            escritório.
          </p>
        </div>

        {message ? (
          <div
            className={
              message.tone ===
              "success"
                ? "rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/15 dark:text-emerald-300"
                : message.tone ===
                    "warning"
                  ? "rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/15 dark:text-amber-300"
                  : "rounded-xl border border-red-200 bg-red-50/50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/15 dark:text-red-300"
            }
          >
            {message.message}
          </div>
        ) : null}

        <GoogleCalendarConnection
          connected={
            Boolean(
              connection,
            )
          }
          email={
            connection
              ?.googleAccountEmail ??
            null
          }
          lastSyncedAt={
            connection
              ?.lastSyncedAt
              ?.toISOString() ??
            null
          }
        />
      </div>
    </AppShell>
  );
}