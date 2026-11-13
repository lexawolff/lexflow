"use client";

import type {
  ElementType,
  ReactNode,
} from "react";

import {
  useState,
  useTransition,
} from "react";

import {
  AlertTriangle,
  Ban,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  MoreHorizontal,
  Pencil,
  ReceiptText,
  RotateCcw,
  Trash2,
  Wallet,
} from "lucide-react";

import {
  PayableCategory,
  type FinancialStatus,
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
  updatePayable,
} from "../actions/update-payable";

import {
  registerPayablePayment,
} from "../actions/register-payable-payment";

import {
  reversePayablePayment,
} from "../actions/reverse-payable-payment";

import {
  removePayable,
} from "../actions/remove-payable";

import {
  registerPayablePaymentFormSchema,
  updatePayableFormSchema,
  type PayableRemovalMode,
  type RegisterPayablePaymentFormValues,
  type UpdatePayableFormValues,
} from "../schemas/payable-actions-schema";

export type EditablePayable = {
  id: string;

  description: string;

  category:
    PayableCategory;

  amount: number;

  dueDate: string;

  paidAt: string;

  status:
    FinancialStatus;

  paymentMethod:
    string | null;

  notes: string;
};

type Props = {
  payable:
    EditablePayable;
};

const categoryOptions = [
  {
    label: "Aluguel",
    value:
      PayableCategory.ALUGUEL,
  },

  {
    label: "Salário",
    value:
      PayableCategory.SALARIO,
  },

  {
    label: "Imposto",
    value:
      PayableCategory.IMPOSTO,
  },

  {
    label: "Software",
    value:
      PayableCategory.SOFTWARE,
  },

  {
    label: "Marketing",
    value:
      PayableCategory.MARKETING,
  },

  {
    label:
      "Material de escritório",
    value:
      PayableCategory.MATERIAL_ESCRITORIO,
  },

  {
    label: "Custas",
    value:
      PayableCategory.CUSTAS,
  },

  {
    label: "Outro",
    value:
      PayableCategory.OUTRO,
  },
];

const paymentMethodOptions = [
  {
    label: "PIX",
    value: "PIX",
  },

  {
    label: "Dinheiro",
    value: "DINHEIRO",
  },

  {
    label: "Cartão",
    value: "CARTAO",
  },

  {
    label: "Transferência",
    value: "TRANSFERENCIA",
  },

  {
    label: "Depósito",
    value: "DEPOSITO",
  },

  {
    label: "Boleto",
    value: "BOLETO",
  },

  {
    label: "Débito automático",
    value:
      "DEBITO_AUTOMATICO",
  },

  {
    label: "Outro",
    value: "OUTRO",
  },
];

function formatMoney(
  value: number,
): string {
  return value.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  );
}

function getTodayInputValue(): string {
  const formatter =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Sao_Paulo",

        year: "numeric",

        month: "2-digit",

        day: "2-digit",
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

export function PayableActionsMenu({
  payable,
}: Props) {
  const [
    editOpen,
    setEditOpen,
  ] =
    useState(false);

  const [
    paymentOpen,
    setPaymentOpen,
  ] =
    useState(false);

  const [
    reverseOpen,
    setReverseOpen,
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

  const canRegisterPayment =
    payable.status !==
      "PAGO" &&
    payable.status !==
      "CANCELADO";

  const canReverse =
    payable.status ===
    "PAGO";

  const canEdit =
    payable.status !==
    "CANCELADO";

  const canCancel =
    payable.status !==
      "PAGO" &&
    payable.status !==
      "PARCIAL" &&
    payable.status !==
      "CANCELADO";

  const canDelete =
    payable.status !==
      "PAGO" &&
    payable.status !==
      "PARCIAL";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Ações da conta"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          }
        />

        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={
              !canRegisterPayment
            }
            onClick={() =>
              setPaymentOpen(
                true,
              )
            }
            className="text-emerald-700 focus:text-emerald-700 dark:text-emerald-300 dark:focus:text-emerald-300"
          >
            <Wallet className="mr-2 size-4" />

            Registrar pagamento
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={
              !canReverse
            }
            onClick={() =>
              setReverseOpen(
                true,
              )
            }
            className="text-amber-700 focus:text-amber-700 dark:text-amber-300 dark:focus:text-amber-300"
          >
            <RotateCcw className="mr-2 size-4" />

            Estornar pagamento
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={
              !canEdit
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
              !canCancel
            }
            onClick={() =>
              setCancelOpen(
                true,
              )
            }
            className="text-amber-700 focus:text-amber-700 dark:text-amber-300 dark:focus:text-amber-300"
          >
            <Ban className="mr-2 size-4" />

            Cancelar conta
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={
              !canDelete
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

      <EditPayableDialog
        open={
          editOpen
        }
        onOpenChange={
          setEditOpen
        }
        payable={
          payable
        }
      />

      <RegisterPayablePaymentDialog
        open={
          paymentOpen
        }
        onOpenChange={
          setPaymentOpen
        }
        payable={
          payable
        }
      />

      <ReversePayablePaymentDialog
        open={
          reverseOpen
        }
        onOpenChange={
          setReverseOpen
        }
        payable={
          payable
        }
      />

      <RemovePayableDialog
        open={
          cancelOpen
        }
        onOpenChange={
          setCancelOpen
        }
        payable={
          payable
        }
        mode="CANCEL"
      />

      <RemovePayableDialog
        open={
          deleteOpen
        }
        onOpenChange={
          setDeleteOpen
        }
        payable={
          payable
        }
        mode="DELETE"
      />
    </>
  );
}

function EditPayableDialog({
  open,
  onOpenChange,
  payable,
}: {
  open: boolean;

  onOpenChange:
    (
      open: boolean,
    ) => void;

  payable:
    EditablePayable;
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

  const defaultValues: UpdatePayableFormValues =
    {
      description:
        payable.description,

      category:
        payable.category,

      amount:
        payable.amount,

      dueDate:
        payable.dueDate,

      notes:
        payable.notes,
    };

  const form =
    useForm<UpdatePayableFormValues>(
      {
        resolver:
          zodResolver(
            updatePayableFormSchema,
          ),

        defaultValues,
      },
    );

  const {
    control,
    handleSubmit,
    reset,
  } = form;

  function close() {
    reset(
      defaultValues,
    );

    setErrorMessage(
      null,
    );

    onOpenChange(
      false,
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

              formData.set(
                "payableId",
                payable.id,
              );

              formData.set(
                "description",
                values.description,
              );

              formData.set(
                "category",
                values.category,
              );

              formData.set(
                "amount",
                String(
                  values.amount,
                ),
              );

              formData.set(
                "dueDate",
                values.dueDate,
              );

              formData.set(
                "notes",
                values.notes,
              );

              await updatePayable(
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
                  : "Não foi possível atualizar a conta.",
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
      <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-2xl">
        <DialogHero
          icon={
            Pencil
          }
          eyebrow="Despesas do escritório"
          title="Editar conta"
          description="Atualize as informações do lançamento financeiro."
          tone="rose"
        />

        <form
          onSubmit={
            submit
          }
          className="space-y-5 px-6 pt-5"
        >
          <FormSection
            icon={
              ReceiptText
            }
            title="Dados da conta"
            description="Descrição, categoria, valor e vencimento."
            tone="rose"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                control={
                  control
                }
                name="description"
                label="Descrição"
              />

              <SelectField
                control={
                  control
                }
                name="category"
                label="Categoria"
                options={
                  categoryOptions
                }
              />

              <CurrencyField
                control={
                  control
                }
                name="amount"
                label="Valor"
              />

              <TextField
                control={
                  control
                }
                name="dueDate"
                label="Vencimento"
                type="date"
              />
            </div>
          </FormSection>

          <FormSection
            icon={
              FileText
            }
            title="Observações"
            description="Informações internas relacionadas a esta despesa."
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
              onClick={
                close
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
              className={roseButtonClass}
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

function RegisterPayablePaymentDialog({
  open,
  onOpenChange,
  payable,
}: {
  open: boolean;

  onOpenChange:
    (
      open: boolean,
    ) => void;

  payable:
    EditablePayable;
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
    useForm<RegisterPayablePaymentFormValues>(
      {
        resolver:
          zodResolver(
            registerPayablePaymentFormSchema,
          ),

        defaultValues: {
          paidAt:
            getTodayInputValue(),

          paymentMethod:
            "PIX",
        },
      },
    );

  const {
    control,
    handleSubmit,
  } = form;

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
                "payableId",
                payable.id,
              );

              formData.set(
                "paidAt",
                values.paidAt,
              );

              formData.set(
                "paymentMethod",
                values.paymentMethod,
              );

              await registerPayablePayment(
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
                  : "Não foi possível registrar o pagamento.",
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
            CheckCircle2
          }
          eyebrow="Baixa financeira"
          title="Registrar pagamento"
          description="Confirme quando e como esta despesa foi paga."
          tone="emerald"
        />

        <form
          onSubmit={
            submit
          }
          className="space-y-5 px-6 pt-5"
        >
          <PayableSummaryCard
            payable={
              payable
            }
            tone="emerald"
          />

          <FormSection
            icon={
              CalendarDays
            }
            title="Dados do pagamento"
            description="Informe a data e a forma utilizada no pagamento."
            tone="emerald"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                control={
                  control
                }
                name="paidAt"
                label="Data do pagamento"
                type="date"
              />

              <SelectField
                control={
                  control
                }
                name="paymentMethod"
                label="Forma de pagamento"
                options={
                  paymentMethodOptions
                }
              />
            </div>
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
              className={emeraldButtonClass}
            >
              <CheckCircle2 className="size-4" />

              {isPending
                ? "Registrando..."
                : "Confirmar pagamento"}
            </button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReversePayablePaymentDialog({
  open,
  onOpenChange,
  payable,
}: {
  open: boolean;

  onOpenChange:
    (
      open: boolean,
    ) => void;

  payable:
    EditablePayable;
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
            "payableId",
            payable.id,
          );

          await reversePayablePayment(
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
              : "Não foi possível estornar o pagamento.",
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
            RotateCcw
          }
          eyebrow="Reversão financeira"
          title="Estornar pagamento"
          description="O registro de pagamento será removido desta conta."
          tone="amber"
        />

        <div className="space-y-5 px-6 pt-5">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/20">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                <AlertTriangle className="size-4" />
              </div>

              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  O que acontecerá?
                </p>

                <p className="mt-1 text-sm leading-6 text-amber-900/80 dark:text-amber-200/80">
                  A conta voltará para
                  Pendente ou Atrasada,
                  conforme o vencimento.
                  A data e a forma de
                  pagamento serão removidas.
                </p>
              </div>
            </div>
          </div>

          <PayableSummaryCard
            payable={
              payable
            }
            tone="amber"
          />

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
              className={amberButtonClass}
            >
              <RotateCcw className="size-4" />

              {isPending
                ? "Estornando..."
                : "Confirmar estorno"}
            </button>
          </DialogActions>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RemovePayableDialog({
  open,
  onOpenChange,
  payable,
  mode,
}: {
  open: boolean;

  onOpenChange:
    (
      open: boolean,
    ) => void;

  payable:
    EditablePayable;

  mode:
    PayableRemovalMode;
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
            "payableId",
            payable.id,
          );

          formData.set(
            "mode",
            mode,
          );

          await removePayable(
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
              ? "Excluir conta"
              : "Cancelar conta"
          }
          description={
            isDelete
              ? "Remova definitivamente um lançamento cadastrado por engano."
              : "Mantenha o lançamento no histórico, mas retire-o das obrigações ativas."
          }
          tone={
            isDelete
              ? "rose"
              : "amber"
          }
        />

        <div className="space-y-5 px-6 pt-5">
          <PayableSummaryCard
            payable={
              payable
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
              ? "A conta será removida definitivamente. Use esta opção apenas para lançamentos cadastrados por engano."
              : "A conta continuará no histórico financeiro, mas ficará marcada como cancelada."}
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
    | "rose"
    | "emerald"
    | "amber";
}) {
  const styles = {
    rose: {
      container:
        "bg-rose-50/50 dark:bg-rose-950/15",

      icon:
        "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300",

      eyebrow:
        "text-rose-700 dark:text-rose-300",
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
    | "rose"
    | "emerald"
    | "neutral";

  children:
    ReactNode;
}) {
  const styles = {
    rose: {
      border:
        "border-rose-200/80 dark:border-rose-900",

      header:
        "bg-rose-50/40 dark:bg-rose-950/10",

      icon:
        "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300",
    },

    emerald: {
      border:
        "border-emerald-200/80 dark:border-emerald-900",

      header:
        "bg-emerald-50/40 dark:bg-emerald-950/10",

      icon:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
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

function PayableSummaryCard({
  payable,
  tone,
}: {
  payable:
    EditablePayable;

  tone:
    | "rose"
    | "emerald"
    | "amber";
}) {
  const styles = {
    rose:
      "border-rose-200 bg-rose-50/60 dark:border-rose-900 dark:bg-rose-950/20",

    emerald:
      "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20",

    amber:
      "border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20",
  }[
    tone
  ];

  const valueStyles = {
    rose:
      "text-rose-700 dark:text-rose-300",

    emerald:
      "text-emerald-700 dark:text-emerald-300",

    amber:
      "text-amber-700 dark:text-amber-300",
  }[
    tone
  ];

  return (
    <div
      className={`rounded-2xl border p-4 ${styles}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ReceiptText className="size-4 shrink-0 text-muted-foreground" />

            <p className="truncate font-semibold">
              {
                payable.description
              }
            </p>
          </div>

          {payable.dueDate ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" />

              Vencimento:{" "}
              {
                payable.dueDate
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
              payable.amount,
            )}
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

const roseButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-rose-500";

const emeraldButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-emerald-500";

const amberButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-amber-950";

const destructiveButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-destructive px-5 text-sm font-semibold text-destructive-foreground transition hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50";