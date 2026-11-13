"use client";

import type {
  ElementType,
  ReactNode,
} from "react";

import {
  useEffect,
  useState,
  useTransition,
} from "react";

import {
  AlertTriangle,
  Ban,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Landmark,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";

import {
  RpvStatus,
  RpvType,
} from "@prisma/client";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import {
  useForm,
} from "react-hook-form";

import {
  Button,
} from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  CurrencyField,
} from "@/components/forms/currency-field";

import {
  SelectField,
} from "@/components/forms/select-field";

import {
  TextareaField,
} from "@/components/forms/textarea-field";

import {
  TextField,
} from "@/components/forms/text-field";

import {
  updateRpv,
} from "../actions/update-rpv";

import {
  updateRpvStatus,
} from "../actions/update-rpv-status";

import {
  removeRpv,
} from "../actions/remove-rpv";

import {
  updateRpvFormSchema,
  updateRpvStatusFormSchema,
  type RpvRemovalMode,
  type UpdateRpvFormValues,
  type UpdateRpvStatusFormValues,
} from "../schemas/rpv-actions-schema";

export type EditableRpv = {
  id: string;

  type:
    RpvType;

  requisitionNumber:
    string;

  court:
    string;

  grossAmount:
    number;

  contractualFeeRate:
    number;

  contractualFeeValue:
    number;

  sucumbencyFeeValue:
    number;

  expectedPaymentDate:
    string;

  paidAt:
    string;

  bank:
    string;

  status:
    RpvStatus;

  notes:
    string;
};

type Props = {
  rpv:
    EditableRpv;
};

const typeOptions = [
  {
    label:
      "RPV",

    value:
      RpvType.RPV,
  },

  {
    label:
      "Precatório",

    value:
      RpvType.PRECATORIO,
  },
];

const statusOptions = [
  {
    label:
      "Aguardando expedição",

    value:
      RpvStatus.AGUARDANDO_EXPEDICAO,
  },

  {
    label:
      "Expedida",

    value:
      RpvStatus.EXPEDIDA,
  },

  {
    label:
      "Autuada",

    value:
      RpvStatus.AUTUADA,
  },

  {
    label:
      "Liberada",

    value:
      RpvStatus.LIBERADA,
  },

  {
    label:
      "Paga",

    value:
      RpvStatus.PAGA,
  },

  {
    label:
      "Cancelada",

    value:
      RpvStatus.CANCELADA,
  },
];

const statusLabels: Record<
  RpvStatus,
  string
> = {
  AGUARDANDO_EXPEDICAO:
    "Aguardando expedição",

  EXPEDIDA:
    "Expedida",

  AUTUADA:
    "Autuada",

  LIBERADA:
    "Liberada",

  PAGA:
    "Paga",

  CANCELADA:
    "Cancelada",
};

function getTodayInputValue(): string {
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
      (
        part,
      ) =>
        part.type ===
        "year",
    )?.value;

  const month =
    parts.find(
      (
        part,
      ) =>
        part.type ===
        "month",
    )?.value;

  const day =
    parts.find(
      (
        part,
      ) =>
        part.type ===
        "day",
    )?.value;

  if (
    !year ||
    !month ||
    !day
  ) {
    return "";
  }

  return `${year}-${month}-${day}`;
}

function formatMoney(
  value: number,
): string {
  return value.toLocaleString(
    "pt-BR",
    {
      style:
        "currency",

      currency:
        "BRL",
    },
  );
}

function getEditRpvDefaultValues(
  rpv: EditableRpv,
): UpdateRpvFormValues {
  return {
    type:
      rpv.type,

    requisitionNumber:
      rpv.requisitionNumber,

    court:
      rpv.court,

    grossAmount:
      rpv.grossAmount,

    contractualFeeRate:
      rpv.contractualFeeRate,

    contractualFeeValue:
      rpv.contractualFeeValue,

    sucumbencyFeeValue:
      rpv.sucumbencyFeeValue,

    expectedPaymentDate:
      rpv.expectedPaymentDate,

    bank:
      rpv.bank,

    notes:
      rpv.notes,
  };
}

export function RpvActionsMenu({
  rpv,
}: Props) {
  const [
    editOpen,
    setEditOpen,
  ] =
    useState(false);

  const [
    statusOpen,
    setStatusOpen,
  ] =
    useState(false);

  const [
    cancelOpen,
    setCancelOpen,
  ] =
    useState(false);

  const [
    deleteOpen,
    setDeleteOpen,
  ] =
    useState(false);

  const isPaid =
    rpv.status ===
    RpvStatus.PAGA;

  const isCanceled =
    rpv.status ===
    RpvStatus.CANCELADA;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Ações da requisição"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          }
        />

        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() =>
              setStatusOpen(
                true,
              )
            }
            className="text-violet-700 focus:text-violet-700 dark:text-violet-300 dark:focus:text-violet-300"
          >
            {isPaid ? (
              <RotateCcw className="mr-2 size-4" />
            ) : (
              <CalendarClock className="mr-2 size-4" />
            )}

            Alterar situação
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={
              isCanceled
            }
            onClick={() =>
              setEditOpen(
                true,
              )
            }
          >
            <Pencil className="mr-2 size-4" />

            Editar
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            disabled={
              isPaid ||
              isCanceled
            }
            onClick={() =>
              setCancelOpen(
                true,
              )
            }
            className="text-amber-700 focus:text-amber-700 dark:text-amber-300 dark:focus:text-amber-300"
          >
            <Ban className="mr-2 size-4" />

            Cancelar
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={
              isPaid
            }
            onClick={() =>
              setDeleteOpen(
                true,
              )
            }
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 size-4" />

            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditRpvDialog
        open={
          editOpen
        }
        onOpenChange={
          setEditOpen
        }
        rpv={
          rpv
        }
      />

      <ChangeRpvStatusDialog
        open={
          statusOpen
        }
        onOpenChange={
          setStatusOpen
        }
        rpv={
          rpv
        }
      />

      <RemoveRpvDialog
        open={
          cancelOpen
        }
        onOpenChange={
          setCancelOpen
        }
        rpv={
          rpv
        }
        mode="CANCEL"
      />

      <RemoveRpvDialog
        open={
          deleteOpen
        }
        onOpenChange={
          setDeleteOpen
        }
        rpv={
          rpv
        }
        mode="DELETE"
      />
    </>
  );
}

function EditRpvDialog({
  open,
  onOpenChange,
  rpv,
}: {
  open:
    boolean;

  onOpenChange:
    (
      open: boolean,
    ) => void;

  rpv:
    EditableRpv;
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
    useForm<UpdateRpvFormValues>(
      {
        resolver:
          zodResolver(
            updateRpvFormSchema,
          ),

        defaultValues:
          getEditRpvDefaultValues(
            rpv,
          ),
      },
    );

  const {
    control,
    handleSubmit,
    reset,
  } = form;

  useEffect(
    () => {
      if (!open) {
        return;
      }

      reset(
        getEditRpvDefaultValues(
          rpv,
        ),
      );

      setErrorMessage(
        null,
      );
    },
    [
      open,
      reset,
      rpv,
    ],
  );

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

              formData.set(
                "rpvId",
                rpv.id,
              );

              formData.set(
                "type",
                values.type,
              );

              formData.set(
                "requisitionNumber",
                values.requisitionNumber,
              );

              formData.set(
                "court",
                values.court,
              );

              formData.set(
                "grossAmount",
                String(
                  values.grossAmount,
                ),
              );

              formData.set(
                "contractualFeeRate",
                values.contractualFeeRate >
                  0
                  ? String(
                      values.contractualFeeRate,
                    )
                  : "",
              );

              formData.set(
                "contractualFeeValue",
                values.contractualFeeValue >
                  0
                  ? String(
                      values.contractualFeeValue,
                    )
                  : "",
              );

              formData.set(
                "sucumbencyFeeValue",
                values.sucumbencyFeeValue >
                  0
                  ? String(
                      values.sucumbencyFeeValue,
                    )
                  : "",
              );

              formData.set(
                "expectedPaymentDate",
                values.expectedPaymentDate,
              );

              formData.set(
                "bank",
                values.bank,
              );

              formData.set(
                "notes",
                values.notes,
              );

              await updateRpv(
                formData,
              );

              onOpenChange(
                false,
              );
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
                  : "Não foi possível atualizar a requisição.",
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
        isPending
          ? undefined
          : onOpenChange
      }
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-3xl">
        <DialogHero
          icon={
            Pencil
          }
          eyebrow="Crédito judicial"
          title="Editar RPV ou precatório"
          description="Atualize os dados da requisição e dos honorários vinculados."
          tone="violet"
        />

        <form
          onSubmit={
            submit
          }
          className="space-y-5 px-6 pt-5"
        >
          <FormSection
            icon={
              Landmark
            }
            title="Dados da requisição"
            description="Identificação e informações do crédito judicial."
            tone="violet"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                control={
                  control
                }
                name="type"
                label="Tipo"
                options={
                  typeOptions
                }
              />

              <TextField
                control={
                  control
                }
                name="requisitionNumber"
                label="Número da requisição"
              />

              <TextField
                control={
                  control
                }
                name="court"
                label="Tribunal"
              />

              <CurrencyField
                control={
                  control
                }
                name="grossAmount"
                label="Valor bruto"
              />
            </div>
          </FormSection>

          <FormSection
            icon={
              CircleDollarSign
            }
            title="Honorários"
            description="Configure os honorários contratuais e sucumbenciais relacionados ao crédito."
            tone="violet"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                control={
                  control
                }
                name="contractualFeeRate"
                label="Honorários contratuais (%)"
                type="number"
              />

              <CurrencyField
                control={
                  control
                }
                name="contractualFeeValue"
                label="Honorários contratuais (valor)"
              />

              <CurrencyField
                control={
                  control
                }
                name="sucumbencyFeeValue"
                label="Honorários sucumbenciais"
              />
            </div>
          </FormSection>

          <FormSection
            icon={
              CalendarClock
            }
            title="Previsão e pagamento"
            description="Atualize a previsão e a instituição responsável pelo pagamento."
            tone="blue"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                control={
                  control
                }
                name="expectedPaymentDate"
                label="Previsão de pagamento"
                type="date"
              />

              <TextField
                control={
                  control
                }
                name="bank"
                label="Banco"
              />
            </div>
          </FormSection>

          <FormSection
            icon={
              FileText
            }
            title="Observações"
            description="Informações internas relacionadas a esta requisição."
            tone="neutral"
          >
            <TextareaField
              control={
                control
              }
              name="notes"
              label="Observações"
            />
          </FormSection>

          <ErrorBanner
            message={
              errorMessage
            }
          />

          <DialogActions>
            <button
              type="button"
              disabled={
                isPending
              }
              onClick={() =>
                onOpenChange(
                  false,
                )
              }
              className={secondaryButtonClass}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                isPending
              }
              className={violetButtonClass}
            >
              {isPending
                ? "Salvando..."
                : "Salvar alterações"}
            </button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ChangeRpvStatusDialog({
  open,
  onOpenChange,
  rpv,
}: {
  open:
    boolean;

  onOpenChange:
    (
      open: boolean,
    ) => void;

  rpv:
    EditableRpv;
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
    useForm<UpdateRpvStatusFormValues>(
      {
        resolver:
          zodResolver(
            updateRpvStatusFormSchema,
          ),

        defaultValues: {
          status:
            rpv.status,

          paidAt:
            rpv.paidAt ||
            getTodayInputValue(),
        },
      },
    );

  const {
    control,
    handleSubmit,
    reset,
    watch,
  } = form;

  useEffect(
    () => {
      if (
        !open
      ) {
        return;
      }

      reset({
        status:
          rpv.status,

        paidAt:
          rpv.paidAt ||
          getTodayInputValue(),
      });

      setErrorMessage(
        null,
      );
    },
    [
      open,
      reset,
      rpv,
    ],
  );

  const selectedStatus =
    watch(
      "status",
    );

  const isRegisteringPayment =
    selectedStatus ===
    RpvStatus.PAGA;

  const isReversingPayment =
    rpv.status ===
      RpvStatus.PAGA &&
    selectedStatus !==
      RpvStatus.PAGA;

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

              formData.set(
                "rpvId",
                rpv.id,
              );

              formData.set(
                "status",
                values.status,
              );

              formData.set(
                "paidAt",
                values.status ===
                  RpvStatus.PAGA
                  ? values.paidAt
                  : "",
              );

              await updateRpvStatus(
                formData,
              );

              onOpenChange(
                false,
              );
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
                  : "Não foi possível alterar a situação.",
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
        isPending
          ? undefined
          : onOpenChange
      }
    >
      <DialogContent className="p-0 sm:max-w-lg">
        <DialogHero
          icon={
            isReversingPayment
              ? RotateCcw
              : CalendarClock
          }
          eyebrow="Tramitação da requisição"
          title="Alterar situação"
          description="Atualize a etapa atual da RPV ou do precatório."
          tone={
            isReversingPayment
              ? "amber"
              : "violet"
          }
        />

        <form
          onSubmit={
            submit
          }
          className="space-y-5 px-6 pt-5"
        >
          <RpvSummaryCard
            rpv={
              rpv
            }
            tone="violet"
          />

          <FormSection
            icon={
              CalendarClock
            }
            title="Nova situação"
            description={`Situação atual: ${statusLabels[rpv.status]}.`}
            tone="violet"
          >
            <SelectField
              control={
                control
              }
              name="status"
              label="Situação"
              options={
                statusOptions
              }
            />
          </FormSection>

          {isRegisteringPayment ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/15">
              <div className="mb-4 flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                  <CheckCircle2 className="size-4" />
                </div>

                <div>
                  <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                    Registrar pagamento
                  </p>

                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                    Informe a data em que o
                    crédito foi efetivamente
                    pago.
                  </p>
                </div>
              </div>

              <TextField
                control={
                  control
                }
                name="paidAt"
                label="Data do pagamento"
                type="date"
              />
            </div>
          ) : null}

          {isReversingPayment ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/20">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                  <AlertTriangle className="size-4" />
                </div>

                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-200">
                    Estorno do pagamento
                  </p>

                  <p className="mt-1 text-sm leading-6 text-amber-900/80 dark:text-amber-200/80">
                    Ao retirar a situação de
                    “Paga”, a data de pagamento
                    será removida. As integrações
                    financeiras vinculadas ao
                    pagamento também seguirão a
                    regra de estorno existente.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <ErrorBanner
            message={
              errorMessage
            }
          />

          <DialogActions>
            <button
              type="button"
              disabled={
                isPending
              }
              onClick={() =>
                onOpenChange(
                  false,
                )
              }
              className={secondaryButtonClass}
            >
              Voltar
            </button>

            <button
              type="submit"
              disabled={
                isPending
              }
              className={
                isRegisteringPayment
                  ? emeraldButtonClass
                  : isReversingPayment
                    ? amberButtonClass
                    : violetButtonClass
              }
            >
              {isRegisteringPayment ? (
                <CheckCircle2 className="size-4" />
              ) : isReversingPayment ? (
                <RotateCcw className="size-4" />
              ) : null}

              {isPending
                ? "Salvando..."
                : isRegisteringPayment
                  ? "Confirmar pagamento"
                  : isReversingPayment
                    ? "Confirmar estorno"
                    : "Confirmar alteração"}
            </button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RemoveRpvDialog({
  open,
  onOpenChange,
  rpv,
  mode,
}: {
  open:
    boolean;

  onOpenChange:
    (
      open: boolean,
    ) => void;

  rpv:
    EditableRpv;

  mode:
    RpvRemovalMode;
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

  const isDelete =
    mode ===
    "DELETE";

  function confirm() {
    setErrorMessage(
      null,
    );

    startTransition(
      async () => {
        try {
          const formData =
            new FormData();

          formData.set(
            "rpvId",
            rpv.id,
          );

          formData.set(
            "mode",
            mode,
          );

          await removeRpv(
            formData,
          );

          onOpenChange(
            false,
          );
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
              : "Não foi possível concluir a operação.",
          );
        }
      },
    );
  }

  return (
    <Dialog
      open={
        open
      }
      onOpenChange={
        isPending
          ? undefined
          : onOpenChange
      }
    >
      <DialogContent className="p-0 sm:max-w-lg">
        <DialogHero
          icon={
            isDelete
              ? Trash2
              : Ban
          }
          eyebrow={
            isDelete
              ? "Remoção definitiva"
              : "Histórico financeiro"
          }
          title={
            isDelete
              ? "Excluir requisição"
              : "Cancelar requisição"
          }
          description={
            isDelete
              ? "Remova um registro cadastrado por engano."
              : "Mantenha o registro no histórico, mas marque a requisição como cancelada."
          }
          tone={
            isDelete
              ? "rose"
              : "amber"
          }
        />

        <div className="space-y-5 px-6 pt-5">
          <RpvSummaryCard
            rpv={
              rpv
            }
            tone={
              isDelete
                ? "rose"
                : "amber"
            }
          />

          <div
            className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${
              isDelete
                ? "border-rose-200 bg-rose-50/60 text-rose-900 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-200"
                : "border-amber-200 bg-amber-50/60 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200"
            }`}
          >
            {isDelete
              ? "O registro será removido definitivamente. Use esta opção apenas quando a requisição tiver sido cadastrada por engano."
              : "A requisição permanecerá no histórico, mas passará a constar como cancelada."}
          </div>

          <ErrorBanner
            message={
              errorMessage
            }
          />

          <DialogActions>
            <button
              type="button"
              disabled={
                isPending
              }
              onClick={() =>
                onOpenChange(
                  false,
                )
              }
              className={secondaryButtonClass}
            >
              Voltar
            </button>

            <button
              type="button"
              disabled={
                isPending
              }
              onClick={
                confirm
              }
              className={
                isDelete
                  ? destructiveButtonClass
                  : amberButtonClass
              }
            >
              {isDelete ? (
                <Trash2 className="size-4" />
              ) : (
                <Ban className="size-4" />
              )}

              {isPending
                ? "Processando..."
                : isDelete
                  ? "Excluir definitivamente"
                  : "Confirmar cancelamento"}
            </button>
          </DialogActions>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DialogHero({
  icon: Icon,
  eyebrow,
  title,
  description,
  tone,
}: {
  icon:
    ElementType;

  eyebrow:
    string;

  title:
    string;

  description:
    string;

  tone:
    | "violet"
    | "emerald"
    | "amber"
    | "rose";
}) {
  const styles = {
    violet: {
      container:
        "bg-violet-50/50 dark:bg-violet-950/15",

      icon:
        "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300",

      eyebrow:
        "text-violet-700 dark:text-violet-300",
    },

    emerald: {
      container:
        "bg-emerald-50/50 dark:bg-emerald-950/15",

      icon:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",

      eyebrow:
        "text-emerald-700 dark:text-emerald-300",
    },

    amber: {
      container:
        "bg-amber-50/50 dark:bg-amber-950/15",

      icon:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",

      eyebrow:
        "text-amber-700 dark:text-amber-300",
    },

    rose: {
      container:
        "bg-rose-50/50 dark:bg-rose-950/15",

      icon:
        "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300",

      eyebrow:
        "text-rose-700 dark:text-rose-300",
    },
  }[
    tone
  ];

  return (
    <div
      className={`border-b px-6 py-5 ${styles.container}`}
    >
      <DialogHeader>
        <div className="flex items-start gap-3">
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
          >
            <Icon className="size-5" />
          </div>

          <div>
            <p
              className={`text-xs font-medium uppercase tracking-wider ${styles.eyebrow}`}
            >
              {
                eyebrow
              }
            </p>

            <DialogTitle>
              {
                title
              }
            </DialogTitle>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {
                description
              }
            </p>
          </div>
        </div>
      </DialogHeader>
    </div>
  );
}

function FormSection({
  icon: Icon,
  title,
  description,
  tone,
  children,
}: {
  icon:
    ElementType;

  title:
    string;

  description:
    string;

  tone:
    | "violet"
    | "blue"
    | "neutral";

  children:
    ReactNode;
}) {
  const styles = {
    violet: {
      border:
        "border-violet-200/80 dark:border-violet-900",

      header:
        "bg-violet-50/40 dark:bg-violet-950/10",

      icon:
        "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300",
    },

    blue: {
      border:
        "border-blue-200/80 dark:border-blue-900",

      header:
        "bg-blue-50/40 dark:bg-blue-950/10",

      icon:
        "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300",
    },

    neutral: {
      border:
        "border-border",

      header:
        "bg-muted/20",

      icon:
        "bg-muted text-muted-foreground",
    },
  }[
    tone
  ];

  return (
    <section
      className={`overflow-hidden rounded-2xl border bg-card ${styles.border}`}
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
            <h3 className="font-semibold">
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

function RpvSummaryCard({
  rpv,
  tone,
}: {
  rpv:
    EditableRpv;

  tone:
    | "violet"
    | "amber"
    | "rose";
}) {
  const styles = {
    violet:
      "border-violet-200 bg-violet-50/60 dark:border-violet-900 dark:bg-violet-950/20",

    amber:
      "border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20",

    rose:
      "border-rose-200 bg-rose-50/60 dark:border-rose-900 dark:bg-rose-950/20",
  }[
    tone
  ];

  const valueStyles = {
    violet:
      "text-violet-700 dark:text-violet-300",

    amber:
      "text-amber-700 dark:text-amber-300",

    rose:
      "text-rose-700 dark:text-rose-300",
  }[
    tone
  ];

  return (
    <div
      className={`rounded-2xl border p-4 ${styles}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="size-4 text-muted-foreground" />

            <p className="font-semibold">
              {rpv.type ===
              RpvType.RPV
                ? "RPV"
                : "Precatório"}
            </p>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            {
              statusLabels[
                rpv.status
              ]
            }
          </p>

          {rpv.requisitionNumber ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Requisição:{" "}
              {
                rpv.requisitionNumber
              }
            </p>
          ) : null}
        </div>

        <div className="shrink-0 text-right">
          <CircleDollarSign
            className={`ml-auto size-4 ${valueStyles}`}
          />

          <p
            className={`mt-1 text-xl font-bold tracking-tight ${valueStyles}`}
          >
            {formatMoney(
              rpv.grossAmount,
            )}
          </p>

          <p className="text-[11px] text-muted-foreground">
            crédito bruto
          </p>
        </div>
      </div>
    </div>
  );
}

function ErrorBanner({
  message,
}: {
  message:
    string | null;
}) {
  if (
    !message
  ) {
    return null;
  }

  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      {
        message
      }
    </div>
  );
}

function DialogActions({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <div className="sticky bottom-0 -mx-6 mt-6 flex flex-col-reverse gap-3 border-t bg-background/95 px-6 py-4 backdrop-blur sm:flex-row sm:justify-end">
      {
        children
      }
    </div>
  );
}

const secondaryButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50";

const violetButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-violet-500";

const emeraldButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-emerald-500";

const amberButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-amber-950";

const destructiveButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-destructive px-5 text-sm font-semibold text-destructive-foreground transition hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50";