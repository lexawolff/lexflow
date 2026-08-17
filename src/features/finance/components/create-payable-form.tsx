"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  PayableCategory,
} from "@prisma/client";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import {
  useForm,
} from "react-hook-form";

import { CurrencyField } from "@/components/forms/currency-field";
import { SelectField } from "@/components/forms/select-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { TextField } from "@/components/forms/text-field";

import { createPayable } from "../actions/create-payable";

import {
  createPayableFormSchema,
  type CreatePayableFormValues,
} from "../schemas/create-payable-schema";

type Props = {
  onSuccess?: () => void;

  onCancel?: () => void;
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

function getDefaultValues(): CreatePayableFormValues {
  return {
    description: "",

    category:
      PayableCategory.OUTRO,

    amount: 0,

    dueDate: "",

    notes: "",
  };
}

export function CreatePayableForm({
  onSuccess,
  onCancel,
}: Props) {
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
    useForm<CreatePayableFormValues>(
      {
        resolver:
          zodResolver(
            createPayableFormSchema,
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

              await createPayable(
                formData,
              );

              reset(
                getDefaultValues(),
              );

              onSuccess?.();
            } catch (error) {
              console.error(
                error,
              );

              setErrorMessage(
                error instanceof
                  Error
                  ? error.message
                  : "Não foi possível cadastrar a conta.",
              );
            }
          },
        );
      },
    );

  return (
    <form
      onSubmit={submit}
      className="space-y-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          control={control}
          name="description"
          label="Descrição"
          placeholder="Ex.: Internet do escritório"
        />

        <SelectField
          control={control}
          name="category"
          label="Categoria"
          options={
            categoryOptions
          }
        />

        <CurrencyField
          control={control}
          name="amount"
          label="Valor"
          placeholder="R$ 0,00"
        />

        <TextField
          control={control}
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
          disabled={
            isPending
          }
          onClick={
            handleCancel
          }
          className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={
            isPending
          }
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending
            ? "Salvando..."
            : "Salvar conta"}
        </button>
      </div>
    </form>
  );
}