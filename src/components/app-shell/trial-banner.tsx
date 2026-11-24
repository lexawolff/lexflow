import Link from "next/link";

import {
  AlertTriangle,
  LockKeyhole,
} from "lucide-react";

import {
  formatDate,
} from "@/lib/format/date";

import {
  getCurrentWorkspaceAccess,
} from "@/lib/permissions";

import {
  getPaymentGraceEndsAt,
} from "@/lib/subscription-state";

import {
  getTrialDataDeletionAt,
} from "@/lib/trial";

type BannerProps = {
  tone: "warning" | "danger";
  title: string;
  text: string;
  href: string;
  action: string;
};

export function AccessBanner({
  tone,
  title,
  text,
  href,
  action,
}: BannerProps) {
  const colors = tone === "danger"
    ? "border-red-200! bg-red-50 text-red-900 dark:border-red-900! dark:bg-red-950/30 dark:text-red-200"
    : "border-amber-200! bg-amber-50 text-amber-900 dark:border-amber-900! dark:bg-amber-950/30 dark:text-amber-200";
  const Icon = tone === "danger" ? AlertTriangle : LockKeyhole;

  return (
    <div
      role="status"
      className={`flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${colors}`}
    >
      <div className="flex min-w-0 items-start gap-2.5 text-sm">
        <Icon
          className="mt-0.5 size-4 shrink-0"
          aria-hidden="true"
        />

        <p>
          <strong className="font-semibold">
            {title}
          </strong>{" "}
          {text}
        </p>
      </div>

      <Link
        href={href}
        className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold tracking-wide text-primary-foreground transition hover:bg-primary/90"
      >
        {action}
      </Link>
    </div>
  );
}

export function TrialEndedBanner({
  deletionDate,
}: {
  deletionDate: string;
}) {
  return (
    <AccessBanner
      tone="warning"
      title="Seu teste grátis terminou."
      text={`Seus dados ficam disponíveis só para consulta até ${deletionDate} e depois serão apagados.`}
      href="/assinar"
      action="ASSINE"
    />
  );
}

/*
 * Aviso no topo de todas as páginas: teste encerrado, pagamento atrasado
 * (ainda na tolerância ou já bloqueado) ou assinatura cancelada.
 */
export async function TrialBanner() {
  const {
    readOnlyReason,
    trialEndsAt,
    subscriptionStatus,
    currentPeriodEnd,
  } =
    await getCurrentWorkspaceAccess();

  if (readOnlyReason === "trial" && trialEndsAt) {
    return (
      <TrialEndedBanner
        deletionDate={formatDate(getTrialDataDeletionAt(trialEndsAt))}
      />
    );
  }

  if (readOnlyReason === "past-due") {
    return (
      <AccessBanner
        tone="danger"
        title="Pagamento atrasado."
        text="O escritório está disponível só para consulta até a regularização."
        href="/configuracoes/assinatura"
        action="REGULARIZAR"
      />
    );
  }

  if (readOnlyReason === "canceled") {
    return (
      <AccessBanner
        tone="warning"
        title="Assinatura cancelada."
        text="Os dados continuam disponíveis só para consulta."
        href="/assinar"
        action="ASSINE"
      />
    );
  }

  // Ainda na tolerância: avisa antes de bloquear a edição.
  if (subscriptionStatus === "PAST_DUE" && currentPeriodEnd) {
    return (
      <AccessBanner
        tone="warning"
        title="Pagamento pendente."
        text={`Regularize até ${formatDate(getPaymentGraceEndsAt(currentPeriodEnd))} para continuar cadastrando e editando.`}
        href="/configuracoes/assinatura"
        action="PAGAR"
      />
    );
  }

  return null;
}
