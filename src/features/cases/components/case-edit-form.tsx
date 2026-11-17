"use client";

import Link from "next/link";

import {
  AlertCircle,
  CalendarDays,
  FileText,
  Landmark,
  Save,
  Scale,
  Wallet,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useForm,
} from "react-hook-form";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

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

type CaseEditFormProps = {
  clientId:
    string;

  case:
    CaseFormSource & {
      id:
        string;
    };
};

type SectionId =
  | "main"
  | "administrative"
  | "judicial"
  | "parties"
  | "dates"
  | "notes";

type NavigationItem = {
  id:
    SectionId;

  label:
    string;

  description:
    string;

  icon:
    React.ElementType;
};

const navigationItems:
  NavigationItem[] = [
    {
      id:
        "main",

      label:
        "Dados principais",

      description:
        "Identificação e situação",

      icon:
        Scale,
    },

    {
      id:
        "administrative",

      label:
        "Administrativo",

      description:
        "NB e processo administrativo",

      icon:
        FileText,
    },

    {
      id:
        "judicial",

      label:
        "Judicial",

      description:
        "Processo e órgão julgador",

      icon:
        Landmark,
    },

    {
      id:
        "parties",

      label:
        "Partes e valores",

      description:
        "Parte contrária e valor",

      icon:
        Wallet,
    },

    {
      id:
        "dates",

      label:
        "Datas",

      description:
        "DER e distribuição",

      icon:
        CalendarDays,
    },

    {
      id:
        "notes",

      label:
        "Observações",

      description:
        "Anotações internas",

      icon:
        FileText,
    },
  ];

const sectionFields:
  Record<
    SectionId,
    (keyof CaseFormValues)[]
  > = {
    main: [
      "title",
      "practiceArea",
      "benefitType",
      "subject",
      "origin",
      "status",
    ],

    administrative: [
      "administrativeStatus",
      "administrativeNumber",
      "administrativeProcess",
    ],

    judicial: [
      "number",
      "court",
      "courtUnit",
      "judge",
      "city",
      "state",
    ],

    parties: [
      "opposingParty",
      "claimValue",
    ],

    dates: [
      "administrativeRequestDate",
      "distributionDate",
    ],

    notes: [
      "notes",
    ],
  };

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon:
    React.ElementType;

  title:
    string;

  description:
    string;
}) {
  return (
    <div className="border-b px-5 py-5 sm:px-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>

        <div>
          <h2 className="font-semibold">
            {title}
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function CaseEditForm({
  clientId,
  case:
    caseData,
}: CaseEditFormProps) {
  const [
    activeSection,
    setActiveSection,
  ] =
    useState<SectionId>(
      "main",
    );

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

  const {
    control,
    handleSubmit,

    formState: {
      errors,
      isSubmitting,
    },
  } =
    form;

  const action =
    updateCase.bind(
      null,
      caseData.id,
    );

  const hasErrors =
    Object.keys(
      errors,
    ).length >
    0;

  /*
   * Se houver erro em uma seção
   * que não está visível, abre
   * automaticamente a primeira
   * seção que precisa de correção.
   */
  useEffect(() => {
    if (!hasErrors) {
      return;
    }

    const currentSectionHasError =
      sectionFields[
        activeSection
      ].some(
        (field) =>
          Boolean(
            errors[field],
          ),
      );

    if (
      currentSectionHasError
    ) {
      return;
    }

    const firstSectionWithError =
      navigationItems.find(
        (item) =>
          sectionFields[
            item.id
          ].some(
            (field) =>
              Boolean(
                errors[field],
              ),
          ),
      );

    if (
      firstSectionWithError
    ) {
      setActiveSection(
        firstSectionWithError.id,
      );
    }
  }, [
    activeSection,
    errors,
    hasErrors,
  ]);

 const submit =
  handleSubmit(
    async (
      values,
    ) => {
      const formData =
        new FormData();

      formData.set(
        "title",
        values.title,
      );

      formData.set(
        "practiceArea",
        values.practiceArea,
      );

      formData.set(
        "subject",
        values.subject ?? "",
      );

      formData.set(
        "benefitType",
        values.benefitType ?? "",
      );

      formData.set(
        "origin",
        values.origin,
      );

      formData.set(
        "administrativeStatus",
        values.administrativeStatus,
      );

      formData.set(
        "number",
        values.number ?? "",
      );

      formData.set(
        "administrativeNumber",
        values.administrativeNumber ?? "",
      );

      formData.set(
        "administrativeProcess",
        values.administrativeProcess ?? "",
      );

      formData.set(
        "court",
        values.court ?? "",
      );

      formData.set(
        "courtUnit",
        values.courtUnit ?? "",
      );

      formData.set(
        "judge",
        values.judge ?? "",
      );

      formData.set(
        "city",
        values.city ?? "",
      );

      formData.set(
        "state",
        values.state ?? "",
      );

      formData.set(
        "opposingParty",
        values.opposingParty ?? "",
      );

      formData.set(
        "claimValue",
        values.claimValue !== undefined &&
          values.claimValue !== null
          ? String(values.claimValue)
          : "",
      );

      formData.set(
        "status",
        values.status,
      );

      formData.set(
        "administrativeRequestDate",
        values.administrativeRequestDate ?? "",
      );

      formData.set(
        "distributionDate",
        values.distributionDate ?? "",
      );

      formData.set(
        "notes",
        values.notes ?? "",
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

  function sectionHasError(
    section:
      SectionId,
  ) {
    return sectionFields[
      section
    ].some(
      (field) =>
        Boolean(
          errors[field],
        ),
    );
  }

  return (
    <form
      onSubmit={
        submit
      }
      className="space-y-6"
    >
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
              Revise os campos destacados. A seção com erro foi aberta automaticamente.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* ==========================
            NAVEGAÇÃO
        ========================== */}

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b bg-muted/20 px-4 py-4">
              <p className="text-sm font-semibold">
                Dados do caso
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Selecione uma seção para consultar ou atualizar as informações.
              </p>
            </div>

            <nav className="space-y-1 p-2">
              {navigationItems.map(
                (item) => {
                  const Icon =
                    item.icon;

                  const active =
                    activeSection ===
                    item.id;

                  const hasSectionError =
                    sectionHasError(
                      item.id,
                    );

                  return (
                    <button
                      key={
                        item.id
                      }
                      type="button"
                      onClick={() =>
                        setActiveSection(
                          item.id,
                        )
                      }
                      className={
                        active
                          ? "flex w-full items-center gap-3 rounded-xl bg-primary px-3 py-3 text-left text-primary-foreground shadow-sm"
                          : "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-muted"
                      }
                    >
                      <div
                        className={
                          active
                            ? "flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15"
                            : "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                        }
                      >
                        <Icon className="size-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">
                            {
                              item.label
                            }
                          </p>

                          {hasSectionError ? (
                            <AlertCircle className="size-4 shrink-0 text-destructive" />
                          ) : null}
                        </div>

                        <p
                          className={
                            active
                              ? "truncate text-xs text-primary-foreground/70"
                              : "truncate text-xs text-muted-foreground"
                          }
                        >
                          {
                            item.description
                          }
                        </p>
                      </div>
                    </button>
                  );
                },
              )}
            </nav>
          </div>
        </aside>

        {/* ==========================
            CONTEÚDO
        ========================== */}

        <div className="min-w-0">
          {/* DADOS PRINCIPAIS */}

          <section
            className={
              activeSection ===
              "main"
                ? "overflow-hidden rounded-2xl border bg-card shadow-sm"
                : "hidden"
            }
          >
            <SectionHeader
              icon={Scale}
              title="Dados principais"
              description="Identificação, área de atuação, origem e situação atual do caso."
            />

            <div className="space-y-7 p-5 sm:p-6">
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <div className="md:col-span-2">
                  <TextField
                    control={
                      control
                    }
                    name="title"
                    label="Título do caso *"
                    placeholder="Ex.: Aposentadoria por idade"
                  />
                </div>

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
                  name="status"
                  label="Status *"
                  options={
                    CASE_STATUS_OPTIONS
                  }
                />
              </div>

              <div className="border-t pt-6">
                <TextField
                  control={
                    control
                  }
                  name="subject"
                  label="Objeto"
                  placeholder="Descrição resumida do objeto do caso"
                />
              </div>
            </div>
          </section>

          {/* ADMINISTRATIVO */}

          <section
            className={
              activeSection ===
              "administrative"
                ? "overflow-hidden rounded-2xl border bg-card shadow-sm"
                : "hidden"
            }
          >
            <SectionHeader
              icon={
                FileText
              }
              title="Administrativo"
              description="Informações relacionadas ao procedimento ou benefício administrativo."
            />

            <div className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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

              <p className="text-xs leading-5 text-muted-foreground">
                Nos casos exclusivamente judiciais, a situação administrativa pode permanecer como “Não se aplica”.
              </p>
            </div>
          </section>

          {/* JUDICIAL */}

          <section
            className={
              activeSection ===
              "judicial"
                ? "overflow-hidden rounded-2xl border bg-card shadow-sm"
                : "hidden"
            }
          >
            <SectionHeader
              icon={
                Landmark
              }
              title="Judicial"
              description="Número do processo e informações do órgão responsável pela tramitação."
            />

            <div className="space-y-6 p-5 sm:p-6">
              <div>
                <TextField
                  control={
                    control
                  }
                  name="number"
                  label="Número do processo judicial"
                  placeholder="Número do processo"
                />
              </div>

              <div className="border-t pt-6">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold">
                    Órgão julgador
                  </h3>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Preencha quando houver tramitação judicial.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
                    label="Vara / unidade"
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
              </div>
            </div>
          </section>

          {/* PARTES E VALORES */}

          <section
            className={
              activeSection ===
              "parties"
                ? "overflow-hidden rounded-2xl border bg-card shadow-sm"
                : "hidden"
            }
          >
            <SectionHeader
              icon={
                Wallet
              }
              title="Partes e valores"
              description="Parte contrária e valor processual atribuído ao caso."
            />

            <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
              <TextField
                control={
                  control
                }
                name="opposingParty"
                label="Parte contrária"
                placeholder="Ex.: INSS, Banco X, Município..."
              />

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

          {/* DATAS */}

          <section
            className={
              activeSection ===
              "dates"
                ? "overflow-hidden rounded-2xl border bg-card shadow-sm"
                : "hidden"
            }
          >
            <SectionHeader
              icon={
                CalendarDays
              }
              title="Datas estruturais"
              description="Datas principais do procedimento administrativo e da tramitação judicial."
            />

            <div className="space-y-5 p-5 sm:p-6">
              <div className="grid gap-5 md:grid-cols-2">
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
                  label="Data de distribuição"
                  type="date"
                />
              </div>

              <div className="rounded-xl border bg-muted/20 px-4 py-3">
                <p className="text-xs leading-5 text-muted-foreground">
                  Prazos, perícias, audiências e demais compromissos devem continuar sendo cadastrados na Agenda do caso.
                </p>
              </div>
            </div>
          </section>

          {/* OBSERVAÇÕES */}

          <section
            className={
              activeSection ===
              "notes"
                ? "overflow-hidden rounded-2xl border bg-card shadow-sm"
                : "hidden"
            }
          >
            <SectionHeader
              icon={
                FileText
              }
              title="Observações"
              description="Informações internas úteis para o acompanhamento do caso."
            />

            <div className="p-5 sm:p-6">
              <TextareaField
                control={
                  control
                }
                name="notes"
                label="Observações internas"
              />
            </div>
          </section>
        </div>
      </div>

      {/* ==========================
          AÇÕES
      ========================== */}

      <div className="sticky bottom-4 z-20">
        <div className="flex flex-col gap-3 rounded-2xl border bg-background/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">
              Alterações do caso
            </p>

            <p className="text-xs text-muted-foreground">
              Os dados das demais seções permanecerão preservados.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/clientes/${clientId}/casos/${caseData.id}`}
              className="inline-flex h-10 items-center justify-center rounded-lg border bg-background px-4 text-sm font-medium transition hover:bg-muted"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={
                isSubmitting
              }
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="size-4" />

              {isSubmitting
                ? "Salvando..."
                : "Salvar alterações"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}