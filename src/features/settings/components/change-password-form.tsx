"use client";

import {
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Loader2,
} from "lucide-react";

import {
  changePasswordAction,
} from "../actions/change-password";

const inputClass =
  "h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        const result = await changePasswordAction(formData);

        if (!result.success) {
          setError(result.error);
          return;
        }

        formRef.current?.reset();
        setSuccess(true);
      } catch {
        setError("Não foi possível alterar a senha. Verifique sua conexão e tente novamente.");
      }
    });
  }

  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
          <KeyRound className="size-5" />
        </div>

        <div>
          <h2 className="font-semibold">
            Alterar senha
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Por segurança, confirme sua senha atual antes de definir a nova.
          </p>
        </div>
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="mt-5 grid gap-4 md:grid-cols-3"
      >
        <div className="space-y-2">
          <label
            htmlFor="currentPassword"
            className="text-sm font-medium"
          >
            Senha atual
          </label>

          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="newPassword"
            className="text-sm font-medium"
          >
            Nova senha
          </label>

          <input
            id="newPassword"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            aria-describedby="new-password-hint"
            className={inputClass}
          />

          <p
            id="new-password-hint"
            className="text-xs text-muted-foreground"
          >
            Pelo menos 8 caracteres.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="newPasswordConfirm"
            className="text-sm font-medium"
          >
            Confirme a nova senha
          </label>

          <input
            id="newPasswordConfirm"
            name="passwordConfirm"
            type="password"
            autoComplete="new-password"
            required
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-3 md:col-span-3 md:flex-row md:items-center md:justify-between">
          <div className="min-h-5 text-sm">
            {error ? (
              <p
                role="alert"
                className="flex items-center gap-2 text-destructive"
              >
                <AlertTriangle className="size-4 shrink-0" />
                {error}
              </p>
            ) : null}

            {success ? (
              <p
                role="status"
                className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400"
              >
                <CheckCircle2 className="size-4 shrink-0" />
                Senha alterada com sucesso.
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <KeyRound className="size-4" />
            )}
            {isPending ? "Alterando..." : "Alterar senha"}
          </button>
        </div>
      </form>
    </section>
  );
}
