"use client";

import {
  useState,
  useTransition,
} from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import type { Receivable } from "@prisma/client";
import { useForm } from "react-hook-form";

import { CurrencyField } from "@/components/forms/currency-field";
import { TextField } from "@/components/forms/text-field";

import { registerPayment } from "../actions/register-payment";
import {
  registerPaymentFormSchema,
  type RegisterPaymentFormValues,
} from "../schemas/register-payment-form-schema";

type RegisterPaymentFormProps = {
  receivable: Receivable;
  onSuccess?: () => void;
  onCancel?: () => void;
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getToday() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(date.getDate()).padStart(
    2,
    "0",
  );

  return `${year}-${month}-${day}`;
}

export function RegisterPaymentForm({
  receivable,
  onSuccess,
  onCancel,
}: RegisterPaymentFormProps) {
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [isPending, startTransition] =
    useTransition();

  const totalAmount = Number(
    receivable.totalAmount,
  );

  const paidAmount = Number(
    receivable.paidAmount,
  );

  const remainingAmount =
    totalAmount - paidAmount;

  const form = useForm<RegisterPaymentFormValues>({
    resolver: zodResolver(
      registerPaymentFormSchema,
    ),
    defaultValues: {
      amount: remainingAmount,
      paidAt: getToday(),
    },
  });

  const {
    control,
    handleSubmit,
    reset,
  } = form;

  const submit = handleSubmit((values) => {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const formData = new FormData();

        formData.set(
          "receivableId",
          receivable.id,
        );

        formData.set(
          "amount",
          String(values.amount),
        );

        formData.set(
          "paidAt",
          values.paidAt,
        );

        await registerPayment(formData);

        reset({
          amount: remainingAmount,
          paidAt: getToday(),
        });

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
  });

  return (
    <form
      onSubmit={submit}
      className="space-y-6"
    >
      <div className="space-y-2 rounded-lg border p-4 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">
            Valor total
          </span>

          <span className="font-medium">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">
            Já recebido
          </span>

          <span className="font-medium">
            {formatCurrency(paidAmount)}
          </span>
        </div>

        <div className="flex justify-between gap-4 border-t pt-2">
          <span className="font-medium">
            Saldo restante
          </span>

          <span className="font-semibold">
            {formatCurrency(remainingAmount)}
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CurrencyField
          control={control}
          name="amount"
          label="Valor recebido"
          placeholder="R$ 0,00"
        />

        <TextField
          control={control}
          name="paidAt"
          label="Data do pagamento"
          type="date"
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
        {onCancel ? (
          <button
            type="button"
            disabled={isPending}
            onClick={onCancel}
            className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
        ) : null}

        <button
          type="submit"
          disabled={
            isPending || remainingAmount <= 0
          }
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending
            ? "Registrando..."
            : "Registrar pagamento"}
        </button>
      </div>
    </form>
  );
}