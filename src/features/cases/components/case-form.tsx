"use client";

import {
  useForm,
} from "react-hook-form";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import {
  AlertCircle,
} from "lucide-react";

import {
  TextField,
} from "@/components/forms/text-field";

import {
  TextareaField,
} from "@/components/forms/textarea-field";

import {
  SelectField,
} from "@/components/forms/select-field";

import {
  createCase,
} from "../actions/create-case";

import {
  updateCase,
} from "../actions/update-case";

import {
  notifyActionFailure,
} from "@/lib/actions/action-feedback";

import {
  ADMINISTRATIVE_STATUS_OPTIONS,
  CASE_ORIGIN_OPTIONS,
  CASE_STATUS_OPTIONS,
  PRACTICE_AREA_OPTIONS,
} from "../constants";

import {
  caseSchema,
  type CaseFormValues,
} from "../schemas/case-schema";

import {
  getCaseFormDefaultValues,
  type CaseFormSource,
} from "../utils/get-case-form-default-values";

type CaseFormProps = {
  clientId:
    string;

  case?:
    CaseFormSource & {
      id:
        string;
    };
};

export function CaseForm({
  clientId,
  case: caseData,
}: CaseFormProps) {
  const form =
    useForm<CaseFormValues>({
      resolver:
        zodResolver(
          caseSchema,
        ),

      defaultValues:
        getCaseFormDefaultValues(
          caseData,
        ),
    });

  const action =
    caseData
      ? updateCase.bind(
          null,
          caseData.id,
        )
      : createCase.bind(
          null,
          clientId,
        );

  const {
    control,
    handleSubmit,

    formState: {
      errors,
      isSubmitting,
    },
  } =
    form;

  /*
   * Antes o formulário utilizava
   * diretamente:
   *
   * <form action={action}>
   *
   * Isso fazia o servidor receber
   * os dados antes que o resolver
   * do react-hook-form pudesse
   * mostrar os erros nos campos.
   *
   * Agora a validação ocorre primeiro
   * no navegador e somente depois a
   * Server Action é executada.
   */
  const submit =
    handleSubmit(
      async (
        _values,
        event,
      ) => {
        const formElement =
          event
            ?.currentTarget as
            | HTMLFormElement
            | undefined;

        if (!formElement) {
          return;
        }

        const formData =
          new FormData(
            formElement,
          );

        /*
         * Sucesso: a action redireciona.
         * Falha: mostramos o motivo.
         */
        notifyActionFailure(
          await action(
            formData,
          ),
        );
      },
    );

  const hasErrors =
    Object.keys(
      errors,
    ).length >
    0;

  return (
    <form
      onSubmit={
        submit
      }
      className="space-y-8"
    >
      {/* ==========================
          AVISO
      ========================== */}

      <div className="rounded-xl border bg-muted/20 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Os campos marcados com{" "}
          <span className="font-semibold text-destructive">
            *
          </span>{" "}
          são obrigatórios. Alguns deles
          já vêm preenchidos com o padrão
          mais comum e podem ser alterados
          quando necessário.
        </p>
      </div>

      {hasErrors ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />

          <div>
            <p className="font-medium">
              Não foi possível salvar o caso.
            </p>

            <p className="mt-1">
              Revise os campos obrigatórios destacados abaixo.
            </p>
          </div>
        </div>
      ) : null}

      {/* ==========================
          IDENTIFICAÇÃO
      ========================== */}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">
            📋 Identificação
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Informações principais para identificar e organizar o caso.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <TextField
            control={
              control
            }
            name="title"
            label="Título do caso *"
            placeholder="Ex.: Aposentadoria por idade"
          />

          <SelectField
            control={
              control
            }
            name="practiceArea"
            label="Área *"
            options={
              PRACTICE_AREA_OPTIONS
            }
            placeholder="Selecione a área"
          />

          <TextField
            control={
              control
            }
            name="benefitType"
            label="Tipo do caso"
            placeholder="Ex.: Benefício por incapacidade"
          />

          <TextField
            control={
              control
            }
            name="subject"
            label="Objeto"
            placeholder="Descrição resumida do objeto"
          />
        </div>
      </section>

      {/* ==========================
          ORIGEM
      ========================== */}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">
            ⚖️ Origem e situação
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Indique onde o caso tramita e a fase atual de acompanhamento.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SelectField
            control={
              control
            }
            name="origin"
            label="Origem *"
            options={
              CASE_ORIGIN_OPTIONS
            }
          />

          <SelectField
            control={
              control
            }
            name="administrativeStatus"
            label="Situação administrativa *"
            options={
              ADMINISTRATIVE_STATUS_OPTIONS
            }
          />

          <SelectField
            control={
              control
            }
            name="status"
            label="Status *"
            options={
              CASE_STATUS_OPTIONS
            }
          />
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Paro casos exclusivamente judiciais,
          a situação administrativa pode permanecer
          como &quot;Não se aplica&quot;.
        </p>
      </section>

      {/* ==========================
          NUMERAÇÃO
      ========================== */}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">
            🔢 Numeração
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Preencha apenas os números que existirem para este caso.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <TextField
            control={
              control
            }
            name="number"
            label="Processo judicial"
            placeholder="Número do processo"
          />

          <TextField
            control={
              control
            }
            name="administrativeNumber"
            label="NB"
            placeholder="Número do benefício"
          />

          <TextField
            control={
              control
            }
            name="administrativeProcess"
            label="Processo administrativo"
            placeholder="Número do processo administrativo"
          />
        </div>
      </section>

      {/* ==========================
          ÓRGÃO JULGADOR
      ========================== */}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">
            🏛️ Órgão julgador
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Dados do órgão responsável pela tramitação judicial, quando aplicável.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <TextField
            control={
              control
            }
            name="court"
            label="Tribunal"
          />

          <TextField
            control={
              control
            }
            name="courtUnit"
            label="Vara"
          />

          <TextField
            control={
              control
            }
            name="judge"
            label="Juiz"
          />

          <TextField
            control={
              control
            }
            name="city"
            label="Cidade"
          />

          <TextField
            control={
              control
            }
            name="state"
            label="UF"
          />
        </div>
      </section>

      {/* ==========================
          PARTES
      ========================== */}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">
            👥 Partes
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Identifique a parte contrária quando essa informação estiver disponível.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            control={
              control
            }
            name="opposingParty"
            label="Parte contrária"
          />
        </div>
      </section>

      {/* ==========================
          FINANCEIRO
      ========================== */}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">
            💰 Financeiro
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Informação processual do valor atribuído à caso.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            control={
              control
            }
            name="claimValue"
            label="Valor da causa"
            type="number"
          />
        </div>
      </section>

      {/* ==========================
          DATAS
      ========================== */}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">
            📅 Datas
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Datas estruturais do caso. Compromissos e prazos específicos ficam na Agenda.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            control={
              control
            }
            name="administrativeRequestDate"
            label="DER"
            type="date"
          />

          <TextField
            control={
              control
            }
            name="distributionDate"
            label="Distribuição"
            type="date"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Prazos, perícias, audiências e demais compromissos devem ser cadastrados na Agenda do caso.
        </p>
      </section>

      {/* ==========================
          OBSERVAÇÕES
      ========================== */}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">
            📝 Observações
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Informações internas úteis para o acompanhamento.
          </p>
        </div>

        <TextareaField
          control={
            control
          }
          name="notes"
          label="Observações"
        />
      </section>

      {/* ==========================
          AÇÃO
      ========================== */}

      <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-destructive">
            *
          </span>{" "}
          Campos obrigatórios.
        </p>

        <button
          type="submit"
          disabled={
            isSubmitting
          }
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? "Salvando..."
            : caseData
              ? "Salvar alterações"
              : "Salvar caso"}
        </button>
      </div>
    </form>
  );
}