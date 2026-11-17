"use client";

import {
  useActionState,
} from "react";

import Link from "next/link";

import {
  Building2,
  MailCheck,
  Send,
} from "lucide-react";

import {
  resendSignupConfirmationAction,
  signUpAction,
  type ResendConfirmationState,
  type SignUpState,
} from "../actions/signup";

import {
  AcceptTermsField,
} from "./accept-terms-field";

import {
  authButtonClass,
  authErrorClass,
  authInputClass,
  authLabelClass,
  authSuccessClass,
} from "./auth-styles";

const initialState: SignUpState = {
  error: null,
  sentTo: null,
};

const initialResendState: ResendConfirmationState = {
  message: null,
  error: null,
};

function ConfirmationSent({
  email,
}: {
  email: string;
}) {
  const [resendState, resendAction, resending] =
    useActionState(
      resendSignupConfirmationAction,
      initialResendState,
    );

  return (
    <div className="space-y-5">
      <div
        role="status"
        className={authSuccessClass}
      >
        <p className="flex items-center gap-2 font-medium">
          <MailCheck className="size-4" />
          Confirme seu e-mail para ativar o escritório.
        </p>

        <p className="mt-2">
          {email ? (
            <>
              Enviamos um link de confirmação para{" "}
              <strong>{email}</strong>.{" "}
            </>
          ) : (
            "Enviamos um link de confirmação para o e-mail informado. "
          )}
          Abra o link para concluir o cadastro. Se não encontrar a
          mensagem, confira a caixa de spam.
        </p>
      </div>

      {email ? (
        <form
          action={resendAction}
          className="space-y-3"
        >
          <input
            type="hidden"
            name="email"
            value={email}
          />

          {resendState.message ? (
            <p className="text-sm text-muted-foreground">
              {resendState.message}
            </p>
          ) : null}

          {resendState.error ? (
            <p
              role="alert"
              className={authErrorClass}
            >
              {resendState.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={resending}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border bg-background px-4 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="size-4" />
            {resending ? "Reenviando..." : "Reenviar e-mail de confirmação"}
          </button>
        </form>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        Já confirmou?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline"
        >
          Entrar no LexFlow
        </Link>
      </p>
    </div>
  );
}

export function SignUpForm() {
  const [state, action, pending] =
    useActionState(
      signUpAction,
      initialState,
    );

  if (state.sentTo !== null) {
    return <ConfirmationSent email={state.sentTo} />;
  }

  return (
    <form
      action={action}
      className="space-y-5"
    >
      {/*
        Armadilha para robôs: invisível para pessoas e leitores de tela.
      */}
      <div
        aria-hidden="true"
        className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor="website">
          Site
        </label>

        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="officeName"
          className={authLabelClass}
        >
          Nome do escritório
        </label>

        <input
          id="officeName"
          name="officeName"
          type="text"
          autoComplete="organization"
          required
          minLength={3}
          maxLength={120}
          placeholder="Ex.: Silva Advocacia Previdenciária"
          className={authInputClass}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="name"
          className={authLabelClass}
        >
          Seu nome completo
        </label>

        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          minLength={3}
          maxLength={100}
          className={authInputClass}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="email"
          className={authLabelClass}
        >
          E-mail
        </label>

        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="seu@email.com"
          className={authInputClass}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label
            htmlFor="password"
            className={authLabelClass}
          >
            Senha
          </label>

          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            aria-describedby="password-hint"
            className={authInputClass}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="passwordConfirm"
            className={authLabelClass}
          >
            Confirme a senha
          </label>

          <input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            autoComplete="new-password"
            required
            className={authInputClass}
          />
        </div>
      </div>

      <p
        id="password-hint"
        className="-mt-2 text-xs text-muted-foreground"
      >
        Pelo menos 8 caracteres. Você será a proprietária ou o proprietário
        do escritório e poderá convidar sua equipe depois.
      </p>

      <AcceptTermsField />

      {state.error ? (
        <div
          role="alert"
          className={authErrorClass}
        >
          {state.error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className={authButtonClass}
      >
        <Building2 className="size-4" />

        {pending ? "Criando conta..." : "Criar conta do escritório"}
      </button>
    </form>
  );
}
