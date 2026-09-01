"use client";

import {
  useMemo,
  useState,
  useTransition,
} from "react";

import type {
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
  CalendarPlus,
  LockKeyhole,
  Plus,
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
      (option) =>
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
    useState(false);

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

  const fixedClient =
    useMemo(
      () =>
        clients.find(
          (client) =>
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
     * Só sugerimos título quando
     * a pessoa ainda não digitou
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
        (client) =>
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
      (values) => {
        setErrorMessage(
          null,
        );

        startTransition(
          async () => {
            try {
              const formData =
                new FormData();

              /*
               * Se o formulário estiver
               * sendo usado dentro da
               * ficha do processo,
               * esses IDs permanecem
               * obrigatoriamente os
               * mesmos.
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

              await createAgendaTask(
                formData,
              );

              reset(
                defaultValues,
              );

              closeDialog();

              router.refresh();
            } catch (error) {
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

            {triggerLabel}
          </Button>
        }
      />

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="size-5" />

            Novo compromisso
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={
            submit
          }
          className="space-y-5"
        >
          {/* ==========================
              TÍTULO
          ========================== */}

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

          <div className="grid gap-4 sm:grid-cols-2">
            {/* ==========================
                TIPO
            ========================== */}

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
                onChange={
                  (
                    event,
                  ) => {
                    typeRegistration.onChange(
                      event,
                    );

                    suggestTitle(
                      event.target
                        .value as
                        TaskType,
                    );
                  }
                }
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

            {/* ==========================
                CLIENTE
            ========================== */}

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

                  <ReadOnlyValue>
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

            {/* ==========================
                PROCESSO
            ========================== */}

            <div className="sm:col-span-2">
              <FieldGroup
                label="Processo"
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

                    <ReadOnlyValue>
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
                        "Processo vinculado"
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
                      Sem processo vinculado
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

            {/* ==========================
                DATA
            ========================== */}

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

            {/* ==========================
                HORÁRIO
            ========================== */}

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

            {/* ==========================
                LOCAL
            ========================== */}

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
                  placeholder="Ex.: Justiça Federal de Cachoeiro de Itapemirim"
                  className={
                    inputClass
                  }
                />
              </FieldGroup>
            </div>
          </div>

          {/* ==========================
              OBSERVAÇÕES
          ========================== */}

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
              rows={
                4
              }
              placeholder="Informações importantes sobre a tarefa ou compromisso..."
              className={`${inputClass} min-h-24 resize-y py-2`}
            />
          </FieldGroup>

          {errorMessage ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {
                errorMessage
              }
            </div>
          ) : null}

          {/* ==========================
              AÇÕES
          ========================== */}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={
                isPending
              }
              onClick={
                closeDialog
              }
              className="h-10 rounded-lg border bg-background px-4 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
            >
              Cancelar
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
                : "Salvar compromisso"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const inputClass =
  "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20";

function ReadOnlyValue({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <div className="flex min-h-10 items-center gap-2 rounded-lg border bg-muted/40 px-3 text-sm">
      <LockKeyhole className="size-3.5 shrink-0 text-muted-foreground" />

      <span className="truncate">
        {children}
      </span>
    </div>
  );
}

function FieldGroup({
  label,
  error,
  required = false,
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