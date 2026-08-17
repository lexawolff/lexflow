"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
  Wallet,
  Ban,
  AlertTriangle,
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

import { Button } from "@/components/ui/button";

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

import { CurrencyField } from "@/components/forms/currency-field";
import { SelectField } from "@/components/forms/select-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { TextField } from "@/components/forms/text-field";

import { updatePayable } from "../actions/update-payable";

import { registerPayablePayment } from "../actions/register-payable-payment";

import { reversePayablePayment } from "../actions/reverse-payable-payment";

import { removePayable } from "../actions/remove-payable";

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
    value: "DEBITO_AUTOMATICO",
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
          >
            <RotateCcw className="mr-2 size-4" />
            Estornar pagamento
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={!canEdit}
            onClick={() =>
              setEditOpen(true)
            }
          >
            <Pencil className="mr-2 size-4" />
            Editar
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            disabled={!canCancel}
            onClick={() =>
              setCancelOpen(true)
            }
          >
            <Ban className="mr-2 size-4" />
            Cancelar conta
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={!canDelete}
            onClick={() =>
              setDeleteOpen(true)
            }
            className="text-destructive"
          >
            <Trash2 className="mr-2 size-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditPayableDialog
        open={editOpen}
        onOpenChange={
          setEditOpen
        }
        payable={payable}
      />

      <RegisterPayablePaymentDialog
        open={paymentOpen}
        onOpenChange={
          setPaymentOpen
        }
        payable={payable}
      />

      <ReversePayablePaymentDialog
        open={reverseOpen}
        onOpenChange={
          setReverseOpen
        }
        payable={payable}
      />

      <RemovePayableDialog
        open={cancelOpen}
        onOpenChange={
          setCancelOpen
        }
        payable={payable}
        mode="CANCEL"
      />

      <RemovePayableDialog
        open={deleteOpen}
        onOpenChange={
          setDeleteOpen
        }
        payable={payable}
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
    (open: boolean) => void;

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
    reset(defaultValues);
    setErrorMessage(null);
    onOpenChange(false);
  }

  const submit =
    handleSubmit(
      (values) => {
        setErrorMessage(null);

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
            } catch (error) {
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
      open={open}
      onOpenChange={
        isPending
          ? undefined
          : onOpenChange
      }
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Editar conta
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={submit}
          className="space-y-6"
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

          <TextareaField
            control={control}
            name="notes"
            label="Observações"
          />

          {errorMessage ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={
                isPending
              }
              onClick={close}
              className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                isPending
              }
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              {isPending
                ? "Salvando..."
                : "Salvar alterações"}
            </button>
          </div>
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
    (open: boolean) => void;

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
      (values) => {
        setErrorMessage(null);

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
            } catch (error) {
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
      open={open}
      onOpenChange={
        isPending
          ? undefined
          : onOpenChange
      }
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Registrar pagamento
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={submit}
          className="space-y-6"
        >
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="font-medium">
              {
                payable.description
              }
            </p>

            <p className="mt-2 text-2xl font-bold">
              {formatMoney(
                payable.amount,
              )}
            </p>
          </div>

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

          {errorMessage ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
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
              className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={
                isPending
              }
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              {isPending
                ? "Registrando..."
                : "Confirmar pagamento"}
            </button>
          </div>
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
    (open: boolean) => void;

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
    setErrorMessage(null);

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
        } catch (error) {
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
      open={open}
      onOpenChange={
        isPending
          ? undefined
          : onOpenChange
      }
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Estornar pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-yellow-700" />

              <p className="text-sm text-yellow-900">
                A conta voltará para
                Pendente ou Atrasada,
                conforme o vencimento.
                A data e a forma de
                pagamento serão
                removidas.
              </p>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <p className="font-medium">
              {
                payable.description
              }
            </p>

            <p className="mt-2 text-xl font-bold">
              {formatMoney(
                payable.amount,
              )}
            </p>
          </div>

          {errorMessage ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
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
              className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium"
            >
              Voltar
            </button>

            <button
              type="button"
              disabled={
                isPending
              }
              onClick={confirm}
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              <RotateCcw className="mr-2 size-4" />

              {isPending
                ? "Estornando..."
                : "Confirmar estorno"}
            </button>
          </div>
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
    (open: boolean) => void;

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
    mode === "DELETE";

  function confirm() {
    setErrorMessage(null);

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
        } catch (error) {
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
      open={open}
      onOpenChange={
        isPending
          ? undefined
          : onOpenChange
      }
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isDelete
              ? "Excluir conta"
              : "Cancelar conta"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div
            className={`rounded-lg border p-4 ${
              isDelete
                ? "border-destructive/30 bg-destructive/5"
                : "bg-muted/40"
            }`}
          >
            <p className="font-medium">
              {
                payable.description
              }
            </p>

            <p className="mt-2 text-xl font-bold">
              {formatMoney(
                payable.amount,
              )}
            </p>

            <p className="mt-3 text-sm text-muted-foreground">
              {isDelete
                ? "A conta será removida definitivamente. Use esta opção apenas para lançamentos cadastrados por engano."
                : "A conta continuará no histórico financeiro, mas ficará marcada como cancelada."}
            </p>
          </div>

          {errorMessage ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
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
              className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium"
            >
              Voltar
            </button>

            <button
              type="button"
              disabled={
                isPending
              }
              onClick={confirm}
              className={
                isDelete
                  ? "inline-flex items-center rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground"
                  : "inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              }
            >
              {isDelete ? (
                <Trash2 className="mr-2 size-4" />
              ) : (
                <Ban className="mr-2 size-4" />
              )}

              {isPending
                ? "Processando..."
                : isDelete
                  ? "Excluir definitivamente"
                  : "Confirmar cancelamento"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}