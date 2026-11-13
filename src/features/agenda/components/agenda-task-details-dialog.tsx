"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import Link from "next/link";

import type {
  ReactNode,
} from "react";

import {
  TaskStatus,
  TaskType,
} from "@prisma/client";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import {
  useForm,
} from "react-hook-form";

import {
  useRouter,
} from "next/navigation";

import {
  Ban,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileText,
  MapPin,
  Pencil,
  Play,
  RotateCcw,
  Trash2,
  UserRound,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  deleteAgendaTask,
} from "../actions/delete-agenda-task";

import {
  updateAgendaTask,
} from "../actions/update-agenda-task";

import {
  updateAgendaTaskStatus,
} from "../actions/update-agenda-task-status";

import {
  updateAgendaTaskFormSchema,
  type AgendaTaskStatusAction,
  type UpdateAgendaTaskFormValues,
} from "../schemas/agenda-task-actions-schema";

import type {
  AgendaClientOption,
  AgendaTask,
} from "../types/agenda";

type Props = {
  task:
    AgendaTask | null;

  clients:
    AgendaClientOption[];

  open: boolean;

  onOpenChange:
    (open: boolean) => void;

  canEditAgenda:
    boolean;

  canDeleteAgenda:
    boolean;
};

type Mode =
  | "DETAILS"
  | "EDIT"
  | "DELETE"
  | "CANCEL";

const typeLabels: Record<
  TaskType,
  string
> = {
  PRAZO_PROCESSUAL:
    "Prazo processual",

  PRORROGACAO_BENEFICIO:
    "Prorrogação de benefício",

  AUDIENCIA:
    "Audiência",

  PERICIA:
    "Perícia",

  ATENDIMENTO:
    "Atendimento",

  DOCUMENTO_PENDENTE:
    "Documento pendente",

  CONTATO_CLIENTE:
    "Contato com cliente",

  RPV:
    "RPV / Precatório",

  OUTRO:
    "Outro",
};

const typeOptions =
  Object.entries(
    typeLabels,
  ).map(
    ([
      value,
      label,
    ]) => ({
      value:
        value as TaskType,

      label,
    }),
  );

const statusLabels: Record<
  TaskStatus,
  string
> = {
  PENDENTE:
    "Pendente",

  EM_ANDAMENTO:
    "Em andamento",

  CONCLUIDA:
    "Concluída",

  CANCELADA:
    "Cancelada",

  ATRASADA:
    "Atrasada",
};

function getDateKey(
  value: string,
): string {
  const date =
    new Date(value);

  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "America/Sao_Paulo",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      },
    );

  const parts =
    formatter.formatToParts(
      date,
    );

  const year =
    parts.find(
      (part) =>
        part.type ===
        "year",
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type ===
        "month",
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type ===
        "day",
    )?.value;

  return `${year}-${month}-${day}`;
}

function getTimeValue(
  value:
    string | null,
): string {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      hour:
        "2-digit",

      minute:
        "2-digit",

      hour12:
        false,

      timeZone:
        "America/Sao_Paulo",
    },
  ).format(
    new Date(value),
  );
}

function formatDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric",

      timeZone:
        "America/Sao_Paulo",
    },
  ).format(
    new Date(value),
  );
}

function formatDateTime(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",

      timeZone:
        "America/Sao_Paulo",
    },
  ).format(
    new Date(value),
  );
}

function getEffectiveStatus(
  task:
    AgendaTask,
): TaskStatus {
  if (
    task.status ===
      TaskStatus.CONCLUIDA ||
    task.status ===
      TaskStatus.CANCELADA
  ) {
    return task.status;
  }

  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "America/Sao_Paulo",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      },
    );

  const parts =
    formatter.formatToParts(
      new Date(),
    );

  const year =
    parts.find(
      (part) =>
        part.type === "year",
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type === "month",
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type === "day",
    )?.value;

  const today =
    `${year}-${month}-${day}`;

  if (
    getDateKey(
      task.dueDate,
    ) < today
  ) {
    return TaskStatus.ATRASADA;
  }

  return task.status;
}

export function AgendaTaskDetailsDialog({
  task,
  clients,
  open,
  onOpenChange,
  canEditAgenda,
  canDeleteAgenda,
}: Props) {
  const router =
    useRouter();

  const [
    mode,
    setMode,
  ] =
    useState<Mode>(
      "DETAILS",
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

  useEffect(() => {
    if (open) {
      setMode(
        "DETAILS",
      );

      setErrorMessage(
        null,
      );
    }
  }, [
    open,
    task?.id,
  ]);

  /*
   * Criamos uma referência
   * definitivamente não anulável.
   *
   * Isso evita o erro:
   * "'task' is possibly 'null'"
   * dentro das callbacks assíncronas.
   */
  if (!task) {
    return null;
  }

  const currentTask =
    task;

  const effectiveStatus =
    getEffectiveStatus(
      currentTask,
    );

  function runStatusAction(
    action:
      AgendaTaskStatusAction,
  ) {
    if (!canEditAgenda) {
      return;
    }

    setErrorMessage(
      null,
    );

    startTransition(
      async () => {
        try {
          const formData =
            new FormData();

          formData.set(
            "taskId",
            currentTask.id,
          );

          formData.set(
            "action",
            action,
          );

          await updateAgendaTaskStatus(
            formData,
          );

          onOpenChange(
            false,
          );

          router.refresh();
        } catch (error) {
          console.error(
            error,
          );

          setErrorMessage(
            error instanceof
              Error
              ? error.message
              : "Não foi possível alterar o compromisso.",
          );
        }
      },
    );
  }

  function handleDelete() {
    if (!canDeleteAgenda) {
      return;
    }

    setErrorMessage(
      null,
    );

    startTransition(
      async () => {
        try {
          const formData =
            new FormData();

          formData.set(
            "taskId",
            currentTask.id,
          );

          await deleteAgendaTask(
            formData,
          );

          onOpenChange(
            false,
          );

          router.refresh();
        } catch (error) {
          console.error(
            error,
          );

          setErrorMessage(
            error instanceof
              Error
              ? error.message
              : "Não foi possível excluir o compromisso.",
          );
        }
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={
        isPending
          ? undefined
          : onOpenChange
      }
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {mode ===
        "DETAILS" ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {
                  currentTask.title
                }
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <TypeBadge
                  type={
                    currentTask.type
                  }
                />

                <StatusBadge
                  status={
                    effectiveStatus
                  }
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailCard
                  icon={
                    <CalendarDays className="size-4" />
                  }
                  label="Data"
                >
                  {currentTask.startsAt
                    ? formatDateTime(
                        currentTask.startsAt,
                      )
                    : formatDate(
                        currentTask.dueDate,
                      )}
                </DetailCard>

                {currentTask.location ? (
                  <DetailCard
                    icon={
                      <MapPin className="size-4" />
                    }
                    label="Local"
                  >
                    {
                      currentTask.location
                    }
                  </DetailCard>
                ) : null}

                {currentTask.clientName ? (
                  <DetailCard
                    icon={
                      <UserRound className="size-4" />
                    }
                    label="Cliente"
                  >
                    {currentTask.clientId ? (
                      <Link
                        href={`/clientes/${currentTask.clientId}`}
                        className="inline-flex items-center gap-1 font-medium hover:underline"
                      >
                        {
                          currentTask.clientName
                        }

                        <ExternalLink className="size-3" />
                      </Link>
                    ) : (
                      currentTask.clientName
                    )}
                  </DetailCard>
                ) : null}

                {currentTask.caseTitle ? (
                  <DetailCard
                    icon={
                      <FileText className="size-4" />
                    }
                    label="Caso"
                  >
                    {currentTask.caseId &&
                    currentTask.clientId ? (
                      <Link
                        href={`/clientes/${currentTask.clientId}/casos/${currentTask.caseId}`}
                        className="inline-flex items-center gap-1 font-medium hover:underline"
                      >
                        <span>
                          {
                            currentTask.caseTitle
                          }

                          {currentTask.caseNumber
                            ? ` • ${currentTask.caseNumber}`
                            : ""}
                        </span>

                        <ExternalLink className="size-3 shrink-0" />
                      </Link>
                    ) : (
                      currentTask.caseTitle
                    )}
                  </DetailCard>
                ) : null}
              </div>

              {currentTask.description ? (
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Observações
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {
                      currentTask.description
                    }
                  </p>
                </div>
              ) : null}

              {currentTask.completedAt ? (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300">
                  <CheckCircle2 className="size-4" />

                  Concluída em{" "}
                  {formatDateTime(
                    currentTask.completedAt,
                  )}
                </div>
              ) : null}

              {currentTask.googleEventId ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50/40 px-3 py-2 text-xs text-blue-700 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-300">
                  Este compromisso possui
                  vínculo com um evento
                  externo.
                </div>
              ) : null}

              {errorMessage ? (
                <ErrorMessage>
                  {
                    errorMessage
                  }
                </ErrorMessage>
              ) : null}

              {canEditAgenda ||
              canDeleteAgenda ? (
                <div className="flex flex-col gap-3 border-t pt-5">
                  {canEditAgenda ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {currentTask.status ===
                          TaskStatus.CONCLUIDA ? (
                          <ActionButton
                            onClick={() =>
                              runStatusAction(
                                "REOPEN",
                              )
                            }
                            disabled={
                              isPending
                            }
                            icon={
                              <RotateCcw className="size-4" />
                            }
                          >
                            Reabrir
                          </ActionButton>
                        ) : currentTask.status ===
                          TaskStatus.CANCELADA ? (
                          <ActionButton
                            onClick={() =>
                              runStatusAction(
                                "REOPEN",
                              )
                            }
                            disabled={
                              isPending
                            }
                            icon={
                              <RotateCcw className="size-4" />
                            }
                          >
                            Reabrir
                          </ActionButton>
                        ) : (
                          <>
                            {currentTask.status !==
                            TaskStatus.EM_ANDAMENTO ? (
                              <ActionButton
                                onClick={() =>
                                  runStatusAction(
                                    "START",
                                  )
                                }
                                disabled={
                                  isPending
                                }
                                icon={
                                  <Play className="size-4" />
                                }
                              >
                                Em andamento
                              </ActionButton>
                            ) : null}

                            <ActionButton
                              onClick={() =>
                                runStatusAction(
                                  "COMPLETE",
                                )
                              }
                              disabled={
                                isPending
                              }
                              icon={
                                <CheckCircle2 className="size-4" />
                              }
                              tone="success"
                            >
                              Concluir
                            </ActionButton>
                          </>
                        )}

                        {currentTask.status !==
                        TaskStatus.CANCELADA ? (
                          <ActionButton
                            onClick={() =>
                              setMode(
                                "EDIT",
                              )
                            }
                            disabled={
                              isPending
                            }
                            icon={
                              <Pencil className="size-4" />
                            }
                          >
                            Editar
                          </ActionButton>
                        ) : null}
                      </div>

                      {currentTask.status !==
                        TaskStatus.CONCLUIDA &&
                      currentTask.status !==
                        TaskStatus.CANCELADA ? (
                        <div className="flex flex-wrap gap-2">
                          <ActionButton
                            onClick={() =>
                              setMode(
                                "CANCEL",
                              )
                            }
                            disabled={
                              isPending
                            }
                            icon={
                              <Ban className="size-4" />
                            }
                            tone="warning"
                          >
                            Cancelar
                          </ActionButton>
                        </div>
                      ) : null}
                    </>
                  ) : null}

                  {canDeleteAgenda ? (
                    <div className="flex flex-wrap gap-2">
                      <ActionButton
                        onClick={() =>
                          setMode(
                            "DELETE",
                          )
                        }
                        disabled={
                          isPending
                        }
                        icon={
                          <Trash2 className="size-4" />
                        }
                        tone="danger"
                      >
                        Excluir
                      </ActionButton>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </>
        ) : null}

        {mode ===
          "EDIT" &&
        canEditAgenda ? (
          <EditTaskContent
            task={
              currentTask
            }
            clients={
              clients
            }
            onCancel={() =>
              setMode(
                "DETAILS",
              )
            }
            onSuccess={() => {
              onOpenChange(
                false,
              );

              router.refresh();
            }}
          />
        ) : null}

        {mode ===
          "CANCEL" &&
        canEditAgenda ? (
          <ConfirmationContent
            title="Cancelar compromisso"
            description="O compromisso será mantido no banco de dados, mas deixará de aparecer na agenda ativa."
            confirmLabel="Confirmar cancelamento"
            icon={
              <Ban className="size-5" />
            }
            tone="warning"
            isPending={
              isPending
            }
            errorMessage={
              errorMessage
            }
            onBack={() =>
              setMode(
                "DETAILS",
              )
            }
            onConfirm={() =>
              runStatusAction(
                "CANCEL",
              )
            }
          />
        ) : null}

        {mode ===
          "DELETE" &&
        canDeleteAgenda ? (
          <ConfirmationContent
            title="Excluir compromisso"
            description="O compromisso será apagado definitivamente. Use esta opção apenas quando o registro tiver sido criado por engano."
            confirmLabel="Excluir definitivamente"
            icon={
              <Trash2 className="size-5" />
            }
            tone="danger"
            isPending={
              isPending
            }
            errorMessage={
              errorMessage
            }
            onBack={() =>
              setMode(
                "DETAILS",
              )
            }
            onConfirm={
              handleDelete
            }
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/*
 * ==========================
 * EDIÇÃO
 * ==========================
 */

function EditTaskContent({
  task,
  clients,
  onCancel,
  onSuccess,
}: {
  task:
    AgendaTask;

  clients:
    AgendaClientOption[];

  onCancel:
    () => void;

  onSuccess:
    () => void;
}) {
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

  const form =
    useForm<UpdateAgendaTaskFormValues>(
      {
        resolver:
          zodResolver(
            updateAgendaTaskFormSchema,
          ),

        defaultValues: {
          title:
            task.title,

          type:
            task.type,

          date:
            getDateKey(
              task.startsAt ??
                task.dueDate,
            ),

          time:
            getTimeValue(
              task.startsAt,
            ),

          clientId:
            task.clientId ??
            "",

          caseId:
            task.caseId ??
            "",

          location:
            task.location ??
            "",

          description:
            task.description ??
            "",
        },
      },
    );

  const {
    register,
    watch,
    setValue,
    handleSubmit,

    formState: {
      errors,
    },
  } = form;

  const selectedClientId =
    watch(
      "clientId",
    );

  const allCases =
    useMemo(
      () =>
        clients.flatMap(
          (client) =>
            client.cases.map(
              (
                clientCase,
              ) => ({
                ...clientCase,

                clientId:
                  client.id,

                clientName:
                  client.name,
              }),
            ),
        ),
      [
        clients,
      ],
    );

  const visibleCases =
    selectedClientId
      ? allCases.filter(
          (
            clientCase,
          ) =>
            clientCase.clientId ===
            selectedClientId,
        )
      : allCases;

  const submit =
    handleSubmit(
      (values) => {
        setErrorMessage(
          null,
        );

        startTransition(
          async () => {
            try {
              const formData =
                new FormData();

              formData.set(
                "taskId",
                task.id,
              );

              formData.set(
                "title",
                values.title,
              );

              formData.set(
                "type",
                values.type,
              );

              formData.set(
                "date",
                values.date,
              );

              formData.set(
                "time",
                values.time,
              );

              formData.set(
                "clientId",
                values.clientId,
              );

              formData.set(
                "caseId",
                values.caseId,
              );

              formData.set(
                "location",
                values.location,
              );

              formData.set(
                "description",
                values.description,
              );

              await updateAgendaTask(
                formData,
              );

              onSuccess();
            } catch (error) {
              console.error(
                error,
              );

              setErrorMessage(
                error instanceof
                  Error
                  ? error.message
                  : "Não foi possível salvar as alterações.",
              );
            }
          },
        );
      },
    );

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          Editar compromisso
        </DialogTitle>
      </DialogHeader>

      <form
        onSubmit={
          submit
        }
        className="space-y-5"
      >
        <FieldGroup
          label="Título"
          error={
            errors.title
              ?.message
          }
          required
        >
          <input
            {...register(
              "title",
            )}
            className={
              inputClass
            }
          />
        </FieldGroup>

        <div className="grid gap-4 sm:grid-cols-2">
          <FieldGroup
            label="Tipo"
            error={
              errors.type
                ?.message
            }
          >
            <select
              {...register(
                "type",
              )}
              className={
                inputClass
              }
            >
              {typeOptions.map(
                (
                  option,
                ) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {
                      option.label
                    }
                  </option>
                ),
              )}
            </select>
          </FieldGroup>

          <FieldGroup
            label="Cliente"
            error={
              errors.clientId
                ?.message
            }
          >
            <select
              {...register(
                "clientId",
                {
                  onChange:
                    () => {
                      setValue(
                        "caseId",
                        "",
                      );
                    },
                },
              )}
              className={
                inputClass
              }
            >
              <option value="">
                Sem cliente vinculado
              </option>

              {clients.map(
                (
                  client,
                ) => (
                  <option
                    key={
                      client.id
                    }
                    value={
                      client.id
                    }
                  >
                    {
                      client.name
                    }
                  </option>
                ),
              )}
            </select>
          </FieldGroup>

          <div className="sm:col-span-2">
            <FieldGroup
              label="Caso"
              error={
                errors.caseId
                  ?.message
              }
            >
              <select
                {...register(
                  "caseId",
                )}
                className={
                  inputClass
                }
              >
                <option value="">
                  Sem caso vinculado
                </option>

                {visibleCases.map(
                  (
                    clientCase,
                  ) => (
                    <option
                      key={
                        clientCase.id
                      }
                      value={
                        clientCase.id
                      }
                    >
                      {
                        clientCase.clientName
                      }{" "}
                      —{" "}
                      {
                        clientCase.title
                      }

                      {clientCase.number
                        ? ` • ${clientCase.number}`
                        : ""}
                    </option>
                  ),
                )}
              </select>
            </FieldGroup>
          </div>

          <FieldGroup
            label="Data"
            error={
              errors.date
                ?.message
            }
            required
          >
            <input
              {...register(
                "date",
              )}
              type="date"
              className={
                inputClass
              }
            />
          </FieldGroup>

          <FieldGroup
            label="Horário"
            error={
              errors.time
                ?.message
            }
          >
            <input
              {...register(
                "time",
              )}
              type="time"
              className={
                inputClass
              }
            />
          </FieldGroup>

          <div className="sm:col-span-2">
            <FieldGroup
              label="Local"
              error={
                errors.location
                  ?.message
              }
            >
              <input
                {...register(
                  "location",
                )}
                className={
                  inputClass
                }
              />
            </FieldGroup>
          </div>
        </div>

        <FieldGroup
          label="Observações"
          error={
            errors.description
              ?.message
          }
        >
          <textarea
            {...register(
              "description",
            )}
            rows={4}
            className={`${inputClass} min-h-24 resize-y py-2`}
          />
        </FieldGroup>

        {errorMessage ? (
          <ErrorMessage>
            {
              errorMessage
            }
          </ErrorMessage>
        ) : null}

        <div className="flex justify-end gap-3 border-t pt-4">
          <button
            type="button"
            disabled={
              isPending
            }
            onClick={
              onCancel
            }
            className="h-10 rounded-lg border bg-background px-4 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
          >
            Voltar
          </button>

          <button
            type="submit"
            disabled={
              isPending
            }
            className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending
              ? "Salvando..."
              : "Salvar alterações"}
          </button>
        </div>
      </form>
    </>
  );
}

/*
 * ==========================
 * CONFIRMAÇÃO
 * ==========================
 */

function ConfirmationContent({
  title,
  description,
  confirmLabel,
  icon,
  tone,
  isPending,
  errorMessage,
  onBack,
  onConfirm,
}: {
  title: string;

  description: string;

  confirmLabel: string;

  icon:
    ReactNode;

  tone:
    | "warning"
    | "danger";

  isPending:
    boolean;

  errorMessage:
    string | null;

  onBack:
    () => void;

  onConfirm:
    () => void;
}) {
  const danger =
    tone ===
    "danger";

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {title}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-5">
        <div
          className={`rounded-xl border p-5 ${
            danger
              ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/15"
              : "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/15"
          }`}
        >
          <div
            className={`flex size-10 items-center justify-center rounded-xl ${
              danger
                ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
            }`}
          >
            {icon}
          </div>

          <p className="mt-4 text-sm">
            {description}
          </p>
        </div>

        {errorMessage ? (
          <ErrorMessage>
            {
              errorMessage
            }
          </ErrorMessage>
        ) : null}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={
              isPending
            }
            onClick={
              onBack
            }
            className="h-10 rounded-lg border bg-background px-4 text-sm font-medium"
          >
            Voltar
          </button>

          <button
            type="button"
            disabled={
              isPending
            }
            onClick={
              onConfirm
            }
            className={`h-10 rounded-lg px-4 text-sm font-medium text-white disabled:opacity-50 ${
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            {isPending
              ? "Processando..."
              : confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}

/*
 * ==========================
 * COMPONENTES
 * ==========================
 */

function DetailCard({
  icon,
  label,
  children,
}: {
  icon:
    ReactNode;

  label:
    string;

  children:
    ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}

        {label}
      </div>

      <div className="mt-2 text-sm font-medium">
        {children}
      </div>
    </div>
  );
}

function TypeBadge({
  type,
}: {
  type:
    TaskType;
}) {
  const className =
    getTypeBadgeClass(
      type,
    );

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {
        typeLabels[
          type
        ]
      }
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status:
    TaskStatus;
}) {
  const styles: Record<
    TaskStatus,
    string
  > = {
    PENDENTE:
      "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300",

    EM_ANDAMENTO:
      "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300",

    CONCLUIDA:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300",

    CANCELADA:
      "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",

    ATRASADA:
      "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      {
        statusLabels[
          status
        ]
      }
    </span>
  );
}

function ActionButton({
  children,
  icon,
  onClick,
  disabled,
  tone = "default",
}: {
  children:
    ReactNode;

  icon:
    ReactNode;

  onClick:
    () => void;

  disabled?:
    boolean;

  tone?:
    | "default"
    | "success"
    | "warning"
    | "danger";
}) {
  const styles = {
    default:
      "border bg-background hover:bg-muted",

    success:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300",

    warning:
      "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300",

    danger:
      "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300",
  }[tone];

  return (
    <button
      type="button"
      disabled={
        disabled
      }
      onClick={
        onClick
      }
      className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition disabled:opacity-50 ${styles}`}
    >
      {icon}

      {children}
    </button>
  );
}

function ErrorMessage({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      {children}
    </div>
  );
}

function FieldGroup({
  label,
  error,
  required = false,
  children,
}: {
  label: string;

  error?: string;

  required?: boolean;

  children:
    ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">
        {label}

        {required ? (
          <span className="ml-1 text-destructive">
            *
          </span>
        ) : null}
      </span>

      {children}

      {error ? (
        <span className="block text-xs text-destructive">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function getTypeBadgeClass(
  type:
    TaskType,
): string {
  switch (type) {
    case "PRAZO_PROCESSUAL":
      return "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300";

    case "AUDIENCIA":
      return "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-300";

    case "PERICIA":
      return "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300";

    case "ATENDIMENTO":
      return "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300";

    case "PRORROGACAO_BENEFICIO":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300";

    case "DOCUMENTO_PENDENTE":
      return "bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300";

    case "CONTATO_CLIENTE":
      return "bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300";

    case "RPV":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300";

    default:
      return "bg-muted text-muted-foreground";
  }
}

const inputClass =
  "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20";