"use client";

import {
  useActionState,
} from "react";

import {
  Mail,
  Send,
} from "lucide-react";

import {
  requestPasswordResetAction,
  type RequestPasswordResetState,
} from "../actions/password-recovery";

import {
  authButtonClass,
  authErrorClass,
  authLabelClass,
  authSuccessClass,
} from "./auth-styles";

const initialState: RequestPasswordResetState = {
  error: null,
  sent: false,
};

export function RequestPasswordResetForm() {
  const [state, action, pending] =
    useActionState(
      requestPasswordResetAction,
      initialState,
    );

  if (state.sent) {
    return (
      <div
        role="status"
        className={authSuccessClass}
      >
        <p className="font-medium">
          Verifique seu e-mail.
        </p>

        <p className="mt-1">
          Se houver uma conta com este endereço, enviamos um link para
          criar uma nova senha. Abra o link <strong>neste mesmo navegador</strong>.
          Se não encontrar a mensagem, confira a caixa de spam.
        </p>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="space-y-5"
    >
      <div className="space-y-2">
        <label
          htmlFor="email"
          className={authLabelClass}
        >
          E-mail
        </label>

        <div className="relative">
          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="seu@email.com"
            className="h-11 w-full rounded-xl border bg-background pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </div>

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
        <Send className="size-4" />

        {pending ? "Enviando..." : "Enviar link de redefinição"}
      </button>
    </form>
  );
}
