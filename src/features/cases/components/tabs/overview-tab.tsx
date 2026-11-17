import type {
  ElementType,
  ReactNode,
} from "react";

import {
  Building2,
  CalendarDays,
  FileText,
  Gavel,
  Scale,
} from "lucide-react";

import {
  formatDate,
  formatDateOnly,
} from "@/lib/format/date";

import type {
  CaseDetails,
} from "../../types";

import {
  ADMINISTRATIVE_STATUS_LABELS,
  CASE_ORIGIN_LABELS,
  CASE_STATUS_LABELS,
  PRACTICE_AREA_LABELS,
} from "../../constants";

type Props = {
  caseData:
    CaseDetails;
};

type SectionTone =
  | "default"
  | "blue"
  | "violet"
  | "amber";

type SectionProps = {
  title:
    string;

  description:
    string;

  icon:
    ElementType;

  children:
    ReactNode;

  tone?:
    SectionTone;
};

function Item({
  label,
  value,
}: {
  label:
    string;

  value:
    ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <div className="mt-1.5 break-words text-sm font-medium leading-6">
        {value ??
        "-"}
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  icon: Icon,
  children,
  tone =
    "default",
}: SectionProps) {
  const styles = {
    default: {
      border:
        "border-border",

      header:
        "border-border bg-muted/20",

      icon:
        "bg-muted text-muted-foreground",
    },

    blue: {
      border:
        "border-blue-200 dark:border-blue-900",

      header:
        "border-blue-100 bg-blue-50/30 dark:border-blue-900 dark:bg-blue-950/10",

      icon:
        "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    },

    violet: {
      border:
        "border-violet-200 dark:border-violet-900",

      header:
        "border-violet-100 bg-violet-50/30 dark:border-violet-900 dark:bg-violet-950/10",

      icon:
        "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
    },

    amber: {
      border:
        "border-amber-200 dark:border-amber-900",

      header:
        "border-amber-100 bg-amber-50/30 dark:border-amber-900 dark:bg-amber-950/10",

      icon:
        "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    },
  }[
    tone
  ];

  return (
    <section
      className={`overflow-hidden rounded-2xl border bg-card shadow-sm ${styles.border}`}
    >
      <div
        className={`border-b px-5 py-4 sm:px-6 ${styles.header}`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
          >
            <Icon className="size-5" />
          </div>

          <div>
            <h2 className="font-semibold">
              {title}
            </h2>

            <p className="mt-0.5 text-sm leading-5 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {children}
      </div>
    </section>
  );
}

export function OverviewTab({
  caseData,
}: Props) {
  const currency =
    caseData.claimValue !=
    null
      ? new Intl.NumberFormat(
          "pt-BR",
          {
            style:
              "currency",

            currency:
              "BRL",
          },
        ).format(
          Number(
            caseData.claimValue,
          ),
        )
      : "-";

  const location =
    [
      caseData.city,
      caseData.state,
    ]
      .filter(
        Boolean,
      )
      .join(
        " - ",
      ) ||
    "-";

  return (
    <div className="space-y-4">
      {/* ==========================
          CLASSIFICAÇÃO
      ========================== */}

      <Section
        title="Dados do caso"
        description="Classificação e informações gerais utilizadas para identificar o atendimento."
        icon={
          FileText
        }
      >
        <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
          <Item
            label="Título"
            value={
              caseData.title
            }
          />

          <Item
            label="Área"
            value={
              PRACTICE_AREA_LABELS[
                caseData.practiceArea
              ]
            }
          />

          <Item
            label="Tipo do caso"
            value={
              caseData.benefitType ||
              "-"
            }
          />

          <Item
            label="Origem"
            value={
              CASE_ORIGIN_LABELS[
                caseData.origin
              ]
            }
          />

          <Item
            label="Status"
            value={
              CASE_STATUS_LABELS[
                caseData.status
              ]
            }
          />

          <Item
            label="Objeto"
            value={
              caseData.subject ||
              "-"
            }
          />
        </div>
      </Section>

      {/* ==========================
          ADMINISTRATIVO
      ========================== */}

      <Section
        title="Dados administrativos"
        description="Informações relacionadas ao requerimento ou procedimento administrativo."
        icon={
          Building2
        }
        tone="violet"
      >
        <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-4">
          <Item
            label="Número do benefício (NB)"
            value={
              caseData.administrativeNumber ||
              "-"
            }
          />

          <Item
            label="Processo administrativo"
            value={
              caseData.administrativeProcess ||
              "-"
            }
          />

          <Item
            label="Situação administrativa"
            value={
              ADMINISTRATIVE_STATUS_LABELS[
                caseData.administrativeStatus
              ]
            }
          />

          <Item
            label="DER"
            value={
              caseData.administrativeRequestDate
                ? formatDateOnly(
                    caseData.administrativeRequestDate,
                  )
                : "-"
            }
          />
        </div>
      </Section>

      {/* ==========================
          JUDICIAL
      ========================== */}

      <Section
        title="Dados judiciais"
        description="Informações de distribuição, tramitação e identificação do processo judicial."
        icon={
          Gavel
        }
        tone="blue"
      >
        <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
          <Item
            label="Número do processo"
            value={
              caseData.number ||
              "-"
            }
          />

          <Item
            label="Tribunal"
            value={
              caseData.court ||
              "-"
            }
          />

          <Item
            label="Vara / Unidade"
            value={
              caseData.courtUnit ||
              "-"
            }
          />

          <Item
            label="Juiz"
            value={
              caseData.judge ||
              "-"
            }
          />

          <Item
            label="Localidade"
            value={
              location
            }
          />

          <Item
            label="Distribuição"
            value={
              caseData.distributionDate
                ? formatDateOnly(
                    caseData.distributionDate,
                  )
                : "-"
            }
          />

          <Item
            label="Parte contrária"
            value={
              caseData.opposingParty ||
              "-"
            }
          />

          <Item
            label="Valor da causa"
            value={
              currency
            }
          />
        </div>
      </Section>

      {/* ==========================
          CADASTRO E OBSERVAÇÕES
      ========================== */}

      <Section
        title="Informações internas"
        description="Dados de controle do LexFlow e observações registradas para acompanhamento."
        icon={
          CalendarDays
        }
        tone={
          caseData.notes
            ? "amber"
            : "default"
        }
      >
        <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
          <Item
            label="Cadastrado em"
            value={
              formatDate(
                caseData.createdAt,
              )
            }
          />

          <Item
            label="Última atualização"
            value={
              formatDate(
                caseData.updatedAt,
              )
            }
          />
        </div>

        {caseData.notes ? (
          <div className="mt-6 border-t pt-6">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                <Scale className="size-4" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Observações
                </p>

                <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-foreground/80">
                  {
                    caseData.notes
                  }
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 border-t pt-5">
            <p className="text-sm text-muted-foreground">
              Nenhuma observação interna registrada neste caso.
            </p>
          </div>
        )}
      </Section>
    </div>
  );
}