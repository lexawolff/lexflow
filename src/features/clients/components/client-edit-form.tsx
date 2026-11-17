"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BadgeDollarSign,
  Contact,
  FileText,
  KeyRound,
  MapPin,
  Save,
  UserRound,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { withFailureToast } from "@/lib/actions/action-feedback";
import { updateClient } from "../actions/update-client";
import {
  clientSchema,
  type ClientFormValues,
} from "../schemas/client-schema";
import { getClientFormDefaultValues } from "../utils/get-client-form-default-values";

import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { SelectField } from "@/components/forms/select-field";
import { CpfField } from "@/components/forms/cpf-field";
import { PhoneField } from "@/components/forms/phone-field";
import { CepField } from "@/components/forms/cep-field";
import { CurrencyField } from "@/components/forms/currency-field";
import { PasswordField } from "@/components/forms/password-field";
import { SubmitButton } from "@/components/forms/submit-button";

type ClientEditFormProps = {
  client: {
    id: string;
    name: string;
    cpf: string | null;
    rg: string | null;
    birthDate: Date | null;
    motherName: string | null;
    fatherName: string | null;
    gender: string | null;
    maritalStatus: string | null;
    nationality: string | null;
    education: string | null;
    profession: string | null;
    income: number | null;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    cep: string | null;
    address: string | null;
    addressNumber: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    pis: string | null;
    govLogin: string | null;
    notes: string | null;
  };

  canWriteFinance: boolean;
  canManageGov: boolean;
};

type SectionId =
  | "identification"
  | "contact"
  | "professional"
  | "address"
  | "gov"
  | "notes";

type NavigationItem = {
  id: SectionId;
  label: string;
  description: string;
  icon: React.ElementType;
};

const navigationItems: NavigationItem[] = [
  {
    id: "identification",
    label: "Identificação",
    description: "Dados pessoais",
    icon: UserRound,
  },
  {
    id: "contact",
    label: "Contato",
    description: "Telefone e e-mail",
    icon: Contact,
  },
  {
    id: "professional",
    label: "Profissional",
    description: "Profissão e previdenciário",
    icon: BadgeDollarSign,
  },
  {
    id: "address",
    label: "Endereço",
    description: "Dados residenciais",
    icon: MapPin,
  },
  {
    id: "gov",
    label: "Gov.br",
    description: "Credenciais de acesso",
    icon: KeyRound,
  },
  {
    id: "notes",
    label: "Observações",
    description: "Anotações internas",
    icon: FileText,
  },
];

function SectionHeader({
  icon: Icon,
  title,
  description,
  sensitive = false,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  sensitive?: boolean;
}) {
  return (
    <div className="border-b px-5 py-5 sm:px-6">
      <div className="flex items-start gap-3">
        <div
          className={
            sensitive
              ? "flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
              : "flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
          }
        >
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

export function ClientEditForm({
  client,
  canWriteFinance,
  canManageGov,
}: ClientEditFormProps) {
  const [activeSection, setActiveSection] =
    useState<SectionId>("identification");

  const form =
    useForm<ClientFormValues>({
      resolver:
        zodResolver(clientSchema),

      defaultValues:
        getClientFormDefaultValues(
          client,
        ),
    });

  const {
    control,
    setValue,
  } = form;

  const action =
    withFailureToast(
      updateClient.bind(
        null,
        client.id,
      ),
    );

  return (
    <form
      action={action}
      className="space-y-6"
    >
      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* ==========================
            NAVEGAÇÃO
        ========================== */}

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b bg-muted/20 px-4 py-4">
              <p className="text-sm font-semibold">
                Dados do cliente
              </p>

              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Escolha uma seção para consultar ou alterar as informações.
              </p>
            </div>

            <nav className="space-y-1 p-2">
              {navigationItems.map(
                (item) => {
                  if (
                    item.id === "gov" &&
                    !canManageGov
                  ) {
                    return null;
                  }

                  const Icon =
                    item.icon;

                  const active =
                    activeSection ===
                    item.id;

                  return (
                    <button
                      key={item.id}
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

                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {item.label}
                        </p>

                        <p
                          className={
                            active
                              ? "truncate text-xs text-primary-foreground/70"
                              : "truncate text-xs text-muted-foreground"
                          }
                        >
                          {item.description}
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
          {/* IDENTIFICAÇÃO */}

          <section
            className={
              activeSection ===
              "identification"
                ? "overflow-hidden rounded-2xl border bg-card shadow-sm"
                : "hidden"
            }
          >
            <SectionHeader
              icon={UserRound}
              title="Identificação"
              description="Dados pessoais e informações de identificação do cliente."
            />

            <div className="space-y-7 p-5 sm:p-6">
              <div className="grid gap-x-5 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
                <div className="md:col-span-2">
                  <TextField
                    control={control}
                    name="name"
                    label="Nome completo"
                  />
                </div>

                <CpfField
                  control={control}
                  name="cpf"
                />

                <TextField
                  control={control}
                  name="rg"
                  label="RG"
                />

                <TextField
                  control={control}
                  name="birthDate"
                  label="Data de nascimento"
                  type="date"
                />

                <SelectField
                  control={control}
                  name="gender"
                  label="Gênero"
                  options={[
                    {
                      label:
                        "Feminino",
                      value:
                        "Feminino",
                    },
                    {
                      label:
                        "Masculino",
                      value:
                        "Masculino",
                    },
                    {
                      label:
                        "Não binário",
                      value:
                        "Não binário",
                    },
                    {
                      label:
                        "Outro",
                      value:
                        "Outro",
                    },
                    {
                      label:
                        "Prefiro não informar",
                      value:
                        "Prefiro não informar",
                    },
                  ]}
                />

                <SelectField
                  control={control}
                  name="maritalStatus"
                  label="Estado civil"
                  options={[
                    {
                      label:
                        "Solteiro(a)",
                      value:
                        "Solteiro(a)",
                    },
                    {
                      label:
                        "Casado(a)",
                      value:
                        "Casado(a)",
                    },
                    {
                      label:
                        "União Estável",
                      value:
                        "União Estável",
                    },
                    {
                      label:
                        "Divorciado(a)",
                      value:
                        "Divorciado(a)",
                    },
                    {
                      label:
                        "Viúvo(a)",
                      value:
                        "Viúvo(a)",
                    },
                  ]}
                />

                <TextField
                  control={control}
                  name="nationality"
                  label="Nacionalidade"
                />

                <TextField
                  control={control}
                  name="education"
                  label="Escolaridade"
                />
              </div>

              <div className="border-t pt-6">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold">
                    Filiação
                  </h3>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Informações úteis para requerimentos e identificação documental.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <TextField
                    control={control}
                    name="motherName"
                    label="Nome da mãe"
                  />

                  <TextField
                    control={control}
                    name="fatherName"
                    label="Nome do pai"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* CONTATO */}

          <section
            className={
              activeSection ===
              "contact"
                ? "overflow-hidden rounded-2xl border bg-card shadow-sm"
                : "hidden"
            }
          >
            <SectionHeader
              icon={Contact}
              title="Contato"
              description="Canais utilizados para comunicação com o cliente."
            />

            <div className="p-5 sm:p-6">
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <PhoneField
                  control={control}
                  name="whatsapp"
                  label="WhatsApp"
                />

                <PhoneField
                  control={control}
                  name="phone"
                  label="Telefone"
                />

                <TextField
                  control={control}
                  name="email"
                  label="E-mail"
                  type="email"
                />
              </div>
            </div>
          </section>

          {/* PROFISSIONAL */}

          <section
            className={
              activeSection ===
              "professional"
                ? "overflow-hidden rounded-2xl border bg-card shadow-sm"
                : "hidden"
            }
          >
            <SectionHeader
              icon={
                BadgeDollarSign
              }
              title="Dados profissionais e previdenciários"
              description="Informações profissionais, econômicas e previdenciárias."
            />

            <div className="p-5 sm:p-6">
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <TextField
                  control={control}
                  name="profession"
                  label="Profissão"
                />

                {canWriteFinance ? (
                  <CurrencyField
                    control={control}
                    name="income"
                    label="Renda mensal"
                  />
                ) : null}

                <TextField
                  control={control}
                  name="pis"
                  label="PIS / PASEP / NIT"
                />
              </div>
            </div>
          </section>

          {/* ENDEREÇO */}

          <section
            className={
              activeSection ===
              "address"
                ? "overflow-hidden rounded-2xl border bg-card shadow-sm"
                : "hidden"
            }
          >
            <SectionHeader
              icon={MapPin}
              title="Endereço"
              description="Endereço residencial informado pelo cliente."
            />

            <div className="p-5 sm:p-6">
              <div className="grid gap-x-5 gap-y-5 md:grid-cols-2 xl:grid-cols-6">
                <div className="xl:col-span-2">
                  <CepField
                    control={control}
                    setValue={
                      setValue
                    }
                  />
                </div>

                <div className="xl:col-span-3">
                  <TextField
                    control={control}
                    name="address"
                    label="Endereço"
                  />
                </div>

                <div className="xl:col-span-1">
                  <TextField
                    control={control}
                    name="addressNumber"
                    label="Número"
                  />
                </div>

                <div className="md:col-span-2 xl:col-span-2">
                  <TextField
                    control={control}
                    name="complement"
                    label="Complemento"
                  />
                </div>

                <div className="xl:col-span-2">
                  <TextField
                    control={control}
                    name="neighborhood"
                    label="Bairro"
                  />
                </div>

                <div className="xl:col-span-1">
                  <TextField
                    control={control}
                    name="city"
                    label="Cidade"
                  />
                </div>

                <div className="xl:col-span-1">
                  <TextField
                    control={control}
                    name="state"
                    label="UF"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* GOV.BR */}

          {canManageGov ? (
            <section
              className={
                activeSection ===
                "gov"
                  ? "overflow-hidden rounded-2xl border border-amber-200 bg-card shadow-sm dark:border-amber-900/70"
                  : "hidden"
              }
            >
              <SectionHeader
                icon={KeyRound}
                title="Acesso Gov.br"
                description="Cadastre ou altere as credenciais utilizadas no atendimento."
                sensitive
              />

              <div className="space-y-5 p-5 sm:p-6">
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 dark:border-amber-900/70 dark:bg-amber-950/20">
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                    Informação sensível
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-800 dark:text-amber-300">
                    A senha permanece protegida no sistema. Preencha o campo de senha somente se desejar cadastrá-la ou substituí-la.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <TextField
                    control={control}
                    name="govLogin"
                    label="Login Gov.br"
                  />

                  <PasswordField
                    control={control}
                    name="govPassword"
                    label="Nova senha Gov.br"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Para consultar a senha já cadastrada, utilize a área Gov.br na ficha do cliente.
                </p>
              </div>
            </section>
          ) : null}

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
              icon={FileText}
              title="Observações"
              description="Anotações internas relevantes para o acompanhamento do cliente."
            />

            <div className="p-5 sm:p-6">
              <TextareaField
                control={control}
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
              Alterações no cadastro
            </p>

            <p className="text-xs text-muted-foreground">
              As alterações serão aplicadas ao cadastro completo do cliente.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/clientes/${client.id}`}
              className="inline-flex h-10 items-center justify-center rounded-lg border bg-background px-4 text-sm font-medium transition hover:bg-muted"
            >
              Cancelar
            </Link>

            <div className="min-w-44">
              <SubmitButton>
                <span className="inline-flex items-center gap-2">
                  <Save className="size-4" />
                  Salvar alterações
                </span>
              </SubmitButton>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}