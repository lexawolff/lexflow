"use client";

import {
  throwOnFailure,
} from "@/lib/actions/action-result";

import type {
  ElementType,
  ReactNode,
} from "react";

import {
  useState,
  useTransition,
} from "react";

import {
  CalendarDays,
  CircleDollarSign,
  FileText,
  ReceiptText,
} from "lucide-react";

import {
  PayableCategory,
} from "@prisma/client";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import {
  useForm,
} from "react-hook-form";

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
  createPayable,
} from "../actions/create-payable";

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

    setErrorMessage(
      null,
    );

    onCancel?.();
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

              await throwOnFailure(createPayable)(
                formData,
              );

              reset(
                getDefaultValues(),
              );

              onSuccess?.();
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
                  : "Não foi possível cadastrar a conta.",
              );
            }
          },
        );
      },
    );

  return (
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
        title="Identificação"
        description="Informe o que será pago e classifique a despesa."
        tone="rose"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            control={
              control
            }
            name="description"
            label="Descrição"
            placeholder="Ex.: Internet do escritório"
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
        </div>
      </FormSection>

      <FormSection
        icon={
          CircleDollarSign
        }
        title="Valor e vencimento"
        description="Defina o valor da obrigação e a data prevista para pagamento."
        tone="amber"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <CurrencyField
            control={
              control
            }
            name="amount"
            label="Valor"
            placeholder="R$ 0,00"
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

        <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
          <CalendarDays className="mt-0.5 size-4 shrink-0" />

          <p>
            O vencimento será usado para
            identificar automaticamente contas
            pendentes e atrasadas.
          </p>
        </div>
      </FormSection>

      <FormSection
        icon={
          FileText
        }
        title="Observações"
        description="Adicione informações internas relevantes sobre esta conta."
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

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {
            errorMessage
          }
        </div>
      ) : null}

      <div className="sticky bottom-0 -mx-6 mt-6 flex flex-col-reverse gap-3 border-t bg-background/95 px-6 py-4 backdrop-blur sm:flex-row sm:justify-end">
        <button
          type="button"
          disabled={
            isPending
          }
          onClick={
            handleCancel
          }
          className="inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-4 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={
            isPending
          }
          className="inline-flex h-10 items-center justify-center rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-rose-600 dark:hover:bg-rose-500"
        >
          {isPending
            ? "Salvando..."
            : "Salvar conta"}
        </button>
      </div>
    </form>
  );
}

function FormSection({
  icon: Icon,
  title,
  description,
  tone,
  children,
}: {
  icon: ElementType;

  title: string;

  description: string;

  tone:
    | "rose"
    | "amber"
    | "neutral";

  children:
    ReactNode;
}) {
  const styles = {
    rose: {
      container:
        "border-rose-200/80 dark:border-rose-900",

      header:
        "bg-rose-50/50 dark:bg-rose-950/15",

      icon:
        "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300",
    },

    amber: {
      container:
        "border-amber-200/80 dark:border-amber-900",

      header:
        "bg-amber-50/50 dark:bg-amber-950/15",

      icon:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
    },

    neutral: {
      container:
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
      className={`overflow-hidden rounded-2xl border bg-card ${styles.container}`}
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