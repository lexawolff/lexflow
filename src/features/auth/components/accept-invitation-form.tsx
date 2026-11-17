"use client";

import {
  useActionState,
} from "react";

import {
  UserPlus,
} from "lucide-react";

import {
  acceptInvitationAction,
  type AcceptInvitationState,
} from "../actions/accept-invitation";

import {
  AcceptTermsField,
} from "./accept-terms-field";

import {
  authButtonClass,
  authErrorClass,
  authInputClass,
  authLabelClass,
} from "./auth-styles";

const initialState: AcceptInvitationState = {
  error: null,
};

type AcceptInvitationFormProps = {
  token: string;
  email: string;
};

export function AcceptInvitationForm({
  token,
  email,
}: AcceptInvitationFormProps) {
  const [state, action, pending] =
    useActionState(
      acceptInvitationAction.bind(null, token),
      initialState,
    );

  return (
    <form
      action={action}
      className="space-y-5"
    >
      <div className="space-y-2">
        <label
          htmlFor="invite-email"
          className={authLabelClass}
        >
          E-mail de acesso
        </label>

        <input
          id="invite-email"
          type="email"
          value={email}
          disabled
          readOnly
          className={authInputClass}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="name"
          className={authLabelClass}
        >
          Nome completo
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
          htmlFor="password"
          className={authLabelClass}
        >
          Crie uma senha
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
        <UserPlus className="size-4" />

        {pending ? "Criando sua conta..." : "Criar minha conta e entrar"}
      </button>
    </form>
  );
}
