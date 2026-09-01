import type {
  ReactNode,
} from "react";

import {
  formatDate,
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
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <div className="font-medium break-words">
        {value ??
          "-"}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title:
    string;

  children:
    ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <h2 className="mb-5 text-lg font-semibold">
        {title}
      </h2>

      {children}
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
      .filter(Boolean)
      .join(" - ") ||
    "-";

  return (
    <div className="space-y-4">
      {/* ==========================
          IDENTIFICAÇÃO
      ========================== */}

      <Section title="Identificação da demanda">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
            label="Tipo da demanda"
            value={
              caseData.benefitType ||
              "-"
            }
          />

          <Item
            label="Objeto"
            value={
              caseData.subject ||
              "-"
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
            label="Origem"
            value={
              CASE_ORIGIN_LABELS[
                caseData.origin
              ]
            }
          />
        </div>
      </Section>

      {/* ==========================
          ADMINISTRATIVO
      ========================== */}

      <Section title="Dados administrativos">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                ? formatDate(
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

      <Section title="Dados judiciais">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                ? formatDate(
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
          SISTEMA
      ========================== */}

      <Section title="Informações do cadastro">
        <div className="grid gap-6 md:grid-cols-2">
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
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Observações
            </p>

            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {
                caseData.notes
              }
            </p>
          </div>
        ) : null}
      </Section>
    </div>
  );
}