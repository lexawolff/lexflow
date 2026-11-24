"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  ActionError,
} from "@/lib/actions/action-error";

import type {
  ActionResult,
} from "@/lib/actions/action-result";

import {
  runActionResult,
} from "@/lib/actions/run-action";

import {
  AsaasError,
  deleteAsaasSubscription,
} from "@/lib/asaas";

import {
  formatDate,
} from "@/lib/format/date";

import {
  requireWorkspacePermission,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

import {
  syncAsaasSubscription,
} from "../services/sync-asaas-subscription";

/*
 * Cancela a assinatura no Asaas: as próximas cobranças deixam de ser
 * geradas e o acesso continua até o fim do período já pago.
 */
async function cancelSubscriptionImpl(): Promise<ActionResult<{ accessUntil: string | null }>> {
  const { workspace } = await requireWorkspacePermission("BILLING_MANAGE");

  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId: workspace.id },
    select: { id: true, status: true, providerSubscriptionId: true },
  });

  if (
    !subscription?.providerSubscriptionId ||
    (subscription.status !== "ACTIVE" && subscription.status !== "PAST_DUE")
  ) {
    throw new ActionError("Não há uma assinatura ativa para cancelar.");
  }

  try {
    await deleteAsaasSubscription(subscription.providerSubscriptionId);
  } catch (error) {
    // Já removida no Asaas: segue para atualizar o LexFlow.
    if (!(error instanceof AsaasError && error.status === 404)) {
      throw error;
    }
  }

  await syncAsaasSubscription(subscription.id);

  const updated = await prisma.subscription.findUnique({
    where: { id: subscription.id },
    select: { currentPeriodEnd: true },
  });

  revalidatePath("/configuracoes/assinatura");

  const accessUntil = updated?.currentPeriodEnd ? formatDate(updated.currentPeriodEnd) : null;

  return {
    success: true,
    data: { accessUntil },
    message: accessUntil
      ? `Assinatura cancelada. O acesso completo continua até ${accessUntil}.`
      : "Assinatura cancelada.",
  };
}

export async function cancelSubscription(): Promise<ActionResult<{ accessUntil: string | null }>> {
  return runActionResult(() => cancelSubscriptionImpl());
}
