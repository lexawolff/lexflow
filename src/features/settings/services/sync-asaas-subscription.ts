import "server-only";

import {
  AsaasError,
  deleteAsaasSubscription,
  getAsaasSubscription,
  listAsaasSubscriptionPayments,
} from "@/lib/asaas";

import {
  BILLING_OPTIONS,
} from "@/lib/plans";

import {
  prisma,
} from "@/lib/prisma";

import {
  computeSubscriptionState,
  isAbandonedFirstPayment,
} from "@/lib/subscription-state";

// Assinatura ou cobranças apagadas no Asaas respondem 404.
async function ignoreNotFound<T>(
  promise: Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof AsaasError && error.status === 404) {
      return fallback;
    }

    throw error;
  }
}

/*
 * Atualiza a assinatura do LexFlow com o estado atual no Asaas. Pode ser
 * chamada várias vezes, por avisos repetidos ou fora de ordem: o resultado
 * depende só do que o Asaas informa agora.
 */
export async function syncAsaasSubscription(
  subscriptionId: string,
  now: Date = new Date(),
) {
  const local = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    select: {
      id: true,
      status: true,
      providerSubscriptionId: true,
      billingInterval: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      canceledAt: true,
    },
  });

  if (!local?.providerSubscriptionId) {
    return null;
  }

  const providerId = local.providerSubscriptionId;
  const remote = await ignoreNotFound(getAsaasSubscription(providerId), null);
  const payments = await ignoreNotFound(listAsaasSubscriptionPayments(providerId), []);
  const providerActive = Boolean(remote && !remote.deleted && remote.status === "ACTIVE");
  const cycle = local.billingInterval ?? (remote?.cycle === "YEARLY" ? "YEARLY" : "MONTHLY");

  let state = computeSubscriptionState({ providerActive, cycle, payments });
  const neverPaid = state.status === "TRIALING";

  // Primeira fatura abandonada: cancela no Asaas para não seguir gerando
  // cobranças a quem nunca pagou.
  const abandoned = neverPaid && providerActive && isAbandonedFirstPayment(payments, now);

  // Assinatura que já foi paga nunca volta a ser tratada como teste, mesmo
  // que o Asaas não mostre mais as cobranças: fica cancelada com o período
  // que o LexFlow já conhecia.
  const wasPaid = local.status === "ACTIVE" || local.status === "PAST_DUE" || local.status === "CANCELED";

  // Ex-assinante que voltou a assinar e ainda não pagou a primeira fatura:
  // fica sem data de cancelamento, para a conferência diária acompanhar.
  const awaitingReturn = neverPaid && wasPaid && providerActive && !abandoned;

  if (neverPaid && wasPaid) {
    state = {
      status: "CANCELED",
      currentPeriodStart: local.currentPeriodStart,
      currentPeriodEnd: local.currentPeriodEnd,
    };
  }

  const data: {
    status: typeof state.status;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    canceledAt: Date | null;
    planName?: string;
    providerSubscriptionId?: null;
  } = {
    status: state.status,
    currentPeriodStart: state.currentPeriodStart,
    currentPeriodEnd: state.currentPeriodEnd,
    canceledAt:
      state.status === "CANCELED" && !awaitingReturn
        ? local.canceledAt ?? now
        : null,
  };

  if (state.status !== "TRIALING") {
    data.planName = BILLING_OPTIONS[cycle].planName;
  }

  // Sem pagamento, o escritório volta às regras do teste (ou ao período
  // pago, para quem já foi assinante).
  if (abandoned) {
    await ignoreNotFound(deleteAsaasSubscription(providerId), undefined);
    data.providerSubscriptionId = null;
  }

  await prisma.subscription.update({
    where: { id: local.id },
    data,
  });

  return state.status;
}

// Quantas assinaturas a conferência diária revisa por execução.
const RECONCILE_PER_RUN = 50;

/*
 * Conferência diária: cobre avisos do Asaas que se perderam. Revisa as
 * assinaturas ligadas ao Asaas cujo período acaba em até um dia, ainda sem
 * período (aguardando o primeiro pagamento), em atraso ou de ex-assinantes
 * que voltaram a assinar e aguardam o primeiro pagamento.
 */
export async function reconcileAsaasSubscriptions(
  now: Date = new Date(),
) {
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const subscriptions = await prisma.subscription.findMany({
    where: {
      providerSubscriptionId: { not: null },
      OR: [
        { status: { in: ["TRIALING", "ACTIVE"] }, currentPeriodEnd: null },
        { status: { in: ["TRIALING", "ACTIVE"] }, currentPeriodEnd: { lte: soon } },
        { status: "PAST_DUE" },
        { status: "CANCELED", canceledAt: null },
      ],
    },
    orderBy: { updatedAt: "asc" },
    take: RECONCILE_PER_RUN,
    select: { id: true },
  });

  let synced = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    try {
      await syncAsaasSubscription(subscription.id, now);
      synced += 1;
    } catch {
      failed += 1;
      console.error("Falha ao conferir assinatura no Asaas:", subscription.id);
    }
  }

  return { synced, failed };
}
