"use client";

import {
  useMemo,
  useState,
  useTransition,
  type FormEvent,
} from "react";

import {
  AlertTriangle,
  Check,
  Copy,
  Link2,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  X,
} from "lucide-react";

import {
  isActionFailure,
} from "@/lib/actions/action-result";

import {
  createInvitationAction,
  regenerateInvitationLinkAction,
  revokeInvitationAction,
  type InvitationLink,
} from "../actions/invitation-actions";

import {
  TEAM_ROLE_LABELS,
  TEAM_ROLE_OPTIONS,
  type TeamRoleValue,
} from "../team-roles";

export type PendingInvitation = {
  id: string;
  email: string;
  role: TeamRoleValue;
  status: "PENDENTE" | "EXPIRADO";
  expiresAt: string;
};

type Props = {
  invitations: PendingInvitation[];
  currentRole: TeamRoleValue;
  workspaceName: string;
  // Vagas do plano; null para escritórios sem limite.
  capacity: { used: number; limit: number; full: boolean } | null;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function formatDateTime(value: string) {
  return dateFormatter.format(new Date(value));
}

export function TeamInvitations({
  invitations,
  currentRole,
  workspaceName,
  capacity,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<InvitationLink | null>(null);
  const [copied, setCopied] = useState<"link" | "message" | null>(null);
  const [role, setRole] = useState<TeamRoleValue>("LAWYER");

  const availableRoles = useMemo(
    () =>
      currentRole === "OWNER"
        ? TEAM_ROLE_OPTIONS
        : TEAM_ROLE_OPTIONS.filter((option) => option.value !== "OWNER"),
    [currentRole],
  );

  const selectedRole = availableRoles.find((option) => option.value === role);

  // O link completo só existe no navegador (window.location.origin).
  const fullUrl =
    link && typeof window !== "undefined"
      ? `${window.location.origin}${link.invitePath}`
      : "";

  const shareMessage = link
    ? `Olá! Você foi convidado(a) para acessar o LexFlow do escritório ${workspaceName}. Crie seu acesso por este link (válido até ${formatDateTime(link.expiresAt)}): ${fullUrl}`
    : "";

  function showLink(result: InvitationLink) {
    setLink(result);
    setCopied(null);
    setError(null);
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setError(null);
    setPendingId("new");

    startTransition(async () => {
      try {
        const result = await createInvitationAction(formData);

        if (isActionFailure(result)) {
          setError(result.actionError);
          return;
        }

        form.reset();
        setRole("LAWYER");
        showLink(result);
      } catch {
        setError("Não foi possível gerar o convite. Verifique sua conexão e tente novamente.");
      } finally {
        setPendingId(null);
      }
    });
  }

  function handleRegenerate(invitationId: string) {
    const formData = new FormData();
    formData.set("invitationId", invitationId);

    setError(null);
    setPendingId(invitationId);

    startTransition(async () => {
      try {
        const result = await regenerateInvitationLinkAction(formData);

        if (isActionFailure(result)) {
          setError(result.actionError);
          return;
        }

        showLink(result);
      } catch {
        setError("Não foi possível gerar um novo link. Tente novamente.");
      } finally {
        setPendingId(null);
      }
    });
  }

  function handleRevoke(invitation: PendingInvitation) {
    if (
      !window.confirm(
        `Cancelar o convite de ${invitation.email}? O link enviado deixará de funcionar.`,
      )
    ) {
      return;
    }

    const formData = new FormData();
    formData.set("invitationId", invitation.id);

    setError(null);
    setPendingId(invitation.id);

    startTransition(async () => {
      try {
        const result = await revokeInvitationAction(formData);

        if (isActionFailure(result)) {
          setError(result.actionError);
          return;
        }

        if (link && link.email === invitation.email) {
          setLink(null);
        }
      } catch {
        setError("Não foi possível cancelar o convite. Tente novamente.");
      } finally {
        setPendingId(null);
      }
    });
  }

  async function copy(text: string, kind: "link" | "message") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
    } catch {
      setError("Não foi possível copiar automaticamente. Selecione o link e copie manualmente.");
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="border-b p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Send className="size-5" />
          </div>

          <div>
            <h2 className="font-semibold">
              Convidar membro
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Gere um link de convite e envie para a pessoa por WhatsApp ou
              e-mail. Ela cria a própria senha e entra com a função escolhida.
              O link vale por 7 dias.
            </p>

            {capacity ? (
              <p className="mt-2 text-sm">
                <strong className="font-semibold">
                  {capacity.used} de {capacity.limit} vagas usadas
                </strong>{" "}
                <span className="text-muted-foreground">
                  (membros e convites pendentes)
                </span>
              </p>
            ) : null}
          </div>
        </div>

        {capacity?.full ? (
          <p
            role="status"
            className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
          >
            O escritório chegou ao limite de {capacity.limit} usuários do plano.
            Remova um membro ou cancele um convite para convidar outra pessoa.
          </p>
        ) : null}

        <form
          onSubmit={handleCreate}
          className="mt-5 grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end"
        >
          <div className="space-y-2">
            <label
              htmlFor="invite-email"
              className="text-sm font-medium"
            >
              E-mail da pessoa
            </label>

            <input
              id="invite-email"
              name="email"
              type="email"
              required
              autoComplete="off"
              placeholder="nome@email.com"
              className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="invite-role"
              className="text-sm font-medium"
            >
              Função
            </label>

            <select
              id="invite-role"
              name="role"
              value={role}
              onChange={(event) => setRole(event.target.value as TeamRoleValue)}
              className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            >
              {availableRoles.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isPending || Boolean(capacity?.full)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingId === "new" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Link2 className="size-4" />
            )}
            Gerar link de convite
          </button>

          {selectedRole ? (
            <p className="text-xs text-muted-foreground md:col-span-3">
              <strong className="font-medium text-foreground">
                {selectedRole.label}:
              </strong>{" "}
              {selectedRole.description}
            </p>
          ) : null}
        </form>

        {error ? (
          <div
            role="alert"
            className="mt-4 flex gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        ) : null}

        {link ? (
          <div
            role="status"
            className="mt-4 space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/20"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm">
                Link de convite para <strong>{link.email}</strong>, válido até{" "}
                {formatDateTime(link.expiresAt)}.{" "}
                <span className="text-muted-foreground">
                  Por segurança ele aparece só agora; se perder, gere um novo.
                </span>
              </p>

              <button
                type="button"
                onClick={() => setLink(null)}
                aria-label="Fechar"
                className="rounded-md p-1 text-muted-foreground transition hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <input
              readOnly
              value={fullUrl}
              aria-label="Link de convite"
              onFocus={(event) => event.currentTarget.select()}
              className="h-10 w-full rounded-xl border bg-background px-3 font-mono text-xs"
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copy(fullUrl, "link")}
                className="inline-flex h-9 items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition hover:bg-muted"
              >
                {copied === "link" ? (
                  <Check className="size-4 text-emerald-600" />
                ) : (
                  <Copy className="size-4" />
                )}
                {copied === "link" ? "Link copiado" : "Copiar link"}
              </button>

              <button
                type="button"
                onClick={() => copy(shareMessage, "message")}
                className="inline-flex h-9 items-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition hover:bg-muted"
              >
                {copied === "message" ? (
                  <Check className="size-4 text-emerald-600" />
                ) : (
                  <MessageCircle className="size-4" />
                )}
                {copied === "message" ? "Mensagem copiada" : "Copiar mensagem para WhatsApp"}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {invitations.length > 0 ? (
        <div>
          <p className="border-b bg-muted/30 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6">
            Convites aguardando cadastro
          </p>

          <ul className="divide-y">
            {invitations.map((invitation) => {
              const busy = pendingId === invitation.id;
              const expired = invitation.status === "EXPIRADO";

              return (
                <li
                  key={invitation.id}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {invitation.email}
                    </p>

                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {TEAM_ROLE_LABELS[invitation.role]} ·{" "}
                      {expired ? (
                        <span className="font-medium text-amber-700 dark:text-amber-400">
                          Expirado em {formatDateTime(invitation.expiresAt)}
                        </span>
                      ) : (
                        <>Válido até {formatDateTime(invitation.expiresAt)}</>
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleRegenerate(invitation.id)}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busy ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <RefreshCw className="size-4" />
                      )}
                      Gerar novo link
                    </button>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleRevoke(invitation)}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-destructive/30 px-3 text-sm font-medium text-destructive transition hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <X className="size-4" />
                      Cancelar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
