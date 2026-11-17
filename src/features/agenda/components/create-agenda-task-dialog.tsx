"use client";

import {
  throwOnFailure,
} from "@/lib/actions/action-result";

import {
  useMemo,
  useState,
  useTransition,
} from "react";

import type {
  ChangeEvent,
  ReactNode,
} from "react";

import {
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
  BriefcaseBusiness,
  CalendarDays,
  CalendarPlus,
  Clock3,
  FileText,
  LockKeyhole,
  MapPin,
  Plus,
  Save,
  UserRound,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  createAgendaTask,
} from "../actions/create-agenda-task";

import {
  createAgendaTaskFormSchema,
  type CreateAgendaTaskFormValues,
} from "../schemas/create-agenda-task-schema";

import type {
  AgendaClientOption,
} from "../types/agenda";

type Props = {
  clients:
    AgendaClientOption[];

  todayKey:
    string;

  initialClientId?:
    string;

  initialCaseId?:
    string;

  initialType?:
    TaskType;

  initialTitle?:
    string;

  lockClient?:
    boolean;

  lockCase?:
    boolean;

  triggerLabel?:
    string;
};

const typeOptions = [
  {
    value:
      TaskType.PRAZO_PROCESSUAL,

    label:
      "Prazo processual",
  },

  {
    value:
      TaskType.AUDIENCIA,

    label:
      "Audiência",
  },

  {
    value:
      TaskType.PERICIA,

    label:
      "Perícia",
  },

  {
    value:
      TaskType.ATENDIMENTO,

    label:
      "Atendimento",
  },

  {
    value:
      TaskType.PRORROGACAO_BENEFICIO,

    label:
      "Prorrogação de benefício",
  },

  {
    value:
      TaskType.DOCUMENTO_PENDENTE,

    label:
      "Documento pendente",
  },

  {
    value:
      TaskType.CONTATO_CLIENTE,

    label:
      "Contato com cliente",
  },

  {
    value:
      TaskType.RPV,

    label:
      "RPV / Precatório",
  },

  {
    value:
      TaskType.OUTRO,

    label:
      "Outro",
  },
];

function getTypeLabel(
  type:
    TaskType,
): string {
  return (
    typeOptions.find(
      (
        option,
      ) =>
        option.value ===
        type,
    )?.label ??
    "Compromisso"
  );
}

export function CreateAgendaTaskDialog({
  clients,
  todayKey,

  initialClientId =
    "",

  initialCaseId =
    "",

  initialType =
    TaskType.OUTRO,

  initialTitle =
    "",

  lockClient =
    false,

  lockCase =
    false,

  triggerLabel =
    "Novo compromisso",
}: Props) {
  const router =
    useRouter();

  const [
    open,
    setOpen,
  ] =
    useState(
      false,
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

  const defaultValues =
    useMemo<CreateAgendaTaskFormValues>(
      () => ({
        title:
          initialTitle,

        type:
          initialType,

        date:
          todayKey,

        time:
          "",

        clientId:
          initialClientId,

        caseId:
          initialCaseId,

        location:
          "",

        description:
          "",
      }),
      [
        initialCaseId,
        initialClientId,
        initialTitle,
        initialType,
        todayKey,
      ],
    );

  const form =
    useForm<CreateAgendaTaskFormValues>(
      {
        resolver:
          zodResolver(
            createAgendaTaskFormSchema,
          ),

        defaultValues,
      },
    );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,

    formState: {
      errors,
    },
  } =
    form;

  const selectedClientId =
    watch(
      "clientId",
    );

  const currentTitle =
    watch(
      "title",
    );

  const allCases =
    useMemo(
      () =>
        clients.flatMap(
          (
            client,
          ) =>
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

  const fixedClient =
    useMemo(
      () =>
        clients.find(
          (
            client,
          ) =>
            client.id ===
            initialClientId,
        ) ??
        null,
      [
        clients,
        initialClientId,
      ],
    );

  const fixedCase =
    useMemo(
      () =>
        allCases.find(
          (
            clientCase,
          ) =>
            clientCase.id ===
            initialCaseId,
        ) ??
        null,
      [
        allCases,
        initialCaseId,
      ],
    );

  function closeDialog() {
    setOpen(
      false,
    );

    setErrorMessage(
      null,
    );
  }

  function handleOpenChange(
    nextOpen:
      boolean,
  ) {
    setOpen(
      nextOpen,
    );

    setErrorMessage(
      null,
    );

    if (
      nextOpen
    ) {
      reset(
        defaultValues,
      );
    }
  }

  const typeRegistration =
    register(
      "type",
    );

  function suggestTitle(
    type:
      TaskType,
  ) {
    /*
     * Só sugere um título enquanto
     * a pessoa ainda não escreveu
     * um título próprio.
     */

    if (
      currentTitle.trim()
    ) {
      return;
    }

    if (
      type ===
      TaskType.OUTRO
    ) {
      return;
    }

    const clientName =
      fixedClient?.name ??
      clients.find(
        (
          client,
        ) =>
          client.id ===
          selectedClientId,
      )?.name;

    const label =
      getTypeLabel(
        type,
      );

    setValue(
      "title",

      clientName
        ? `${label} - ${clientName}`
        : label,

      {
        shouldDirty:
          true,

        shouldValidate:
          true,
      },
    );
  }

  const submit =
    handleSubmit(
      (
        values,
      ) => {
        setErrorMessage(
          null,
        );

        startTransition(
          async () => {
            try {
              const formData =
                new FormData();

              /*
               * Quando o diálogo é aberto
               * dentro da ficha do caso,
               * os vínculos bloqueados não
               * podem ser alterados.
               */

              const clientId =
                lockClient &&
                initialClientId
                  ? initialClientId
                  : values.clientId;

              const caseId =
                lockCase &&
                initialCaseId
                  ? initialCaseId
                  : values.caseId;

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
                clientId,
              );

              formData.set(
                "caseId",
                caseId,
              );

              formData.set(
                "location",
                values.location,
              );

              formData.set(
                "description",
                values.description,
              );

              await throwOnFailure(createAgendaTask)(
                formData,
              );

              reset(
                defaultValues,
              );

              closeDialog();

              router.refresh();
            } catch (
              error
            ) {
              console.error(
                error,
              );

              setErrorMessage(
                error instanceof
                  Error
                  ? error.message
                  : "Não foi possível salvar o compromisso.",
              );
            }
          },
        );
      },
    );

  return (
    <Dialog
      open={
        open
      }
      onOpenChange={
        handleOpenChange
      }
    >
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-2 size-4" />

            {
              triggerLabel
            }
          </Button>
        }
      />

      <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-2xl">
        {/* ==========================
            CABEÇALHO
        ========================== */}

        <div className="border-b bg-blue-50/30 px-5 py-5 dark:bg-blue-950/10 sm:px-6">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                <CalendarPlus className="size-5" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Agenda
                </p>

                <DialogTitle className="mt-1 text-xl">
                  Novo compromisso
                </DialogTitle>

                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  Cadastre um prazo, audiência,
                  perícia, atendimento ou outra
                  atividade do escritório.
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form
          onSubmit={
            submit
          }
          className="space-y-5 p-5 sm:p-6"
        >
          {/* ==========================
              IDENTIFICAÇÃO
          ========================== */}

          <FormSection
            title="Identificação"
            description="Defina como o compromisso aparecerá na agenda."
            icon={
              FileText
            }
          >
            <div className="space-y-4">
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
                  placeholder="Ex.: Perícia médica de Maria"
                  className={
                    inputClass
                  }
                />
              </FieldGroup>

              <FieldGroup
                label="Tipo"
                error={
                  errors.type
                    ?.message
                }
                required
              >
                <select
                  {...typeRegistration}
                  onChange={(
                    event:
                      ChangeEvent<HTMLSelectElement>,
                  ) => {
                    typeRegistration.onChange(
                      event,
                    );

                    suggestTitle(
                      event.target
                        .value as TaskType,
                    );
                  }}
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
            </div>
          </FormSection>

          {/* ==========================
              VÍNCULOS
          ========================== */}

          <FormSection
            title="Vínculos"
            description="Relacione o compromisso ao cliente e à caso, quando houver."
            icon={
              UserRound
            }
            tone="violet"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldGroup
                label="Cliente"
                error={
                  errors.clientId
                    ?.message
                }
              >
                {lockClient ? (
                  <>
                    <input
                      type="hidden"
                      {...register(
                        "clientId",
                      )}
                    />

                    <ReadOnlyValue
                      icon={
                        <UserRound className="size-4" />
                      }
                    >
                      {fixedClient
                        ?.name ??
                        "Cliente vinculado"}
                    </ReadOnlyValue>
                  </>
                ) : (
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
                )}
              </FieldGroup>

              <FieldGroup
                label="Caso"
                error={
                  errors.caseId
                    ?.message
                }
              >
                {lockCase ? (
                  <>
                    <input
                      type="hidden"
                      {...register(
                        "caseId",
                      )}
                    />

                    <ReadOnlyValue
                      icon={
                        <BriefcaseBusiness className="size-4" />
                      }
                    >
                      {fixedCase ? (
                        <>
                          {
                            fixedCase.title
                          }

                          {fixedCase.number
                            ? ` • ${fixedCase.number}`
                            : ""}
                        </>
                      ) : (
                        "Caso vinculado"
                      )}
                    </ReadOnlyValue>
                  </>
                ) : (
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
                )}
              </FieldGroup>
            </div>

            {(lockClient ||
              lockCase) ? (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-violet-200 bg-violet-50/40 px-3 py-2.5 text-xs text-violet-700 dark:border-violet-900 dark:bg-violet-950/15 dark:text-violet-300">
                <LockKeyhole className="mt-0.5 size-3.5 shrink-0" />

                <span>
                  Os vínculos acima foram definidos
                  pelo local onde este compromisso
                  está sendo cadastrado.
                </span>
              </div>
            ) : null}
          </FormSection>

          {/* ==========================
              DATA E LOCAL
          ========================== */}

          <FormSection
            title="Quando e onde"
            description="Informe a data, o horário e o local do compromisso."
            icon={
              CalendarDays
            }
            tone="amber"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldGroup
                label="Data"
                error={
                  errors.date
                    ?.message
                }
                required
              >
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    {...register(
                      "date",
                    )}
                    type="date"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </FieldGroup>

              <FieldGroup
                label="Horário"
                error={
                  errors.time
                    ?.message
                }
              >
                <div className="relative">
                  <Clock3 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    {...register(
                      "time",
                    )}
                    type="time"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </FieldGroup>

              <div className="sm:col-span-2">
                <FieldGroup
                  label="Local"
                  error={
                    errors.location
                      ?.message
                  }
                >
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <input
                      {...register(
                        "location",
                      )}
                      placeholder="Ex.: Justiça Federal de Cachoeiro de Itapemirim"
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </FieldGroup>
              </div>
            </div>
          </FormSection>

          {/* ==========================
              OBSERVAÇÕES
          ========================== */}

          <FormSection
            title="Observações"
            description="Registre informações úteis para o cumprimento da atividade."
            icon={
              FileText
            }
          >
            <FieldGroup
              label="Informações adicionais"
              error={
                errors.description
                  ?.message
              }
            >
              <textarea
                {...register(
                  "description",
                )}
                rows={
                  4
                }
                placeholder="Informações importantes sobre a tarefa ou compromisso..."
                className={`${inputClass} min-h-28 resize-y py-3`}
              />
            </FieldGroup>
          </FormSection>

          {/* ==========================
              ERRO
          ========================== */}

          {errorMessage ? (
            <div
              role="alert"
              className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {
                errorMessage
              }
            </div>
          ) : null}

          {/* ==========================
              AÇÕES
          ========================== */}

          <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-col-reverse gap-2 border-t bg-background/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:-mb-6 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              disabled={
                isPending
              }
              onClick={
                closeDialog
              }
              className="inline-flex h-10 items-center justify-center rounded-xl border bg-background px-4 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                isPending
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              <Save className="size-4" />

              {isPending
                ? "Salvando..."
                : "Salvar compromisso"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const inputClass =
  "h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/10";

type FormSectionTone =
  | "default"
  | "violet"
  | "amber";

function FormSection({
  title,
  description,
  icon: Icon,
  tone =
    "default",
  children,
}: {
  title:
    string;

  description:
    string;

  icon:
    typeof CalendarDays;

  tone?:
    FormSectionTone;

  children:
    ReactNode;
}) {
  const styles = {
    default: {
      border:
        "border-border",

      header:
        "border-border bg-muted/15",

      icon:
        "bg-muted text-muted-foreground",
    },

    violet: {
      border:
        "border-violet-200 dark:border-violet-900",

      header:
        "border-violet-100 bg-violet-50/30 dark:border-violet-900 dark:bg-violet-950/10",

      icon:
        "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    },

    amber: {
      border:
        "border-amber-200 dark:border-amber-900",

      header:
        "border-amber-100 bg-amber-50/30 dark:border-amber-900 dark:bg-amber-950/10",

      icon:
        "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    },
  }[
    tone
  ];

  return (
    <section
      className={`overflow-hidden rounded-2xl border ${styles.border}`}
    >
      <div
        className={`border-b px-4 py-3.5 ${styles.header}`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
          >
            <Icon className="size-4" />
          </div>

          <div>
            <h3 className="text-sm font-semibold">
              {
                title
              }
            </h3>

            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              {
                description
              }
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {
          children
        }
      </div>
    </section>
  );
}

function ReadOnlyValue({
  children,
  icon,
}: {
  children:
    ReactNode;

  icon?:
    ReactNode;
}) {
  return (
    <div className="flex min-h-10 items-center gap-2 rounded-xl border bg-muted/40 px-3 text-sm">
      {icon ?? (
        <LockKeyhole className="size-3.5 shrink-0 text-muted-foreground" />
      )}

      <span className="min-w-0 truncate">
        {
          children
        }
      </span>
    </div>
  );
}

function FieldGroup({
  label,
  error,
  required =
    false,
  children,
}: {
  label:
    string;

  error?:
    string;

  required?:
    boolean;

  children:
    ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">
        {
          label
        }

        {required ? (
          <span className="ml-1 text-destructive">
            *
          </span>
        ) : null}
      </span>

      {
        children
      }

      {error ? (
        <span className="block text-xs text-destructive">
          {
            error
          }
        </span>
      ) : null}
    </label>
  );
}