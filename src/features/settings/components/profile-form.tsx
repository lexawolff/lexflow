"use client";
/* eslint-disable @next/next/no-img-element */

import {
  useState,
  useTransition,
} from "react";

import {
  CheckCircle2,
  Loader2,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  updateProfileAction,
} from "@/features/settings/actions/update-profile";

type Props = {
  name: string;

  email: string;

  imageUrl:
    string | null;

  role: string;

  workspaceName:
    string;
};

function getInitials(
  name: string,
) {
  const words =
    name
      .trim()
      .split(/\s+/)
      .filter(
        Boolean,
      );

  if (
    words.length === 0
  ) {
    return "?";
  }

  if (
    words.length === 1
  ) {
    return words[0]
      .slice(
        0,
        2,
      )
      .toUpperCase();
  }

  return (
    words[0][0] +
    words[
      words.length -
        1
    ][0]
  ).toUpperCase();
}

export function ProfileForm({
  name,
  email,
  imageUrl,
  role,
  workspaceName,
}: Props) {
  const [
    currentName,
    setCurrentName,
  ] =
    useState(
      name,
    );

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
    isPending,
    startTransition,
  ] =
    useTransition();

  function submit(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSuccessMessage(
      null,
    );

    setErrorMessage(
      null,
    );

    const formData =
      new FormData(
        event.currentTarget,
      );

    startTransition(
      async () => {
        const result =
          await updateProfileAction(
            formData,
          );

        if (
          !result.success
        ) {
          setErrorMessage(
            result.error,
          );

          return;
        }

        setCurrentName(
          result.name,
        );

        setSuccessMessage(
          "Perfil atualizado com sucesso.",
        );
      },
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-2xl border bg-card p-5 sm:p-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-2xl font-bold text-primary">
            {imageUrl ? (
              <img
                src={
                  imageUrl
                }
                alt={
                  currentName
                }
                className="size-full object-cover"
              />
            ) : (
              getInitials(
                currentName,
              )
            )}
          </div>

          <h2 className="mt-4 text-lg font-semibold">
            {
              currentName
            }
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {
              email
            }
          </p>

          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium">
            <ShieldCheck className="size-3.5" />

            {
              role
            }
          </div>
        </div>

        <div className="mt-6 border-t pt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Escritório
          </p>

          <p className="mt-2 text-sm font-medium">
            {
              workspaceName
            }
          </p>
        </div>
      </aside>

      <form
        onSubmit={
          submit
        }
        className="overflow-hidden rounded-2xl border bg-card"
      >
        <div className="border-b p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <UserRound className="size-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Dados pessoais
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Informações utilizadas para identificar sua conta no LexFlow.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          <div>
            <label
              htmlFor="name"
              className="text-sm font-medium"
            >
              Nome
            </label>

            <input
              id="name"
              name="name"
              type="text"
              defaultValue={
                name
              }
              required
              minLength={
                2
              }
              maxLength={
                100
              }
              className="mt-2 h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />

            <p className="mt-2 text-xs text-muted-foreground">
              Esse nome poderá aparecer no sistema e na identificação da sua conta.
            </p>
          </div>

          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium"
            >
              E-mail
            </label>

            <div className="relative mt-2">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <input
                id="email"
                type="email"
                value={
                  email
                }
                readOnly
                className="h-11 w-full rounded-xl border bg-muted/40 pl-10 pr-3 text-sm text-muted-foreground outline-none"
              />
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Por segurança, a alteração do e-mail de acesso ainda não está disponível nesta tela.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Função
              </p>

              <p className="mt-2 text-sm font-medium">
                {
                  role
                }
              </p>
            </div>

            <div className="rounded-xl border bg-background p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Escritório
              </p>

              <p className="mt-2 text-sm font-medium">
                {
                  workspaceName
                }
              </p>
            </div>
          </div>

          {successMessage ? (
            <div className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />

              {
                successMessage
              }
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {
                errorMessage
              }
            </div>
          ) : null}
        </div>

        <div className="flex justify-end border-t bg-muted/20 px-5 py-4 sm:px-6">
          <button
            type="submit"
            disabled={
              isPending
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}

            {isPending
              ? "Salvando..."
              : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}