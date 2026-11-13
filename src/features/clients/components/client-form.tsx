"use client";

import {
  BadgeDollarSign,
  ChevronDown,
  Contact,
  FileText,
  KeyRound,
  MapPin,
  Save,
  UserRound,
} from "lucide-react";

import {
  useForm,
} from "react-hook-form";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import {
  createClient,
} from "../actions/create-client";

import {
  updateClient,
} from "../actions/update-client";

import {
  clientSchema,
  type ClientFormValues,
} from "../schemas/client-schema";

import {
  getClientFormDefaultValues,
} from "../utils/get-client-form-default-values";

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
  CpfField,
} from "@/components/forms/cpf-field";

import {
  PhoneField,
} from "@/components/forms/phone-field";

import {
  CepField,
} from "@/components/forms/cep-field";

import {
  CurrencyField,
} from "@/components/forms/currency-field";

import {
  PasswordField,
} from "@/components/forms/password-field";

import {
  SubmitButton,
} from "@/components/forms/submit-button";

type ClientFormProps = {
  client?: {
    id:
      string;

    name:
      string;

    cpf:
      string | null;

    rg:
      string | null;

    birthDate:
      Date | null;

    motherName:
      string | null;

    fatherName:
      string | null;

    gender:
      string | null;

    maritalStatus:
      string | null;

    nationality:
      string | null;

    education:
      string | null;

    profession:
      string | null;

    income:
      number | null;

    phone:
      string | null;

    whatsapp:
      string | null;

    email:
      string | null;

    cep:
      string | null;

    address:
      string | null;

    addressNumber:
      string | null;

    complement:
      string | null;

    neighborhood:
      string | null;

    city:
      string | null;

    state:
      string | null;

    pis:
      string | null;

    govLogin:
      string | null;

    notes:
      string | null;
  };

  canWriteFinance:
    boolean;

  canManageGov:
    boolean;
};

type SectionProps = {
  icon:
    React.ElementType;

  title:
    string;

  description:
    string;

  children:
    React.ReactNode;

  tone?:
    "default" |
    "amber";
};

function FormSection({
  icon: Icon,
  title,
  description,
  children,
  tone = "default",
}: SectionProps) {
  const special =
    tone ===
    "amber";

  return (
    <section
      className={
        special
          ? "overflow-hidden rounded-2xl border border-amber-200 bg-card shadow-sm dark:border-amber-900/70"
          : "overflow-hidden rounded-2xl border bg-card shadow-sm"
      }
    >
      <div
        className={
          special
            ? "border-b border-amber-200 bg-amber-50/60 px-5 py-4 dark:border-amber-900/70 dark:bg-amber-950/20 sm:px-6"
            : "border-b bg-muted/20 px-5 py-4 sm:px-6"
        }
      >
        <div className="flex items-start gap-3">
          <div
            className={
              special
                ? "flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                : "flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
            }
          >
            <Icon className="size-5" />
          </div>

          <div className="min-w-0">
            <h2 className="font-semibold">
              {title}
            </h2>

            <p className="mt-0.5 text-sm text-muted-foreground">
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

export function ClientForm({
  client,
  canWriteFinance,
  canManageGov,
}: ClientFormProps) {
  const form =
    useForm<ClientFormValues>({
      resolver:
        zodResolver(
          clientSchema,
        ),

      defaultValues:
        getClientFormDefaultValues(
          client,
        ),
    });

  const action =
    client
      ? updateClient.bind(
          null,
          client.id,
        )
      : createClient;

  const {
    control,
    setValue,
  } =
    form;

  const personalComplement = (
    <FormSection
      icon={
        UserRound
      }
      title="Dados pessoais"
      description="Informações complementares de identificação do cliente."
    >
      <div className="grid gap-x-5 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
        <TextField
          control={
            control
          }
          name="rg"
          label="RG"
        />

        <TextField
          control={
            control
          }
          name="birthDate"
          label="Data de nascimento"
          type="date"
        />

        <SelectField
          control={
            control
          }
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
          control={
            control
          }
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
          control={
            control
          }
          label="Nacionalidade"
          name="nationality"
        />

        <TextField
          control={
            control
          }
          label="Escolaridade"
          name="education"
        />
      </div>

      <div className="my-6 border-t" />

      <div>
        <div className="mb-4">
          <h3 className="text-sm font-semibold">
            Filiação
          </h3>

          <p className="mt-0.5 text-xs text-muted-foreground">
            Informações úteis para requerimentos e identificação documental.
          </p>
        </div>

        <div className="grid gap-x-5 gap-y-5 md:grid-cols-2">
          <TextField
            control={
              control
            }
            name="motherName"
            label="Nome da mãe"
          />

          <TextField
            control={
              control
            }
            name="fatherName"
            label="Nome do pai"
          />
        </div>
      </div>
    </FormSection>
  );

  const professionalSection = (
    <FormSection
      icon={
        BadgeDollarSign
      }
      title="Dados profissionais e previdenciários"
      description="Informações profissionais, econômicas e previdenciárias do cliente."
    >
      <div className="grid gap-x-5 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
        <TextField
          control={
            control
          }
          label="Profissão"
          name="profession"
        />

        {canWriteFinance ? (
          <CurrencyField
            control={
              control
            }
            label="Renda mensal"
            name="income"
          />
        ) : null}

        <TextField
          control={
            control
          }
          label="PIS / PASEP / NIT"
          name="pis"
        />
      </div>
    </FormSection>
  );

  const addressSection = (
    <FormSection
      icon={
        MapPin
      }
      title="Endereço"
      description="Endereço residencial informado pelo cliente."
    >
      <div className="grid gap-x-5 gap-y-5 md:grid-cols-2 xl:grid-cols-6">
        <div className="xl:col-span-2">
          <CepField
            control={
              control
            }
            setValue={
              setValue
            }
          />
        </div>

        <div className="md:col-span-1 xl:col-span-3">
          <TextField
            control={
              control
            }
            label="Endereço"
            name="address"
          />
        </div>

        <div className="xl:col-span-1">
          <TextField
            control={
              control
            }
            label="Número"
            name="addressNumber"
          />
        </div>

        <div className="md:col-span-2 xl:col-span-2">
          <TextField
            control={
              control
            }
            label="Complemento"
            name="complement"
          />
        </div>

        <div className="xl:col-span-2">
          <TextField
            control={
              control
            }
            label="Bairro"
            name="neighborhood"
          />
        </div>

        <div className="xl:col-span-1">
          <TextField
            control={
              control
            }
            label="Cidade"
            name="city"
          />
        </div>

        <div className="xl:col-span-1">
          <TextField
            control={
              control
            }
            label="UF"
            name="state"
          />
        </div>
      </div>
    </FormSection>
  );

  const govSection =
    canManageGov ? (
      <FormSection
        icon={
          KeyRound
        }
        title="Acesso Gov.br"
        description="Credenciais utilizadas somente quando necessárias para a prestação do serviço."
        tone="amber"
      >
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
          Estes dados são sensíveis. Preencha somente quando o acesso à conta Gov.br for necessário para o atendimento.
        </div>

        <div className="grid gap-x-5 gap-y-5 md:grid-cols-2">
          <TextField
            control={
              control
            }
            label="Login Gov.br"
            name="govLogin"
          />

          <PasswordField
            control={
              control
            }
            name="govPassword"
            label="Senha Gov.br"
          />
        </div>
      </FormSection>
    ) : null;

  const notesSection = (
    <FormSection
      icon={
        FileText
      }
      title="Observações"
      description="Anotações gerais relevantes para o atendimento e acompanhamento do cliente."
    >
      <TextareaField
        control={
          control
        }
        name="notes"
        label="Observações internas"
      />
    </FormSection>
  );

  return (
    <form
      action={
        action
      }
      className="mx-auto w-full max-w-6xl"
    >
      <div className="mb-6 overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserRound className="size-6" />
            </div>

            <div>
              <p className="text-sm font-medium text-primary">
                Clientes
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight">
                {client
                  ? "Editar cliente"
                  : "Novo cliente"}
              </h1>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                {client
                  ? "Atualize os dados cadastrais e informações de contato deste cliente."
                  : "Cadastre agora apenas as informações essenciais. Os demais dados podem ser preenchidos a qualquer momento."}
              </p>
            </div>
          </div>

          {client ? (
            <div className="rounded-full border bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              Cadastro existente
            </div>
          ) : (
            <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
              Cadastro rápido
            </div>
          )}
        </div>
      </div>

      {client ? (
        <div className="space-y-5">
          <FormSection
            icon={
              UserRound
            }
            title="Identificação"
            description="Dados pessoais e informações básicas do cliente."
          >
            <div className="grid gap-x-5 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
              <div className="md:col-span-2">
                <TextField
                  control={
                    control
                  }
                  name="name"
                  label="Nome completo"
                />
              </div>

              <CpfField
                control={
                  control
                }
                name="cpf"
              />

              <TextField
                control={
                  control
                }
                name="rg"
                label="RG"
              />

              <TextField
                control={
                  control
                }
                name="birthDate"
                label="Data de nascimento"
                type="date"
              />

              <SelectField
                control={
                  control
                }
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
                control={
                  control
                }
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
                control={
                  control
                }
                label="Nacionalidade"
                name="nationality"
              />

              <TextField
                control={
                  control
                }
                label="Escolaridade"
                name="education"
              />
            </div>

            <div className="my-6 border-t" />

            <div>
              <div className="mb-4">
                <h3 className="text-sm font-semibold">
                  Filiação
                </h3>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Informações úteis para requerimentos e identificação documental.
                </p>
              </div>

              <div className="grid gap-x-5 gap-y-5 md:grid-cols-2">
                <TextField
                  control={
                    control
                  }
                  name="motherName"
                  label="Nome da mãe"
                />

                <TextField
                  control={
                    control
                  }
                  name="fatherName"
                  label="Nome do pai"
                />
              </div>
            </div>
          </FormSection>

          <FormSection
            icon={
              Contact
            }
            title="Contato"
            description="Canais utilizados para comunicação com o cliente."
          >
            <div className="grid gap-x-5 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
              <PhoneField
                control={
                  control
                }
                name="whatsapp"
                label="WhatsApp"
              />

              <PhoneField
                control={
                  control
                }
                name="phone"
                label="Telefone"
              />

              <TextField
                control={
                  control
                }
                label="E-mail"
                name="email"
                type="email"
              />
            </div>
          </FormSection>

          {professionalSection}

          {addressSection}

          {govSection}

          {notesSection}
        </div>
      ) : (
        <div className="space-y-5">
          <FormSection
            icon={
              Contact
            }
            title="Cadastro rápido"
            description="Informe os dados essenciais para identificar e contatar o cliente."
          >
            <div className="grid gap-x-5 gap-y-5 md:grid-cols-2 xl:grid-cols-3">
              <div className="md:col-span-2">
                <TextField
                  control={
                    control
                  }
                  name="name"
                  label="Nome completo"
                />
              </div>

              <CpfField
                control={
                  control
                }
                name="cpf"
              />

              <PhoneField
                control={
                  control
                }
                name="whatsapp"
                label="WhatsApp"
              />

              <PhoneField
                control={
                  control
                }
                name="phone"
                label="Telefone"
              />

              <TextField
                control={
                  control
                }
                label="E-mail"
                name="email"
                type="email"
              />
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Apenas o nome é obrigatório. Os demais dados podem ser completados posteriormente.
            </p>
          </FormSection>

          <details className="group overflow-hidden rounded-2xl border bg-card shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 transition hover:bg-muted/30 sm:px-6">
              <div>
                <p className="font-semibold">
                  Informações complementares
                </p>

                <p className="mt-0.5 text-sm text-muted-foreground">
                  Preencha agora somente se estas informações já estiverem disponíveis.
                </p>
              </div>

              <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>

            <div className="space-y-5 border-t bg-muted/10 p-4 sm:p-5">
              {personalComplement}

              {professionalSection}

              {addressSection}

              {govSection}

              {notesSection}
            </div>
          </details>
        </div>
      )}

      <div className="sticky bottom-4 z-10 mt-6">
        <div className="flex flex-col gap-3 rounded-2xl border bg-background/95 p-4 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">
              {client
                ? "Salvar alterações"
                : "Cadastrar cliente"}
            </p>

            <p className="text-xs text-muted-foreground">
              {client
                ? "Revise as informações antes de salvar."
                : "Você poderá completar ou alterar o cadastro posteriormente."}
            </p>
          </div>

          <div className="sm:min-w-48">
            <SubmitButton>
              <span className="inline-flex items-center gap-2">
                <Save className="size-4" />

                {client
                  ? "Salvar alterações"
                  : "Cadastrar cliente"}
              </span>
            </SubmitButton>
          </div>
        </div>
      </div>
    </form>
  );
}