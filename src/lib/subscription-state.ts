/*
 * Estado da assinatura e regras de acesso. Sem dependências de servidor:
 * usado também nas telas e nos testes.
 */

import {
  TRIAL_ENDED_MESSAGE,
} from "./trial";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

// Dias depois do fim do período pago antes de o escritório ficar só para consulta.
export const PAYMENT_GRACE_DAYS = 7;

// Cobrança paga ou confirmada no Asaas.
export const PAID_PAYMENT_STATUSES: readonly string[] = [
  "CONFIRMED",
  "RECEIVED",
  "RECEIVED_IN_CASH",
];

export type ReadOnlyReason = "trial" | "past-due" | "canceled";

export const READ_ONLY_MESSAGES: Record<ReadOnlyReason, string> = {
  trial: TRIAL_ENDED_MESSAGE,
  "past-due":
    "O pagamento da assinatura está atrasado. O escritório está disponível só para consulta até a regularização.",
  canceled:
    "A assinatura foi cancelada. O escritório está disponível só para consulta. Assine de novo para voltar a cadastrar e editar.",
};

type AccessSubscription = {
  status: string;
  trialEndsAt: Date | null;
  currentPeriodEnd?: Date | null;
};

export function getPaymentGraceEndsAt(
  currentPeriodEnd: Date,
): Date {
  return new Date(currentPeriodEnd.getTime() + PAYMENT_GRACE_DAYS * DAY_IN_MS);
}

/*
 * Motivo de o escritório estar só para consulta, ou null com acesso
 * completo. Escritórios sem assinatura registrada são anteriores ao teste
 * grátis e continuam com acesso completo.
 */
export function getReadOnlyReason(
  subscription: AccessSubscription | null | undefined,
  now: Date = new Date(),
): ReadOnlyReason | null {
  if (!subscription) {
    return null;
  }

  const time = now.getTime();
  const periodEnd = subscription.currentPeriodEnd ?? null;

  switch (subscription.status) {
    case "ACTIVE":
      return null;

    case "PAST_DUE":
      return !periodEnd || getPaymentGraceEndsAt(periodEnd).getTime() <= time
        ? "past-due"
        : null;

    case "CANCELED":
      // Quem cancela mantém o acesso até o fim do período já pago.
      return !periodEnd || periodEnd.getTime() <= time ? "canceled" : null;

    default:
      return subscription.trialEndsAt !== null && subscription.trialEndsAt.getTime() <= time
        ? "trial"
        : null;
  }
}

type PaymentSummary = {
  status: string;
  dueDate: string;
};

// Datas do Asaas chegam como "AAAA-MM-DD": meio-dia em UTC, como no resto do sistema.
function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day, 12));
}

function addCycle(
  start: Date,
  cycle: "MONTHLY" | "YEARLY",
): Date {
  const months = cycle === "YEARLY" ? 12 : 1;
  const year = start.getUTCFullYear();
  const month = start.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(year, month + 1, 0, 12)).getUTCDate();

  // 31/01 + 1 mês = 28 ou 29/02, sem pular para março.
  return new Date(Date.UTC(year, month, Math.min(start.getUTCDate(), lastDay), 12));
}

export type ComputedSubscriptionState = {
  status: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED";
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
};

/*
 * Estado da assinatura a partir do que o Asaas informa. Não depende da
 * ordem dos avisos: o mesmo conjunto de cobranças sempre dá o mesmo estado.
 */
export function computeSubscriptionState({
  providerActive,
  cycle,
  payments,
}: {
  providerActive: boolean;
  cycle: "MONTHLY" | "YEARLY";
  payments: PaymentSummary[];
}): ComputedSubscriptionState {
  const latestPaid = payments
    .filter((payment) => PAID_PAYMENT_STATUSES.includes(payment.status))
    .sort((first, second) => second.dueDate.localeCompare(first.dueDate))[0];

  // Nunca pago: continua no teste, com as regras do teste.
  if (!latestPaid) {
    return { status: "TRIALING", currentPeriodStart: null, currentPeriodEnd: null };
  }

  const currentPeriodStart = parseDateOnly(latestPaid.dueDate);
  const currentPeriodEnd = addCycle(currentPeriodStart, cycle);

  if (!providerActive) {
    return { status: "CANCELED", currentPeriodStart, currentPeriodEnd };
  }

  const overdue = payments.some((payment) => payment.status === "OVERDUE");

  return {
    status: overdue ? "PAST_DUE" : "ACTIVE",
    currentPeriodStart,
    currentPeriodEnd,
  };
}

// Cobrança vencida há mais de alguns dias, sem nunca ter havido pagamento.
export function isAbandonedFirstPayment(
  payments: PaymentSummary[],
  now: Date = new Date(),
  days: number = PAYMENT_GRACE_DAYS,
): boolean {
  return (
    !payments.some((payment) => PAID_PAYMENT_STATUSES.includes(payment.status)) &&
    payments.some(
      (payment) =>
        payment.status === "OVERDUE" &&
        parseDateOnly(payment.dueDate).getTime() + days * DAY_IN_MS <= now.getTime(),
    )
  );
}
