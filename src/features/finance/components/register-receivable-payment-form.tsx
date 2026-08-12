"use client";

import {
  useState,
  useTransition,
} from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { SelectField } from "@/components/forms/select-field";
import { TextField } from "@/components/forms/text-field";

import { registerReceivablePayment } from "../actions/register-receivable-payment";
import {
  registerReceivablePaymentFormSchema,
  type RegisterReceivablePaymentFormValues,
} from "../schemas/register-receivable-payment-schema";

type RegisterReceivablePaymentFormProps = {
  receivableId: string;

  description: string;

  totalAmount: number;

  onSuccess?: () => void;

  onCancel?: () => void;
};

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
    label: "Outro",
    value: "OUTRO",
  },
];

function getTodayInputValue(): string {
  const today = new Date();

  const year =
    today.getFullYear();

  const month = String(
    today.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    today.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

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

function getDefaultValues(): RegisterReceivablePaymentFormValues {
  return {
    receivedAt:
      getTodayInputValue(),

    paymentMethod: "PIX",
  };
}

export function RegisterReceivablePaymentForm({
  receivableId,
  description,
  totalAmount,
  onSuccess,
  onCancel,
}: RegisterReceivablePaymentFormProps) {
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [isPending, startTransition] =
    useTransition();

  const form =
    useForm<RegisterReceivablePaymentFormValues>(
      {
        resolver: zodResolver(
          registerReceivablePaymentFormSchema,
        ),

        defaultValues:
          getDefaultValues(),
      },
    );

  const {
    control,
    handleSubmit,
    reset,
  } = form;

  function handleCancel() {
    reset(
      getDefaultValues(),
    );

    setErrorMessage(null);

    onCancel?.();
  }

  const submit = handleSubmit(
    (values) => {
      setErrorMessage(null);

      startTransition(async () => {
        try {
          const formData =
            new FormData();

          formData.set(
            "receivableId",
            receivableId,
          );

          formData.set(
            "receivedAt",
            values.receivedAt,
          );

          formData.set(
            "paymentMethod",
            values.paymentMethod,
          );

          await registerReceivablePayment(
            formData,
          );

          reset(
            getDefaultValues(),
          );

          onSuccess?.();
        } catch (error) {
          console.error(error);

          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Não foi possível registrar o pagamento.",
          );
        }
      });
    },
  );

  return (
    <form
      onSubmit={submit}
      className="space-y-6"
    >
      <div className="rounded-lg border bg-muted/40 p-4">
        <p className="text-sm font-medium">
          {description}
        </p>

        <p className="mt-2 text-2xl font-bold">
          {formatMoney(totalAmount)}
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          O recebimento será marcado
          integralmente como pago.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          control={control}
          name="receivedAt"
          label="Data do recebimento"
          type="date"
        />

        <SelectField
          control={control}
          name="paymentMethod"
          label="Forma de pagamento"
          options={
            paymentMethodOptions
          }
        />
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      ) : null}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          disabled={isPending}
          onClick={handleCancel}
          className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending
            ? "Registrando..."
            : "Confirmar pagamento"}
        </button>
      </div>
    </form>
  );
}