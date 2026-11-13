"use client";
/* eslint-disable @next/next/no-img-element */

import {
  useState,
  useTransition,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Crown,
  Loader2,
  Mail,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  removeMemberAction,
  updateMemberRoleAction,
} from "@/features/settings/actions/team-actions";

type TeamRole =
  | "OWNER"
  | "ADMIN"
  | "LAWYER"
  | "INTERN"
  | "FINANCIAL"
  | "VIEWER";

type TeamMember = {
  membershipId:
    string;

  userId:
    string;

  name:
    string;

  email:
    string;

  imageUrl:
    string | null;

  role:
    TeamRole;

  joinedAt:
    string;
};

type Props = {
  members:
    TeamMember[];

  currentUserId:
    string;

  currentRole:
    TeamRole;

  canManage:
    boolean;
};

const roleOptions: Array<{
  value:
    TeamRole;

  label:
    string;
}> = [
  {
    value:
      "OWNER",

    label:
      "Proprietário",
  },
  {
    value:
      "ADMIN",

    label:
      "Administrador",
  },
  {
    value:
      "LAWYER",

    label:
      "Advogado",
  },
  {
    value:
      "INTERN",

    label:
      "Estagiário",
  },
  {
    value:
      "FINANCIAL",

    label:
      "Financeiro",
  },
  {
    value:
      "VIEWER",

    label:
      "Visualização",
  },
];

const roleLabels: Record<
  TeamRole,
  string
> = {
  OWNER:
    "Proprietário",

  ADMIN:
    "Administrador",

  LAWYER:
    "Advogado",

  INTERN:
    "Estagiário",

  FINANCIAL:
    "Financeiro",

  VIEWER:
    "Visualização",
};

function initials(
  name: string,
) {
  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(
        Boolean,
      );

  if (
    parts.length === 0
  ) {
    return "?";
  }

  if (
    parts.length === 1
  ) {
    return parts[0]
      .slice(
        0,
        2,
      )
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[
      parts.length -
        1
    ][0]
  ).toUpperCase();
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle:
        "medium",
    },
  ).format(
    new Date(
      value,
    ),
  );
}

export function TeamMembers({
  members,
  currentUserId,
  currentRole,
  canManage,
}: Props) {
  const [
    isPending,
    startTransition,
  ] =
    useTransition();

  const [
    processingId,
    setProcessingId,
  ] =
    useState<string | null>(
      null,
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

  function clearMessages() {
    setSuccessMessage(
      null,
    );

    setErrorMessage(
      null,
    );
  }

  function changeRole(
    membershipId: string,
    role: TeamRole,
  ) {
    clearMessages();

    setProcessingId(
      membershipId,
    );

    const formData =
      new FormData();

    formData.set(
      "membershipId",
      membershipId,
    );

    formData.set(
      "role",
      role,
    );

    startTransition(
      async () => {
        const result =
          await updateMemberRoleAction(
            formData,
          );

        if (
          !result.success
        ) {
          setErrorMessage(
            result.error,
          );

          setProcessingId(
            null,
          );

          return;
        }

        setSuccessMessage(
          "Função atualizada com sucesso.",
        );

        window.location.reload();
      },
    );
  }

  function removeMember(
    member:
      TeamMember,
  ) {
    const confirmed =
      window.confirm(
        `Remover ${member.name} do escritório?\n\nA conta da pessoa não será apagada, mas ela perderá o vínculo com este escritório.`,
      );

    if (
      !confirmed
    ) {
      return;
    }

    clearMessages();

    setProcessingId(
      member.membershipId,
    );

    const formData =
      new FormData();

    formData.set(
      "membershipId",
      member.membershipId,
    );

    startTransition(
      async () => {
        const result =
          await removeMemberAction(
            formData,
          );

        if (
          !result.success
        ) {
          setErrorMessage(
            result.error,
          );

          setProcessingId(
            null,
          );

          return;
        }

        setSuccessMessage(
          "Membro removido do escritório.",
        );

        window.location.reload();
      },
    );
  }

  return (
    <div className="space-y-6">
      {successMessage ? (
        <div className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />

          {
            successMessage
          }
        </div>
      ) : null}

      {errorMessage ? (
        <div className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />

          {
            errorMessage
          }
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <UsersRound className="size-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Membros do escritório
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {members.length}{" "}
                {members.length ===
                1
                  ? "usuário vinculado"
                  : "usuários vinculados"}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled
            title="O convite será ativado quando integrarmos o fluxo de cadastro e autenticação."
            className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-xl border bg-muted/40 px-4 text-sm font-medium text-muted-foreground opacity-70"
          >
            <Mail className="size-4" />

            Convidar membro

            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
              Em breve
            </span>
          </button>
        </div>

        <div className="divide-y">
          {members.map(
            (member) => {
              const isCurrentUser =
                member.userId ===
                currentUserId;

              const requesterIsAdmin =
                currentRole ===
                "ADMIN";

              const targetIsOwner =
                member.role ===
                "OWNER";

              const canEditThisMember =
                canManage &&
                !isCurrentUser &&
                !(
                  requesterIsAdmin &&
                  targetIsOwner
                );

              const availableRoles =
                currentRole ===
                "OWNER"
                  ? roleOptions
                  : roleOptions.filter(
                      (
                        option,
                      ) =>
                        option.value !==
                        "OWNER",
                    );

              return (
                <div
                  key={
                    member.membershipId
                  }
                  className="p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 font-semibold text-primary">
                        {member.imageUrl ? (
                          <img
                            src={
                              member.imageUrl
                            }
                            alt={
                              member.name
                            }
                            className="size-full object-cover"
                          />
                        ) : (
                          initials(
                            member.name,
                          )
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-semibold">
                            {
                              member.name
                            }
                          </p>

                          {isCurrentUser ? (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              Você
                            </span>
                          ) : null}

                          {member.role ===
                          "OWNER" ? (
                            <Crown className="size-4 text-amber-600" />
                          ) : null}
                        </div>

                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          {
                            member.email
                          }
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Vinculado desde{" "}
                          {formatDate(
                            member.joinedAt,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      {canEditThisMember ? (
                        <select
                          value={
                            member.role
                          }
                          disabled={
                            isPending &&
                            processingId ===
                              member.membershipId
                          }
                          onChange={(
                            event,
                          ) =>
                            changeRole(
                              member.membershipId,
                              event.target
                                .value as TeamRole,
                            )
                          }
                          className="h-10 min-w-[180px] rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        >
                          {availableRoles.map(
                            (
                              role,
                            ) => (
                              <option
                                key={
                                  role.value
                                }
                                value={
                                  role.value
                                }
                              >
                                {
                                  role.label
                                }
                              </option>
                            ),
                          )}
                        </select>
                      ) : (
                        <div className="inline-flex h-10 min-w-[160px] items-center gap-2 rounded-xl border bg-muted/30 px-3 text-sm">
                          <ShieldCheck className="size-4 text-muted-foreground" />

                          {
                            roleLabels[
                              member.role
                            ]
                          }
                        </div>
                      )}

                      {canEditThisMember ? (
                        <button
                          type="button"
                          onClick={() =>
                            removeMember(
                              member,
                            )
                          }
                          disabled={
                            isPending
                          }
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-destructive/30 px-3 text-sm font-medium text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isPending &&
                          processingId ===
                            member.membershipId ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}

                          Remover
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            },
          )}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <ShieldCheck className="size-5" />
          </div>

          <div>
            <h2 className="font-semibold">
              Papéis da equipe
            </h2>

            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Os papéis definem a posição do usuário dentro do escritório. As restrições específicas de acesso a cada módulo serão implementadas progressivamente no servidor.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <RoleCard
            title="Proprietário"
            description="Responsável principal pelo escritório e pela administração da conta."
          />

          <RoleCard
            title="Administrador"
            description="Pode administrar configurações e membros, sem controlar proprietários."
          />

          <RoleCard
            title="Advogado"
            description="Papel destinado aos profissionais jurídicos que atuam nos casos."
          />

          <RoleCard
            title="Estagiário"
            description="Papel destinado a membros de apoio jurídico e operacional."
          />

          <RoleCard
            title="Financeiro"
            description="Papel destinado à operação financeira do escritório."
          />

          <RoleCard
            title="Visualização"
            description="Papel destinado a usuários que futuramente terão acesso predominantemente consultivo."
          />
        </div>
      </section>
    </div>
  );
}

function RoleCard({
  title,
  description,
}: {
  title:
    string;

  description:
    string;
}) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="flex items-center gap-2">
        <UserRound className="size-4 text-muted-foreground" />

        <p className="text-sm font-semibold">
          {
            title
          }
        </p>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {
          description
        }
      </p>
    </div>
  );
}