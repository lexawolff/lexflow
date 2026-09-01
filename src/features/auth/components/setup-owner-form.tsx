"use client";

import {
  useActionState,
} from "react";

import {
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  setupOwnerAction,
  type SetupOwnerState,
} from "../actions/setup-owner";

const initialState: SetupOwnerState =
  {
    error: null,
  };

export function SetupOwnerForm() {
  const [
    state,
    action,
    pending,
  ] =
    useActionState(
      setupOwnerAction,
      initialState,
    );

  return (
    <form
      action={action}
      className="space-y-5"
    >
      <Field
        label="Nome"
        icon={
          <UserRound className="size-4" />
        }
      >
        <input
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder="Seu nome"
          className={inputClass}
        />
      </Field>

      <Field
        label="E-mail"
        icon={
          <Mail className="size-4" />
        }
      >
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="seu@email.com"
          className={inputClass}
        />
      </Field>

      <Field
        label="Senha"
        icon={
          <LockKeyhole className="size-4" />
        }
      >
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Mínimo de 8 caracteres"
          className={inputClass}
        />
      </Field>

      <Field
        label="Confirmar senha"
        icon={
          <ShieldCheck className="size-4" />
        }
      >
        <input
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Repita sua senha"
          className={inputClass}
        />
      </Field>

      {state.error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300"
        >
          {state.error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ShieldCheck className="size-4" />

        {pending
          ? "Criando usuário..."
          : "Criar minha conta"}
      </button>
    </form>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";

function Field({
  label,
  icon,
  children,
}: {
  label:
    string;

  icon:
    React.ReactNode;

  children:
    React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">
        {label}
      </span>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>

        {children}
      </div>
    </label>
  );
}