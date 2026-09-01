"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Link2Off,
  RefreshCw,
} from "lucide-react";

import {
  disconnectGoogleCalendar,
} from "../actions/disconnect-google-calendar";

import {
  syncGoogleCalendarAction,
} from "../actions/sync-google-calendar";

type Props = {
  connected:
    boolean;

  email:
    string | null;

  lastSyncedAt:
    string | null;
};

function formatDateTime(
  value: string,
): string {
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
    new Date(value),
  );
}

export function GoogleCalendarConnection({
  connected,
  email,
  lastSyncedAt,
}: Props) {
  const router =
    useRouter();

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<
      string | null
    >(
      null,
    );

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState<
      string | null
    >(
      null,
    );

  const [
    isPending,
    startTransition,
  ] =
    useTransition();

  function handleSync() {
    setErrorMessage(
      null,
    );

    setSuccessMessage(
      null,
    );

    startTransition(
      async () => {
        const result =
          await syncGoogleCalendarAction();

        if (
          !result.success
        ) {
          setErrorMessage(
            result.error,
          );

          return;
        }

        const pieces:
          string[] =
          [];

        if (
          result.imported >
          0
        ) {
          pieces.push(
            `${result.imported} novo(s) evento(s) importado(s)`,
          );
        }

        if (
          result.updated >
          0
        ) {
          pieces.push(
            `${result.updated} evento(s) atualizado(s)`,
          );
        }

        if (
          result.cancelled >
          0
        ) {
          pieces.push(
            `${result.cancelled} cancelamento(s) recebido(s)`,
          );
        }

        if (
          result.exported >
          0
        ) {
          pieces.push(
            `${result.exported} compromisso(s) enviado(s) ao Google`,
          );
        }

        if (
          pieces.length ===
          0
        ) {
          setSuccessMessage(
            "Agenda sincronizada. Não havia novas alterações.",
          );
        } else {
          setSuccessMessage(
            `Sincronização concluída: ${pieces.join(
              ", ",
            )}.`,
          );
        }

        router.refresh();
      },
    );
  }

  function handleDisconnect() {
    setErrorMessage(
      null,
    );

    setSuccessMessage(
      null,
    );

    startTransition(
      async () => {
        try {
          await disconnectGoogleCalendar();

          router.refresh();
        } catch (error) {
          console.error(
            error,
          );

          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Não foi possível desconectar o Google Agenda.",
          );
        }
      },
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      {/* ==========================
          CABEÇALHO
      ========================== */}

      <div className="border-b bg-blue-50/40 p-5 dark:bg-blue-950/10">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            <CalendarDays className="size-5" />
          </div>

          <div>
            <h2 className="font-semibold">
              Google Agenda
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Sincronize os compromissos
              do LexFlow com seu
              calendário Google.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {connected ? (
          <div className="space-y-5">
            {/* ==========================
                CONECTADO
            ========================== */}

            <div className="flex flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-900 dark:bg-emerald-950/10">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />

                <div>
                  <p className="font-medium text-emerald-800 dark:text-emerald-300">
                    Google Agenda conectado
                  </p>

                  {email ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {email}
                    </p>
                  ) : null}

                  {lastSyncedAt ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Última sincronização:{" "}
                      {formatDateTime(
                        lastSyncedAt,
                      )}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      A sincronização inicial
                      ainda não foi executada.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ==========================
                AÇÕES
            ========================== */}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={
                  isPending
                }
                onClick={
                  handleSync
                }
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={`size-4 ${
                    isPending
                      ? "animate-spin"
                      : ""
                  }`}
                />

                {isPending
                  ? "Sincronizando..."
                  : "Sincronizar agora"}
              </button>

              <a
                href="/api/google-calendar/connect"
                className="inline-flex h-10 items-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium transition hover:bg-muted"
              >
                <RefreshCw className="size-4" />

                Reconectar
              </a>

              <button
                type="button"
                disabled={
                  isPending
                }
                onClick={
                  handleDisconnect
                }
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300"
              >
                <Link2Off className="size-4" />

                Desconectar
              </button>
            </div>

            {/* ==========================
                SUCESSO
            ========================== */}

            {successMessage ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/15 dark:text-emerald-300">
                {successMessage}
              </div>
            ) : null}
          </div>
        ) : (
          /* ==========================
             NÃO CONECTADO
          ========================== */

          <div className="space-y-5">
            <div>
              <p className="font-medium">
                Nenhuma conta Google conectada
              </p>

              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Conecte sua conta para que
                perícias, audiências,
                atendimentos e demais
                compromissos possam ser
                sincronizados entre o
                LexFlow e o Google Agenda.
              </p>
            </div>

            <a
              href="/api/google-calendar/connect"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              <ExternalLink className="size-4" />

              Conectar Google Agenda
            </a>
          </div>
        )}

        {/* ==========================
            ERRO
        ========================== */}

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50/50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/15 dark:text-red-300">
            {errorMessage}
          </div>
        ) : null}
      </div>
    </div>
  );
}