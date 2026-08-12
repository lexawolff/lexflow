"use client";

import {
  useEffect,
  useState,
  useTransition,
} from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { ReceivableType } from "@prisma/client";
import { addMonths, format } from "date-fns";
import { useForm } from "react-hook-form";

import { CheckboxField } from "@/components/forms/checkbox-field";
import { CurrencyField } from "@/components/forms/currency-field";
import { SelectField } from "@/components/forms/select-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { TextField } from "@/components/forms/text-field";

import { createReceivable } from "../actions/create-receivable";
import {
  createReceivableFormSchema,
  type CreateReceivableFormInput,
  type CreateReceivableFormValues,
} from "../schemas/create-receivable-schema";
import { getReceivableFormDefaultValues } from "../utils/get-receivable-form-default-values";

import { InstallmentsPreview } from "./installments-preview";

export type ReceivableCaseOption = {
  id: string;
  label: string;
};

type CreateReceivableFormProps = {
  clientId: string;
  caseOptions?: ReceivableCaseOption[];
  onSuccess?: () => void;
  onCancel?: () => void;
};

const receivableTypeOptions = [
  {
    label: "Honorários contratuais",
    value:
      ReceivableType.HONORARIO_CONTRATUAL,
  },
  {
    label: "Honorários sucumbenciais",
    value:
      ReceivableType.HONORARIO_SUCUMBENCIAL,
  },
  {
    label: "RPV",
    value: ReceivableType.RPV,
  },
  {
    label: "Acordo",
    value: ReceivableType.ACORDO,
  },
  {
    label: "Consulta",
    value: ReceivableType.CONSULTA,
  },
  {
    label: "Serviço extra",
    value: ReceivableType.SERVICO_EXTRA,
  },
  {
    label: "Outro",
    value: ReceivableType.OUTRO,
  },
];

function parseLocalDate(
  value: string,
): Date | null {
  if (!value) {
    return null;
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(
    year,
    month - 1,
    day,
    12,
  );

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function generateInstallmentDueDates(
  firstDueDate: string,
  totalInstallments: number,
): string[] {
  const parsedDate =
    parseLocalDate(firstDueDate);

  if (
    !parsedDate ||
    totalInstallments < 1
  ) {
    return [];
  }

  return Array.from(
    {
      length: totalInstallments,
    },
    (_, index) =>
      format(
        addMonths(parsedDate, index),
        "yyyy-MM-dd",
      ),
  );
}

export function CreateReceivableForm({
  clientId,
  caseOptions = [],
  onSuccess,
  onCancel,
}: CreateReceivableFormProps) {
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [isPending, startTransition] =
    useTransition();

  const form = useForm<
    CreateReceivableFormInput,
    unknown,
    CreateReceivableFormValues
  >({
    resolver: zodResolver(
      createReceivableFormSchema,
    ),
    defaultValues:
      getReceivableFormDefaultValues(),
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
  } = form;

  const isInstallment = watch(
    "isInstallment",
  );

  const totalAmount = watch(
    "totalAmount",
  );

  const totalInstallments = watch(
    "totalInstallments",
  );

  const dueDate = watch("dueDate");

  const installmentDueDates =
    watch("installmentDueDates") ?? [];

  useEffect(() => {
    if (!isInstallment) {
      setValue("totalInstallments", 1, {
        shouldValidate: true,
      });
    }
  }, [isInstallment, setValue]);

  useEffect(() => {
    const normalizedInstallments =
      isInstallment
        ? Number(totalInstallments) || 0
        : 1;

    const generatedDueDates =
      generateInstallmentDueDates(
        dueDate,
        normalizedInstallments,
      );

    setValue(
      "installmentDueDates",
      generatedDueDates,
      {
        shouldDirty: false,
        shouldValidate: true,
      },
    );
  }, [
    dueDate,
    isInstallment,
    totalInstallments,
    setValue,
  ]);

  function handleInstallmentDueDateChange(
    index: number,
    value: string,
  ) {
    const updatedDueDates = [
      ...installmentDueDates,
    ];

    updatedDueDates[index] = value;

    setValue(
      "installmentDueDates",
      updatedDueDates,
      {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      },
    );
  }

  const submit = handleSubmit(
    (values) => {
      setErrorMessage(null);

      startTransition(async () => {
        try {
          const formData = new FormData();

          formData.set(
            "caseId",
            values.caseId,
          );

          formData.set(
            "description",
            values.description,
          );

          formData.set(
            "type",
            values.type,
          );

          formData.set(
            "totalAmount",
            String(values.totalAmount),
          );

          formData.set(
            "dueDate",
            values.dueDate,
          );

          formData.set(
            "installmentDueDates",
            JSON.stringify(
              values.installmentDueDates,
            ),
          );

          formData.set(
            "isInstallment",
            String(values.isInstallment),
          );

          formData.set(
            "totalInstallments",
            String(
              values.isInstallment
                ? values.totalInstallments
                : 1,
            ),
          );

          formData.set(
            "notes",
            values.notes,
          );

          await createReceivable(
            clientId,
            formData,
          );

          reset(
            getReceivableFormDefaultValues(),
          );

          onSuccess?.();
        } catch (error) {
          console.error(error);

          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Não foi possível salvar o recebimento.",
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
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          control={control}
          name="description"
          label="Descrição"
          placeholder="Ex.: Honorários do processo"
        />

        <SelectField
          control={control}
          name="type"
          label="Tipo"
          options={receivableTypeOptions}
        />

        {caseOptions.length > 0 ? (
          <SelectField
            control={control}
            name="caseId"
            label="Processo relacionado"
            placeholder="Nenhum processo"
            options={caseOptions.map(
              (item) => ({
                label: item.label,
                value: item.id,
              }),
            )}
          />
        ) : null}

        <CurrencyField
          control={control}
          name="totalAmount"
          label="Valor total"
          placeholder="R$ 0,00"
        />

        <TextField
          control={control}
          name="dueDate"
          label={
            isInstallment
              ? "Primeiro vencimento"
              : "Vencimento"
          }
          type="date"
        />

        {isInstallment ? (
          <TextField
            control={control}
            name="totalInstallments"
            label="Quantidade de parcelas"
            type="number"
          />
        ) : null}
      </div>

      <CheckboxField
        control={control}
        name="isInstallment"
        label="Pagamento parcelado"
        description="Cria uma cobrança individual para cada parcela."
      />

      <TextareaField
        control={control}
        name="notes"
        label="Observações"
      />

      <InstallmentsPreview
        totalAmount={
          Number(totalAmount) || 0
        }
        totalInstallments={
          isInstallment
            ? Number(totalInstallments) || 1
            : 1
        }
        firstDueDate={dueDate}
        installmentDueDates={
          installmentDueDates
        }
        onDueDateChange={
          handleInstallmentDueDateChange
        }
        disabled={isPending}
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
          disabled={isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending
            ? "Salvando..."
            : "Salvar recebimento"}
        </button>
      </div>
    </form>
  );
}