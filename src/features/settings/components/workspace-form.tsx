"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useState,
  useTransition,
} from "react";

import {
  Building2,
  CheckCircle2,
  Globe2,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Save,
} from "lucide-react";

import {
  updateWorkspaceAction,
} from "@/features/settings/actions/update-workspace";

type WorkspaceData = {
  name: string;

  legalName:
    string | null;

  cnpj:
    string | null;

  oabRegistration:
    string | null;

  oabState:
    string | null;

  email:
    string | null;

  phone:
    string | null;

  whatsapp:
    string | null;

  website:
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
};

type Props = {
  workspace:
    WorkspaceData;

  canEdit:
    boolean;
};

function digits(
  value: string,
) {
  return value.replace(
    /\D/g,
    "",
  );
}

function formatCnpj(
  value: string,
) {
  const number =
    digits(
      value,
    ).slice(
      0,
      14,
    );

  return number
    .replace(
      /^(\d{2})(\d)/,
      "$1.$2",
    )
    .replace(
      /^(\d{2})\.(\d{3})(\d)/,
      "$1.$2.$3",
    )
    .replace(
      /\.(\d{3})(\d)/,
      ".$1/$2",
    )
    .replace(
      /(\d{4})(\d)/,
      "$1-$2",
    );
}

function formatCep(
  value: string,
) {
  const number =
    digits(
      value,
    ).slice(
      0,
      8,
    );

  return number.replace(
    /^(\d{5})(\d)/,
    "$1-$2",
  );
}

function formatPhone(
  value: string,
) {
  const number =
    digits(
      value,
    ).slice(
      0,
      11,
    );

  if (
    number.length <= 10
  ) {
    return number
      .replace(
        /^(\d{2})(\d)/,
        "($1) $2",
      )
      .replace(
        /(\d{4})(\d)/,
        "$1-$2",
      );
  }

  return number
    .replace(
      /^(\d{2})(\d)/,
      "($1) $2",
    )
    .replace(
      /(\d{5})(\d)/,
      "$1-$2",
    );
}

export function WorkspaceForm({
  workspace,
  canEdit,
}: Props) {
  const [
    isPending,
    startTransition,
  ] =
    useTransition();

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState<string | null>(
      null,
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null,
    );

  const [
    cnpj,
    setCnpj,
  ] =
    useState(
      formatCnpj(
        workspace.cnpj ??
          "",
      ),
    );

  const [
    phone,
    setPhone,
  ] =
    useState(
      formatPhone(
        workspace.phone ??
          "",
      ),
    );

  const [
    whatsapp,
    setWhatsapp,
  ] =
    useState(
      formatPhone(
        workspace.whatsapp ??
          "",
      ),
    );

  const [
    cep,
    setCep,
  ] =
    useState(
      formatCep(
        workspace.cep ??
          "",
      ),
    );

  function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!canEdit) {
      return;
    }

    setSuccessMessage(
      null,
    );

    setErrorMessage(
      null,
    );

    const formData =
      new FormData(
        event.currentTarget,
      );

    startTransition(
      async () => {
        const result =
          await updateWorkspaceAction(
            formData,
          );

        if (
          !result.success
        ) {
          setErrorMessage(
            result.error,
          );

          return;
        }

        setSuccessMessage(
          "Dados do escritório atualizados com sucesso.",
        );
      },
    );
  }

  const inputClass =
    [
      "mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none transition",
      canEdit
        ? "bg-background focus:border-primary focus:ring-2 focus:ring-primary/20"
        : "cursor-not-allowed bg-muted/40 text-muted-foreground",
    ].join(
      " ",
    );

  return (
    <form
      onSubmit={
        submit
      }
      className="space-y-6"
    >
      {!canEdit ? (
        <div className="flex gap-3 rounded-2xl border bg-muted/30 p-4 text-sm">
          <LockKeyhole className="mt-0.5 size-5 shrink-0 text-muted-foreground" />

          <div>
            <p className="font-semibold">
              Visualização somente
            </p>

            <p className="mt-1 text-muted-foreground">
              Apenas proprietários e administradores podem alterar os dados do escritório.
            </p>
          </div>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-2xl border bg-card">
        <SectionHeader
          icon={
            <Building2 className="size-5" />
          }
          title="Identificação do escritório"
          description="Dados institucionais utilizados para identificar o escritório dentro do LexFlow."
        />

        <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
          <Field
            label="Nome do escritório"
            required
          >
            <input
              name="name"
              defaultValue={
                workspace.name
              }
              disabled={
                !canEdit
              }
              required
              maxLength={
                120
              }
              className={
                inputClass
              }
            />
          </Field>

          <Field label="Razão social">
            <input
              name="legalName"
              defaultValue={
                workspace.legalName ??
                ""
              }
              disabled={
                !canEdit
              }
              maxLength={
                180
              }
              className={
                inputClass
              }
            />
          </Field>

          <Field label="CNPJ">
            <input
              name="cnpj"
              value={
                cnpj
              }
              onChange={(
                event:
                  ChangeEvent<HTMLInputElement>,
              ) =>
                setCnpj(
                  formatCnpj(
                    event.target.value,
                  ),
                )
              }
              disabled={
                !canEdit
              }
              inputMode="numeric"
              placeholder="00.000.000/0000-00"
              className={
                inputClass
              }
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-[1fr_100px]">
            <Field label="Registro da sociedade na OAB">
              <input
                name="oabRegistration"
                defaultValue={
                  workspace.oabRegistration ??
                  ""
                }
                disabled={
                  !canEdit
                }
                className={
                  inputClass
                }
              />
            </Field>

            <Field label="UF">
              <input
                name="oabState"
                defaultValue={
                  workspace.oabState ??
                  ""
                }
                disabled={
                  !canEdit
                }
                maxLength={
                  2
                }
                className={`${inputClass} uppercase`}
              />
            </Field>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <SectionHeader
          icon={
            <Mail className="size-5" />
          }
          title="Contato profissional"
          description="Canais institucionais de contato do escritório."
        />

        <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
          <Field label="E-mail">
            <input
              name="email"
              type="email"
              defaultValue={
                workspace.email ??
                ""
              }
              disabled={
                !canEdit
              }
              placeholder="contato@escritorio.com.br"
              className={
                inputClass
              }
            />
          </Field>

          <Field label="Site">
            <div className="relative">
              <Globe2 className="absolute left-3 top-[22px] size-4 text-muted-foreground" />

              <input
                name="website"
                defaultValue={
                  workspace.website ??
                  ""
                }
                disabled={
                  !canEdit
                }
                placeholder="www.escritorio.com.br"
                className={`${inputClass} pl-10`}
              />
            </div>
          </Field>

          <Field label="Telefone">
            <input
              name="phone"
              value={
                phone
              }
              onChange={(
                event:
                  ChangeEvent<HTMLInputElement>,
              ) =>
                setPhone(
                  formatPhone(
                    event.target.value,
                  ),
                )
              }
              disabled={
                !canEdit
              }
              inputMode="tel"
              placeholder="(00) 0000-0000"
              className={
                inputClass
              }
            />
          </Field>

          <Field label="WhatsApp">
            <input
              name="whatsapp"
              value={
                whatsapp
              }
              onChange={(
                event:
                  ChangeEvent<HTMLInputElement>,
              ) =>
                setWhatsapp(
                  formatPhone(
                    event.target.value,
                  ),
                )
              }
              disabled={
                !canEdit
              }
              inputMode="tel"
              placeholder="(00) 00000-0000"
              className={
                inputClass
              }
            />
          </Field>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <SectionHeader
          icon={
            <MapPin className="size-5" />
          }
          title="Endereço"
          description="Endereço profissional do escritório."
        />

        <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
          <Field label="CEP">
            <input
              name="cep"
              value={
                cep
              }
              onChange={(
                event:
                  ChangeEvent<HTMLInputElement>,
              ) =>
                setCep(
                  formatCep(
                    event.target.value,
                  ),
                )
              }
              disabled={
                !canEdit
              }
              inputMode="numeric"
              placeholder="00000-000"
              className={
                inputClass
              }
            />
          </Field>

          <Field label="Endereço">
            <input
              name="address"
              defaultValue={
                workspace.address ??
                ""
              }
              disabled={
                !canEdit
              }
              placeholder="Rua, avenida..."
              className={
                inputClass
              }
            />
          </Field>

          <Field label="Número">
            <input
              name="addressNumber"
              defaultValue={
                workspace.addressNumber ??
                ""
              }
              disabled={
                !canEdit
              }
              className={
                inputClass
              }
            />
          </Field>

          <Field label="Complemento">
            <input
              name="complement"
              defaultValue={
                workspace.complement ??
                ""
              }
              disabled={
                !canEdit
              }
              placeholder="Sala, andar..."
              className={
                inputClass
              }
            />
          </Field>

          <Field label="Bairro">
            <input
              name="neighborhood"
              defaultValue={
                workspace.neighborhood ??
                ""
              }
              disabled={
                !canEdit
              }
              className={
                inputClass
              }
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-[1fr_100px]">
            <Field label="Cidade">
              <input
                name="city"
                defaultValue={
                  workspace.city ??
                  ""
                }
                disabled={
                  !canEdit
                }
                className={
                  inputClass
                }
              />
            </Field>

            <Field label="UF">
              <input
                name="state"
                defaultValue={
                  workspace.state ??
                  ""
                }
                disabled={
                  !canEdit
                }
                maxLength={
                  2
                }
                className={`${inputClass} uppercase`}
              />
            </Field>
          </div>
        </div>
      </section>

      {successMessage ? (
        <div className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />

          {
            successMessage
          }
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {
            errorMessage
          }
        </div>
      ) : null}

      {canEdit ? (
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={
              isPending
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}

            {isPending
              ? "Salvando..."
              : "Salvar alterações"}
          </button>
        </div>
      ) : null}
    </form>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children:
    React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">
        {
          label
        }

        {required ? (
          <span className="ml-1 text-destructive">
            *
          </span>
        ) : null}
      </span>

      {
        children
      }
    </label>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon:
    React.ReactNode;

  title:
    string;

  description:
    string;
}) {
  return (
    <div className="flex items-start gap-3 border-b p-5 sm:p-6">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
        {
          icon
        }
      </div>

      <div>
        <h2 className="font-semibold">
          {
            title
          }
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          {
            description
          }
        </p>
      </div>
    </div>
  );
}