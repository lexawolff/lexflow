import Link from "next/link";

import {
  CreditCard,
} from "lucide-react";

import {
  TRIAL_DAYS,
} from "@/lib/trial";

type SubscribePanelProps = {
  canSubscribe: boolean;
  contactHref: string;
  deletionDate: string;
};

export function SubscribePanel({
  canSubscribe,
  contactHref,
  deletionDate,
}: SubscribePanelProps) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center">
      <div className="w-full rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CreditCard className="size-7" />
        </div>

        <h1 className="mt-5 text-2xl font-bold">
          Assine o LexFlow
        </h1>

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

        {canSubscribe ? (
          <>
            <a
              href={contactHref}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-bold tracking-wide text-primary-foreground transition hover:bg-primary/90"
            >
              ASSINE
            </a>

            <p className="mt-3 text-xs text-muted-foreground">
              Abre um e-mail para combinarmos a sua assinatura.
            </p>

            <Link
              href="/configuracoes/assinatura"
              className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
            >
              Conferir dados de cobrança
            </Link>
          </>
        ) : (
          <p className="mt-6 rounded-xl bg-muted/50 px-4 py-3 text-sm">
            Peça ao proprietário do escritório para concluir a assinatura.
          </p>
        )}
      </div>
    </div>
  );
}
