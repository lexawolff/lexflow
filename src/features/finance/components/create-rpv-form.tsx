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
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Landmark,
  Scale,
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
      (
        clientCase,
      ) => ({
        label:
          clientCase.label,

        value:
          clientCase.id,
      }),
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

              await throwOnFailure(createRpv)(
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
      className="space-y-5 px-6 pt-5"
    >
      <FormSection
        icon={
          Scale
        }
        title="Vínculo e identificação"
        description="Vincule a requisição à caso e informe seus dados principais."
        tone="violet"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <SelectField
              control={
                control
              }
              name="caseId"
              label="Caso"
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
        </div>
      </FormSection>

      <FormSection
        icon={
          CircleDollarSign
        }
        title="Crédito e honorários"
        description="Informe o crédito bruto e os honorários relacionados à requisição."
        tone="violet"
      >
        <div className="grid gap-4 md:grid-cols-2">
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
        </div>

        <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/60 px-4 py-3 text-sm leading-6 text-violet-900 dark:border-violet-900 dark:bg-violet-950/20 dark:text-violet-200">
          Se você informar apenas o
          percentual dos honorários
          contratuais, o LexFlow calculará
          o valor automaticamente. Se
          informar também um valor
          específico, esse valor será
          utilizado.
        </div>
      </FormSection>

      <FormSection
        icon={
          Landmark
        }
        title="Previsão e pagamento"
        description="Acompanhe quando e por qual instituição o crédito será disponibilizado."
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
            placeholder="Banco responsável pelo pagamento"
          />
        </div>

        {status ===
        RpvStatus.PAGA ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/15">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                <CheckCircle2 className="size-4" />
              </div>

              <div>
                <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                  Pagamento realizado
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
      </FormSection>

      <FormSection
        icon={
          FileText
        }
        title="Observações"
        description="Registre informações internas relevantes sobre a requisição."
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
            : "Salvar requisição"}
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
        "bg-violet-50/50 dark:bg-violet-950/15",

      icon:
        "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300",
    },

    blue: {
      border:
        "border-blue-200/80 dark:border-blue-900",

      header:
        "bg-blue-50/50 dark:bg-blue-950/15",

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

const secondaryButtonClass =
  "inline-flex h-10 items-center justify-center rounded-xl border border-input bg-background px-4 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50";

const violetButtonClass =
  "inline-flex h-10 items-center justify-center rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-violet-500";