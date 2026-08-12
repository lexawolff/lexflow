"use client";

import {
  useState,
  useTransition,
} from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  FinancialStatus,
  ReceivableType,
} from "@prisma/client";
import { useForm } from "react-hook-form";

import { CurrencyField } from "@/components/forms/currency-field";
import { SelectField } from "@/components/forms/select-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { TextField } from "@/components/forms/text-field";

import { updateReceivable } from "../actions/update-receivable";
import {
  updateReceivableFormSchema,
  type UpdateReceivableFormValues,
} from "../schemas/update-receivable-schema";

import type { ReceivableCaseOption } from "./create-receivable-form";

export type EditableReceivable = {
  id: string;

  caseId: string | null;

  description: string;

  type: ReceivableType;

  totalAmount: number;

  dueDate: string;

  notes: string;

  status: FinancialStatus;

  installmentGroupId: string | null;

  installmentNumber: number | null;

  totalInstallments: number | null;
};

type EditReceivableFormProps = {
  receivable: EditableReceivable;

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

function getDefaultValues(
  receivable: EditableReceivable,
): UpdateReceivableFormValues {
  return {
    caseId:
      receivable.caseId ?? "",

    description:
      receivable.description,

    type:
      receivable.type,

    totalAmount:
      receivable.totalAmount,

    dueDate:
      receivable.dueDate,

    notes:
      receivable.notes,
  };
}

export function EditReceivableForm({
  receivable,
  caseOptions = [],
  onSuccess,
  onCancel,
}: EditReceivableFormProps) {
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [isPending, startTransition] =
    useTransition();

  const form =
    useForm<UpdateReceivableFormValues>({
      resolver: zodResolver(
        updateReceivableFormSchema,
      ),

      defaultValues:
        getDefaultValues(receivable),
    });

  const {
    control,
    handleSubmit,
    reset,
  } = form;

  function handleCancel() {
    reset(
      getDefaultValues(receivable),
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
            receivable.id,
          );

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
            String(
              values.totalAmount,
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

          await updateReceivable(
            formData,
          );

          reset(
            getDefaultValues({
              ...receivable,
              ...values,
            }),
          );

          onSuccess?.();
        } catch (error) {
          console.error(error);

          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Não foi possível atualizar o recebimento.",
          );
        }
      });
    },
  );

  const isInstallment =
    Boolean(
      receivable.installmentGroupId &&
        receivable.installmentNumber &&
        receivable.totalInstallments,
    );

  return (
    <form
      onSubmit={submit}
      className="space-y-6"
    >
      {isInstallment ? (
        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="text-sm font-medium">
            Parcela{" "}
            {
              receivable.installmentNumber
            }
            /
            {
              receivable.totalInstallments
            }
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Esta edição altera somente
            esta parcela. As demais
            parcelas do recebimento não
            serão modificadas.
          </p>
        </div>
      ) : null}

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
          options={
            receivableTypeOptions
          }
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
            ? "Salvando..."
            : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}