"use client";

import Link from "next/link";

import {
  useState,
  useTransition,
} from "react";

import {
  CreditCard,
  Loader2,
  LockKeyhole,
} from "lucide-react";

import {
  startSubscription,
} from "@/features/settings/actions/start-subscription";

import {
  BILLING_OPTIONS,
  type BillingIntervalKey,
  PAYMENT_METHODS,
  type PaymentMethodKey,
  PLAN_MAX_USERS,
} from "@/lib/plans";

import {
  TRIAL_DAYS,
} from "@/lib/trial";

type SubscribePanelProps = {
  canSubscribe: boolean;
  hasTaxId: boolean;
  // Teste encerrado: data em que os dados serão apagados.
  deletionDate: string | null;
  // Teste em andamento: data de término.
  trialEndDate: string | null;
};

function optionClass(selected: boolean) {
  return [
    "flex w-full cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition",
    selected
      ? "border-primary! bg-primary/5 ring-2 ring-primary/20"
      : "bg-background hover:bg-muted/40",
  ].join(" ");
}

export function SubscribePanel({
  canSubscribe,
  hasTaxId,
  deletionDate,
  trialEndDate,
}: SubscribePanelProps) {
  const [selectedInterval, setSelectedInterval] = useState<BillingIntervalKey>("MONTHLY");
  const [method, setMethod] = useState<PaymentMethodKey>("PIX");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);

    const formData = new FormData();
    formData.set("interval", selectedInterval);
    formData.set("method", method);

    startTransition(async () => {
      const result = await startSubscription(formData);

      if (!result.success) {
        setError(result.message);
        return;
      }

      // Pagamento na página do Asaas: o LexFlow não recebe dados do cartão.
      window.location.assign(result.data.invoiceUrl);
    });
  }

  return (
    <div className="mx-auto max-w-2xl py-4">
      <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CreditCard className="size-7" />
        </div>

        <h1 className="mt-5 text-2xl font-bold">
          Assine o LexFlow
        </h1>

        {deletionDate ? (
          <>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Os {TRIAL_DAYS} dias de teste grátis terminaram. Nada foi apagado: você
              continua consultando os dados do escritório e volta a cadastrar e
              editar assim que a assinatura for ativada.
            </p>

            <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              Sem assinatura até <strong>{deletionDate}</strong>, os dados, os
              arquivos e as contas ligadas só a este escritório serão apagados
              definitivamente.
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {trialEndDate
              ? `Seu teste grátis vai até ${trialEndDate}. Assinando agora, o acesso continua sem interrupção.`
              : "Escolha o plano e a forma de pagamento."}
          </p>
        )}

        {!canSubscribe ? (
          <p className="mt-6 rounded-xl bg-muted/50 px-4 py-3 text-sm">
            Peça ao proprietário do escritório para concluir a assinatura.
          </p>
        ) : (
          <>
            <fieldset className="mt-7">
              <legend className="text-sm font-semibold">
                Plano
              </legend>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(Object.keys(BILLING_OPTIONS) as BillingIntervalKey[]).map((key) => {
                  const option = BILLING_OPTIONS[key];

                  return (
                    <label key={key} className={optionClass(selectedInterval === key)}>
                      <input
                        type="radio"
                        name="interval"
                        value={key}
                        checked={selectedInterval === key}
                        onChange={() => setSelectedInterval(key)}
                        className="mt-1 accent-primary"
                      />

                      <span>
                        <span className="flex flex-wrap items-center gap-2 font-semibold">
                          {option.label}

                          {option.note ? (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                              {option.note}
                            </span>
                          ) : null}
                        </span>

                        <span className="mt-1 block text-sm text-muted-foreground">
                          {option.priceLabel}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                Até {PLAN_MAX_USERS} usuários por escritório, contando você.
              </p>
            </fieldset>

            <fieldset className="mt-6">
              <legend className="text-sm font-semibold">
                Forma de pagamento
              </legend>

              <div className="mt-3 space-y-3">
                {(Object.keys(PAYMENT_METHODS) as PaymentMethodKey[]).map((key) => (
                  <label key={key} className={optionClass(method === key)}>
                    <input
                      type="radio"
                      name="method"
                      value={key}
                      checked={method === key}
                      onChange={() => setMethod(key)}
                      className="mt-1 accent-primary"
                    />

                    <span>
                      <span className="block font-semibold">
                        {PAYMENT_METHODS[key].label}
                      </span>

                      <span className="mt-0.5 block text-sm text-muted-foreground">
                        {PAYMENT_METHODS[key].description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            {!hasTaxId ? (
              <p role="alert" className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                Para assinar, informe o CPF ou CNPJ em{" "}
                <Link href="/configuracoes/assinatura" className="font-semibold underline">
                  dados de cobrança
                </Link>
                .
              </p>
            ) : null}

            {error ? (
              <p role="alert" className="mt-6 rounded-xl border border-red-200! bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900! dark:bg-red-950/20 dark:text-red-300">
                {error}
              </p>
            ) : null}

            <button
              type="button"
              onClick={submit}
              disabled={pending || !hasTaxId}
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold tracking-wide text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {pending ? "Gerando a cobrança..." : "Ir para o pagamento"}
            </button>

            <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
              <LockKeyhole className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              O pagamento é feito na página segura do Asaas. O LexFlow não recebe os dados do cartão.
            </p>

            <Link
              href="/configuracoes/assinatura"
              className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
            >
              Conferir dados de cobrança
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
