"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Link2,
  RefreshCw,
  Unlink,
} from "lucide-react";

import {
  syncGoogleCalendarAction,
} from "../actions/sync-google-calendar";

import {
  disconnectGoogleCalendarAction,
} from "@/features/settings/actions/disconnect-google-calendar";

type Props = {
  connected: boolean;

  email:
    string | null;

  calendarId:
    string | null;

  lastSyncedAt:
    string | null;

  syncFromGoogle:
    boolean;

  syncToGoogle:
    boolean;
};

function formatDateTime(
  value: string | null,
) {
  if (!value) {
    return "Ainda não sincronizado";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle:
        "short",

      timeStyle:
        "short",

      timeZone:
        "America/Sao_Paulo",
    },
  ).format(
    new Date(
      value,
    ),
  );
}

export function GoogleCalendarIntegrationCard({
  connected,
  email,
  calendarId,
  lastSyncedAt,
  syncFromGoogle,
  syncToGoogle,
}: Props) {
  const [
    isSyncing,
    startSyncTransition,
  ] =
    useTransition();

  const [
    isDisconnecting,
    startDisconnectTransition,
  ] =
    useTransition();

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState<string | null>(
      null,
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null,
    );

  const [
    needsReconnect,
    setNeedsReconnect,
  ] =
    useState(
      false,
    );

  function clearMessages() {
    setSuccessMessage(
      null,
    );

    setErrorMessage(
      null,
    );

    setNeedsReconnect(
      false,
    );
  }

  function synchronize() {
    clearMessages();

    startSyncTransition(
      async () => {
        const result =
          await syncGoogleCalendarAction();

        if (
          !result.success
        ) {
          setErrorMessage(
            result.error,
          );

          const reason =
            (
              result as {
                reason?: string;
              }
            ).reason;

          setNeedsReconnect(
            reason ===
              "reauth-required" ||
              reason ===
                "not-connected",
          );

          return;
        }

        setSuccessMessage(
          `Sincronização concluída: ${result.exported} enviado(s) ao Google, ${result.updated} atualizado(s) e ${result.cancelled} cancelado(s) a partir do Google.`,
        );

        window.location.reload();
      },
    );
  }

  function disconnect() {
    const confirmed =
      window.confirm(
        "Deseja desconectar o Google Agenda? A sincronização será interrompida, mas seus compromissos continuarão salvos no LexFlow.",
      );

    if (!confirmed) {
      return;
    }

    clearMessages();

    startDisconnectTransition(
      async () => {
        const result =
          await disconnectGoogleCalendarAction();

        if (
          !result.success
        ) {
          setErrorMessage(
            result.error,
          );

          return;
        }

        window.location.href =
          "/configuracoes/integracoes?google=disconnected";
      },
    );
  }

  const busy =
    isSyncing ||
    isDisconnecting;

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex flex-col gap-5 border-b p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            <CalendarDays className="size-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">
                Google Agenda
              </h2>

              {connected ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="size-3.5" />

                  Conectado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  <Unlink className="size-3.5" />

                  Desconectado
                </span>
              )}
            </div>

            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Mantenha prazos, audiências, perícias e outros compromissos sincronizados entre o LexFlow e o Google Agenda.
            </p>

            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Só os compromissos criados no LexFlow são sincronizados. Eventos pessoais do seu Google Agenda não aparecem para o escritório.
            </p>
          </div>
        </div>

        {!connected ? (
          <a
            href="/api/google-calendar/connect"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            <Link2 className="size-4" />

            Conectar Google
          </a>
        ) : null}
      </div>

      {connected ? (
        <>
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
            <InfoItem
              label="Conta conectada"
              value={
                email ??
                "Conta Google"
              }
            />

            <InfoItem
              label="Calendário"
              value={
                calendarId ===
                "primary"
                  ? "Calendário principal"
                  : calendarId ??
                    "—"
              }
            />

            <InfoItem
              label="Google → LexFlow"
              value={
                syncFromGoogle
                  ? "Ativo"
                  : "Desativado"
              }
            />

            <InfoItem
              label="LexFlow → Google"
              value={
                syncToGoogle
                  ? "Ativo"
                  : "Desativado"
              }
            />
          </div>

          <div className="border-t bg-muted/20 px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium">
                  Última sincronização
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDateTime(
                    lastSyncedAt,
                  )}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href="/api/google-calendar/connect"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border bg-background px-4 text-sm font-medium transition hover:bg-muted"
                >
                  <RefreshCw className="size-4" />

                  Reconectar
                </a>

                <button
                  type="button"
                  onClick={
                    synchronize
                  }
                  disabled={
                    busy
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw
                    className={[
                      "size-4",
                      isSyncing
                        ? "animate-spin"
                        : "",
                    ].join(
                      " ",
                    )}
                  />

                  {isSyncing
                    ? "Sincronizando..."
                    : "Sincronizar agora"}
                </button>

                <button
                  type="button"
                  onClick={
                    disconnect
                  }
                  disabled={
                    busy
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-background px-4 text-sm font-medium text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Unlink className="size-4" />

                  {isDisconnecting
                    ? "Desconectando..."
                    : "Desconectar"}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-5 sm:p-6">
          <div className="rounded-xl border border-dashed p-6">
            <p className="font-medium">
              Nenhuma conta Google conectada
            </p>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Conecte uma conta para enviar compromissos do LexFlow ao Google Agenda e receber as alterações feitas neles pelo calendário. Seus eventos pessoais não são trazidos para o LexFlow.
            </p>

            {email ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Última conta utilizada: {email}
              </p>
            ) : null}
          </div>
        </div>
      )}

      {successMessage ? (
        <div className="border-t px-5 py-4 sm:px-6">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
            {
              successMessage
            }
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="border-t px-5 py-4 sm:px-6">
          <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />

            <div>
              <p className="font-medium">
                Não foi possível concluir a operação
              </p>

              <p className="mt-1">
                {
                  errorMessage
                }
              </p>

              {needsReconnect ? (
                <a
                  href="/api/google-calendar/connect"
                  className="mt-3 inline-flex h-9 items-center rounded-lg border border-current/20 px-3 font-medium transition hover:bg-background/60"
                >
                  Reconectar Google
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function InfoItem({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {
          label
        }
      </p>

      <p className="mt-2 truncate text-sm font-medium">
        {
          value
        }
      </p>
    </div>
  );
}