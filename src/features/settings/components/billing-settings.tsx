"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useState,
  useTransition,
} from "react";

import {
  Building2,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Loader2,
  LockKeyhole,
  MapPin,
  ReceiptText,
  Save,
  UsersRound,
} from "lucide-react";

import {
  updateBillingProfileAction,
} from "@/features/settings/actions/update-billing-profile";

type SubscriptionData = {
  planName:
    string | null;

  status:
    string | null;

  billingInterval:
    string | null;

  amountCents:
    number | null;

  currentPeriodEnd:
    string | null;

  trialEndsAt:
    string | null;

  cancelAtPeriodEnd:
    boolean;
};

type BillingProfileData = {
  name:
    string | null;

  taxId:
    string | null;

  email:
    string | null;

  phone:
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
  subscription:
    SubscriptionData | null;

  billingProfile:
    BillingProfileData | null;

  memberCount:
    number;

  isOwner:
    boolean;
};

const statusLabels: Record<
  string,
  string
> = {
  TRIALING:
    "Período de teste",

  ACTIVE:
    "Ativa",

  PAST_DUE:
    "Pagamento pendente",

  CANCELED:
    "Cancelada",

  INCOMPLETE:
    "Incompleta",
};

function digits(
  value: string,
) {
  return value.replace(
    /\D/g,
    "",
  );
}

function formatTaxId(
  value: string,
) {
  const number =
    digits(
      value,
    ).slice(
      0,
      14,
    );

  if (
    number.length <= 11
  ) {
    return number
      .replace(
        /(\d{3})(\d)/,
        "$1.$2",
      )
      .replace(
        /(\d{3})(\d)/,
        "$1.$2",
      )
      .replace(
        /(\d{3})(\d{1,2})$/,
        "$1-$2",
      );
  }

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

function formatCep(
  value: string,
) {
  return digits(
    value,
  )
    .slice(
      0,
      8,
    )
    .replace(
      /^(\d{5})(\d)/,
      "$1-$2",
    );
}

function formatMoney(
  cents: number,
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style:
        "currency",

      currency:
        "BRL",
    },
  ).format(
    cents /
      100,
  );
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle:
        "medium",

      timeZone:
        "America/Sao_Paulo",
    },
  ).format(
    new Date(
      value,
    ),
  );
}

export function BillingSettings({
  subscription,
  billingProfile,
  memberCount,
  isOwner,
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
    taxId,
    setTaxId,
  ] =
    useState(
      formatTaxId(
        billingProfile
          ?.taxId ??
          "",
      ),
    );

  const [
    phone,
    setPhone,
  ] =
    useState(
      formatPhone(
        billingProfile
          ?.phone ??
          "",
      ),
    );

  const [
    cep,
    setCep,
  ] =
    useState(
      formatCep(
        billingProfile
          ?.cep ??
          "",
      ),
    );

  function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!isOwner) {
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
          await updateBillingProfileAction(
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
          "Dados de cobrança atualizados com sucesso.",
        );
      },
    );
  }

  const inputClass =
    [
      "mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none transition",
      isOwner
        ? "bg-background focus:border-primary focus:ring-2 focus:ring-primary/20"
        : "cursor-not-allowed bg-muted/40 text-muted-foreground",
    ].join(
      " ",
    );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={
            <CreditCard className="size-5" />
          }
          title="Plano atual"
          value={
            subscription
              ?.planName ??
            "Não configurado"
          }
          description={
            subscription
              ? statusLabels[
                  subscription.status ??
                    ""
                ] ??
                "Status não definido"
              : "Nenhuma assinatura comercial está vinculada a este escritório."
          }
        />

        <SummaryCard
          icon={
            <UsersRound className="size-5" />
          }
          title="Usuários"
          value={String(
            memberCount,
          )}
          description="Membros atualmente vinculados ao escritório."
        />

        <SummaryCard
          icon={
            <CalendarClock className="size-5" />
          }
          title={
            subscription
              ?.status ===
            "TRIALING"
              ? "Fim do teste"
              : "Próxima renovação"
          }
          value={
            subscription
              ?.status ===
              "TRIALING" &&
            subscription.trialEndsAt
              ? formatDate(
                  subscription.trialEndsAt,
                )
              : subscription
                    ?.currentPeriodEnd
                ? formatDate(
                    subscription.currentPeriodEnd,
                  )
                : "—"
          }
          description={
            subscription
              ?.cancelAtPeriodEnd
              ? "A assinatura está marcada para encerramento ao fim do período."
              : "Data informada pelo sistema de cobrança."
          }
        />
      </section>

      {subscription ? (
        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="flex items-start gap-3 border-b p-5 sm:p-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <ReceiptText className="size-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Detalhes da assinatura
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Informações do plano atualmente vinculado ao escritório.
              </p>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-4">
            <Detail
              title="Plano"
              value={
                subscription.planName ??
                "—"
              }
            />

            <Detail
              title="Status"
              value={
                statusLabels[
                  subscription.status ??
                    ""
                ] ??
                "—"
              }
            />

            <Detail
              title="Periodicidade"
              value={
                subscription.billingInterval ===
                "MONTHLY"
                  ? "Mensal"
                  : subscription.billingInterval ===
                      "YEARLY"
                    ? "Anual"
                    : "—"
              }
            />

            <Detail
              title="Valor"
              value={
                subscription.amountCents !==
                null
                  ? formatMoney(
                      subscription.amountCents,
                    )
                  : "—"
              }
            />
          </div>
        </section>
      ) : null}

      {!isOwner ? (
        <div className="flex gap-3 rounded-2xl border bg-muted/30 p-4 text-sm">
          <LockKeyhole className="mt-0.5 size-5 shrink-0 text-muted-foreground" />

          <div>
            <p className="font-semibold">
              Dados protegidos
            </p>

            <p className="mt-1 text-muted-foreground">
              Apenas o proprietário do escritório pode alterar as informações de cobrança.
            </p>
          </div>
        </div>
      ) : null}

      <form
        onSubmit={
          submit
        }
        className="space-y-6"
      >
        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="flex items-start gap-3 border-b p-5 sm:p-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <Building2 className="size-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Dados de cobrança
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Informações do titular responsável pela contratação e faturamento do LexFlow.
              </p>
            </div>
          </div>

          <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-2">
            <Field label="Nome ou razão social">
              <input
                name="name"
                defaultValue={
                  billingProfile
                    ?.name ??
                  ""
                }
                disabled={
                  !isOwner
                }
                className={
                  inputClass
                }
              />
            </Field>

            <Field label="CPF ou CNPJ">
              <input
                name="taxId"
                value={
                  taxId
                }
                onChange={(
                  event:
                    ChangeEvent<HTMLInputElement>,
                ) =>
                  setTaxId(
                    formatTaxId(
                      event.target.value,
                    ),
                  )
                }
                disabled={
                  !isOwner
                }
                inputMode="numeric"
                className={
                  inputClass
                }
              />
            </Field>

            <Field label="E-mail de cobrança">
              <input
                name="email"
                type="email"
                defaultValue={
                  billingProfile
                    ?.email ??
                  ""
                }
                disabled={
                  !isOwner
                }
                className={
                  inputClass
                }
              />
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
                  !isOwner
                }
                className={
                  inputClass
                }
              />
            </Field>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border bg-card">
          <div className="flex items-start gap-3 border-b p-5 sm:p-6">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <MapPin className="size-5" />
            </div>

            <div>
              <h2 className="font-semibold">
                Endereço de cobrança
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Endereço utilizado exclusivamente para faturamento.
              </p>
            </div>
          </div>

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
                  !isOwner
                }
                inputMode="numeric"
                className={
                  inputClass
                }
              />
            </Field>

            <Field label="Endereço">
              <input
                name="address"
                defaultValue={
                  billingProfile
                    ?.address ??
                  ""
                }
                disabled={
                  !isOwner
                }
                className={
                  inputClass
                }
              />
            </Field>

            <Field label="Número">
              <input
                name="addressNumber"
                defaultValue={
                  billingProfile
                    ?.addressNumber ??
                  ""
                }
                disabled={
                  !isOwner
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
                  billingProfile
                    ?.complement ??
                  ""
                }
                disabled={
                  !isOwner
                }
                className={
                  inputClass
                }
              />
            </Field>

            <Field label="Bairro">
              <input
                name="neighborhood"
                defaultValue={
                  billingProfile
                    ?.neighborhood ??
                  ""
                }
                disabled={
                  !isOwner
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
                    billingProfile
                      ?.city ??
                    ""
                  }
                  disabled={
                    !isOwner
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
                    billingProfile
                      ?.state ??
                    ""
                  }
                  disabled={
                    !isOwner
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

        {isOwner ? (
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
                : "Salvar dados de cobrança"}
            </button>
          </div>
        ) : null}
      </form>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  description,
}: {
  icon:
    React.ReactNode;

  title:
    string;

  value:
    string;

  description:
    string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
        {
          icon
        }
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {
          title
        }
      </p>

      <p className="mt-1 text-xl font-semibold">
        {
          value
        }
      </p>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {
          description
        }
      </p>
    </div>
  );
}

function Detail({
  title,
  value,
}: {
  title:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {
          title
        }
      </p>

      <p className="mt-2 text-sm font-medium">
        {
          value
        }
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label:
    string;

  children:
    React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">
        {
          label
        }
      </span>

      {
        children
      }
    </label>
  );
}