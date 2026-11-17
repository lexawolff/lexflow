"use client";

import {
  useActionState,
} from "react";

import {
  KeyRound,
} from "lucide-react";

import {
  updatePasswordAction,
  type UpdatePasswordState,
} from "../actions/password-recovery";

import {
  authButtonClass,
  authErrorClass,
  authInputClass,
  authLabelClass,
} from "./auth-styles";

const initialState: UpdatePasswordState = {
  error: null,
};

export function UpdatePasswordForm() {
  const [state, action, pending] =
    useActionState(
      updatePasswordAction,
      initialState,
    );

  return (
    <form
      action={action}
      className="space-y-5"
    >
      <div className="space-y-2">
        <label
          htmlFor="password"
          className={authLabelClass}
        >
          Nova senha
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

        <p
          id="password-hint"
          className="text-xs text-muted-foreground"
        >
          Pelo menos 8 caracteres.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="passwordConfirm"
          className={authLabelClass}
        >
          Confirme a nova senha
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
        <KeyRound className="size-4" />

        {pending ? "Salvando..." : "Salvar nova senha"}
      </button>
    </form>
  );
}
