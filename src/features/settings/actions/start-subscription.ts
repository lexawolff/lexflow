"use server";

import {
  z,
} from "zod";

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
  createAsaasCustomer,
  createAsaasSubscription,
  deleteAsaasSubscription,
  listAsaasSubscriptionPayments,
} from "@/lib/asaas";

import {
  getAppUrl,
} from "@/lib/email";

import {
  requireWorkspacePermission,
} from "@/lib/permissions";

import {
  BILLING_OPTIONS,
  PLAN_CODE,
} from "@/lib/plans";

import {
  prisma,
} from "@/lib/prisma";

import {
  PAID_PAYMENT_STATUSES,
} from "@/lib/subscription-state";

const startSubscriptionSchema = z.object({
  interval: z.enum(["MONTHLY", "YEARLY"]),
  method: z.enum(["PIX", "BOLETO", "CREDIT_CARD"]),
});

function todayInSaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

async function listPaymentsIfExists(subscriptionId: string) {
  try {
    return await listAsaasSubscriptionPayments(subscriptionId);
  } catch (error) {
    if (error instanceof AsaasError && error.status === 404) {
      return [];
    }

    throw error;
  }
}

/*
 * Cria a assinatura no Asaas e devolve o link da primeira fatura, onde o
 * proprietário paga por Pix, boleto ou cartão. A liberação do escritório
 * acontece quando o Asaas confirmar o pagamento.
 */
async function startSubscriptionImpl(
  formData: FormData,
): Promise<ActionResult<{ invoiceUrl: string }>> {
  const { workspace, user } = await requireWorkspacePermission("BILLING_MANAGE");

  const parsed = startSubscriptionSchema.safeParse({
    interval: formData.get("interval"),
    method: formData.get("method"),
  });

  if (!parsed.success) {
    throw new ActionError("Escolha o plano e a forma de pagamento.");
  }

  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId: workspace.id },
    select: {
      id: true,
      status: true,
      providerCustomerId: true,
      providerSubscriptionId: true,
    },
  });

  if (!subscription) {
    throw new ActionError("Este escritório não tem um período de teste para transformar em assinatura.");
  }

  if (subscription.status === "ACTIVE") {
    throw new ActionError("A assinatura deste escritório já está ativa.");
  }

  if (subscription.status === "PAST_DUE") {
    throw new ActionError("Há uma fatura em atraso. Pague em Configurações > Assinatura para regularizar.");
  }

  const billing = await prisma.billingProfile.findUnique({
    where: { workspaceId: workspace.id },
    select: { name: true, taxId: true, email: true },
  });

  if (!billing?.taxId) {
    throw new ActionError("Informe o CPF ou CNPJ em Configurações > Assinatura antes de assinar.");
  }

  const option = BILLING_OPTIONS[parsed.data.interval];

  try {
    // Tentativa anterior sem pagamento é substituída; com pagamento, nunca.
    // Assinatura cancelada não é reaproveitada: começa outra.
    if (subscription.providerSubscriptionId && subscription.status !== "CANCELED") {
      const previous = await listPaymentsIfExists(subscription.providerSubscriptionId);

      if (previous.some((payment) => PAID_PAYMENT_STATUSES.includes(payment.status))) {
        throw new ActionError("Já recebemos um pagamento desta assinatura. A liberação do escritório acontece em instantes.");
      }

      if (previous.length > 0) {
        await deleteAsaasSubscription(subscription.providerSubscriptionId);
      }
    }

    let customerId = subscription.providerCustomerId;

    if (!customerId) {
      customerId = await createAsaasCustomer({
        name: billing.name || workspace.name,
        cpfCnpj: billing.taxId,
        email: billing.email || user.email,
        externalReference: workspace.id,
      });

      // Guarda logo, para não criar outro cliente numa nova tentativa.
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { provider: "asaas", providerCustomerId: customerId },
      });
    }

    // A volta ao LexFlow depois do pagamento exige um site cadastrado no
    // Asaas; só é pedida com o endereço público (https).
    const appUrl = getAppUrl();
    const callback = appUrl.startsWith("https://")
      ? { successUrl: `${appUrl}/configuracoes/assinatura?pagamento=concluido`, autoRedirect: true }
      : undefined;

    const created = await createAsaasSubscription({
      customer: customerId,
      billingType: parsed.data.method,
      value: option.amountCents / 100,
      cycle: option.cycle,
      nextDueDate: todayInSaoPaulo(),
      description: `${option.planName} - ${workspace.name}`.slice(0, 500),
      externalReference: workspace.id,
      ...(callback ? { callback } : {}),
    });

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        provider: "asaas",
        providerSubscriptionId: created.id,
        billingInterval: parsed.data.interval,
        amountCents: option.amountCents,
        planCode: PLAN_CODE,
      },
    });

    const payments = await listAsaasSubscriptionPayments(created.id);
    const invoiceUrl = payments.find(
      (payment) => payment.invoiceUrl && !PAID_PAYMENT_STATUSES.includes(payment.status),
    )?.invoiceUrl;

    if (!invoiceUrl) {
      throw new ActionError("A assinatura foi criada, mas a fatura ainda não ficou pronta. Tente de novo em instantes.");
    }

    return { success: true, data: { invoiceUrl } };
  } catch (error) {
    if (error instanceof AsaasError) {
      console.error("Asaas recusou a assinatura:", error.status, error.descriptions.join(" | "));

      if (error.status === 400 && error.descriptions.length > 0) {
        throw new ActionError(`O Asaas recusou a cobrança: ${error.descriptions[0]}`);
      }
    }

    throw error;
  }
}

export async function startSubscription(
  formData: FormData,
): Promise<ActionResult<{ invoiceUrl: string }>> {
  return runActionResult(() => startSubscriptionImpl(formData));
}
