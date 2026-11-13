import {
  AlertCircle,
  Blocks,
  CheckCircle2,
  Unlink,
} from "lucide-react";

import {
  AppShell,
} from "@/components/app-shell/app-shell";

import {
  SettingsNav,
} from "@/components/settings/settings-nav";

import {
  GoogleCalendarIntegrationCard,
} from "@/features/settings/components/google-calendar-integration-card";

import {
  requireCurrentUser,
} from "@/lib/auth";

import {
  getCurrentWorkspaceAccess,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

type PageProps = {
  searchParams: Promise<{
    google?: string;
  }>;
};

export default async function IntegracoesPage({
  searchParams,
}: PageProps) {
  const params =
    await searchParams;

  const user =
    await requireCurrentUser();

  const {
    workspace,
  } =
    await getCurrentWorkspaceAccess();

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

        calendarId:
          true,

        lastSyncedAt:
          true,

        syncFromGoogle:
          true,

        syncToGoogle:
          true,
      },
    });

  /*
   * Mesmo depois de desconectar,
   * preservamos o registro da conexão
   * para não perder os vínculos das Tasks.
   *
   * Portanto consideramos "conectado"
   * apenas quando algum sentido de
   * sincronização está ativo.
   */
  const connected =
    Boolean(
      connection &&
        (
          connection.syncFromGoogle ||
          connection.syncToGoogle
        ),
    );

  const googleErrorMessage =
    params.google ===
    "denied"
      ? "A autorização do Google Agenda foi cancelada."
      : params.google ===
        "invalid_state"
        ? "Não foi possível validar a autorização do Google Agenda. Inicie a conexão novamente."
        : params.google ===
          "error"
          ? "Não foi possível concluir a conexão com o Google Agenda."
          : null;

  return (
    <AppShell>
      <div className="space-y-7">
        <header className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <Blocks className="size-5" />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Integrações
              </h1>

              <p className="mt-1 max-w-2xl text-muted-foreground">
                Conecte o LexFlow aos serviços utilizados pelo escritório.
              </p>
            </div>
          </div>

          <SettingsNav />
        </header>

        {params.google ===
        "connected" ? (
          <div className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />

            <div>
              <p className="font-semibold">
                Google Agenda conectado
              </p>

              <p className="mt-1">
                A autorização foi renovada e a sincronização está disponível.
              </p>
            </div>
          </div>
        ) : null}

        {params.google ===
        "disconnected" ? (
          <div className="flex gap-3 rounded-2xl border bg-muted/40 p-4 text-sm">
            <Unlink className="mt-0.5 size-5 shrink-0 text-muted-foreground" />

            <div>
              <p className="font-semibold">
                Google Agenda desconectado
              </p>

              <p className="mt-1 text-muted-foreground">
                A sincronização foi interrompida.
                Seus compromissos continuam salvos no LexFlow.
              </p>
            </div>
          </div>
        ) : null}

        {googleErrorMessage ? (
          <div className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
            <AlertCircle className="mt-0.5 size-5 shrink-0" />

            <div>
              <p className="font-semibold">
                Google Agenda não conectado
              </p>

              <p className="mt-1">
                {googleErrorMessage}
              </p>
            </div>
          </div>
        ) : null}

        <GoogleCalendarIntegrationCard
          connected={
            connected
          }

          email={
            connection
              ?.googleAccountEmail ??
            null
          }

          calendarId={
            connection
              ?.calendarId ??
            null
          }

          lastSyncedAt={
            connection
              ?.lastSyncedAt
              ?.toISOString() ??
            null
          }

          syncFromGoogle={
            connection
              ?.syncFromGoogle ??
            false
          }

          syncToGoogle={
            connection
              ?.syncToGoogle ??
            false
          }
        />

        <section className="rounded-2xl border border-dashed bg-card/50 p-5 sm:p-6">
          <h2 className="font-semibold">
            Outras integrações
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Novos serviços poderão ser adicionados aqui conforme o LexFlow evoluir.
          </p>
        </section>
      </div>
    </AppShell>
  );
}