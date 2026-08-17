"use client";

import {
  useState,
  useTransition,
} from "react";

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
  createRpv,
} from "../actions/create-rpv";

import {
  createRpvFormSchema,
  type CreateRpvFormValues,
} from "../schemas/create-rpv-schema";

import type {
  OfficeRpvCaseOption,
} from "../types/office-rpv";

type Props = {
  cases:
    OfficeRpvCaseOption[];

  onSuccess?:
    () => void;

  onCancel?:
    () => void;
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

function getDefaultValues(): CreateRpvFormValues {
  return {
    caseId:
      "",

    type:
      RpvType.RPV,

    requisitionNumber:
      "",

    court:
      "",

    grossAmount:
      0,

    contractualFeeRate:
      30,

    contractualFeeValue:
      0,

    sucumbencyFeeValue:
      0,

    expectedPaymentDate:
      "",

    paidAt:
      "",

    bank:
      "",

    status:
      RpvStatus.AGUARDANDO_EXPEDICAO,

    notes:
      "",
  };
}

export function CreateRpvForm({
  cases,
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
    useForm<CreateRpvFormValues>(
      {
        resolver:
          zodResolver(
            createRpvFormSchema,
          ),

        defaultValues:
          getDefaultValues(),
      },
    );

  const {
    control,
    handleSubmit,
    reset,
    watch,
  } = form;

  const status =
    watch(
      "status",
    );

  function handleCancel() {
    reset(
      getDefaultValues(),
    );

    setErrorMessage(
      null,
    );

    onCancel?.();
  }

  const caseOptions =
    cases.map(
      (clientCase) => ({
        label:
          clientCase.label,

        value:
          clientCase.id,
      }),
    );

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

              formData.set(
                "caseId",
                values.caseId,
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
                "paidAt",
                values.paidAt,
              );

              formData.set(
                "bank",
                values.bank,
              );

              formData.set(
                "status",
                values.status,
              );

              formData.set(
                "notes",
                values.notes,
              );

              await createRpv(
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
                  : "Não foi possível cadastrar a requisição.",
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
      className="space-y-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <SelectField
            control={
              control
            }
            name="caseId"
            label="Processo"
            options={
              caseOptions
            }
          />
        </div>

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

        <TextField
          control={
            control
          }
          name="requisitionNumber"
          label="Número da requisição"
          placeholder="Número da RPV ou precatório"
        />

        <TextField
          control={
            control
          }
          name="court"
          label="Tribunal"
          placeholder="Ex.: TRF2, TJES"
        />

        <CurrencyField
          control={
            control
          }
          name="grossAmount"
          label="Valor bruto"
        />

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

        <TextField
          control={
            control
          }
          name="expectedPaymentDate"
          label="Previsão de pagamento"
          type="date"
        />

        {status ===
        RpvStatus.PAGA ? (
          <TextField
            control={
              control
            }
            name="paidAt"
            label="Data do pagamento"
            type="date"
          />
        ) : null}

        <TextField
          control={
            control
          }
          name="bank"
          label="Banco"
          placeholder="Banco responsável pelo pagamento"
        />
      </div>

      <TextareaField
        control={
          control
        }
        name="notes"
        label="Observações"
      />

      <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-200">
        Se você informar apenas o
        percentual dos honorários
        contratuais, o LexFlow
        calculará o valor
        automaticamente. Se informar
        também um valor específico,
        esse valor será utilizado.
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
          disabled={
            isPending
          }
          onClick={
            handleCancel
          }
          className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={
            isPending
          }
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending
            ? "Salvando..."
            : "Salvar requisição"}
        </button>
      </div>
    </form>
  );
}