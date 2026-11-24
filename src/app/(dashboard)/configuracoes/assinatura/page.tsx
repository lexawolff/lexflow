import Link from "next/link";

import {
  UserRole,
} from "@prisma/client";

import {
  CreditCard,
} from "lucide-react";

import {
  AppShell,
} from "@/components/app-shell/app-shell";

import {
  SettingsNav,
} from "@/components/settings/settings-nav";

import {
  BillingSettings,
} from "@/features/settings/components/billing-settings";

import {
  listAsaasSubscriptionPayments,
} from "@/lib/asaas";

import {
  requireWorkspacePagePermission,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDueDate(value: string) {
  const [year, month, day] = value.split("-");

  return `${day}/${month}/${year}`;
}

async function getOpenInvoice(providerSubscriptionId: string) {
  try {
    const payments = await listAsaasSubscriptionPayments(providerSubscriptionId);
    const open = payments
      .filter((payment) => (payment.status === "PENDING" || payment.status === "OVERDUE") && payment.invoiceUrl)
      .sort((first, second) => first.dueDate.localeCompare(second.dueDate))[0];

    if (!open?.invoiceUrl) {
      return null;
    }

    return {
      invoiceUrl: open.invoiceUrl,
      dueDate: formatDueDate(open.dueDate),
      overdue: open.status === "OVERDUE",
      value: typeof open.value === "number" ? open.value : null,
    };
  } catch {
    // Sem resposta do Asaas, a página abre sem o atalho da fatura.
    console.error("Falha ao consultar fatura em aberto no Asaas.");
    return null;
  }
}

export default async function AssinaturaPage({
  searchParams,
}: {
  searchParams: Promise<{ pagamento?: string }>;
}) {
  const {
    workspace,
    membership,
  } =
    await requireWorkspacePagePermission(
      "BILLING_MANAGE",
    );

  const { pagamento } = await searchParams;

  const [
    subscription,
    billingProfile,
    memberCount,
  ] =
    await Promise.all([
      prisma.subscription.findUnique({
        where: {
          workspaceId:
            workspace.id,
        },

        select: {
          planName:
            true,

          status:
            true,

          billingInterval:
            true,

          amountCents:
            true,

          trialEndsAt:
            true,

          currentPeriodEnd:
            true,

          cancelAtPeriodEnd:
            true,

          providerSubscriptionId:
            true,
        },
      }),

      prisma.billingProfile.findUnique({
        where: {
          workspaceId:
            workspace.id,
        },

        select: {
          name: true,

          taxId: true,

          email: true,

          phone: true,

          cep: true,

          address:
            true,

          addressNumber:
            true,

          complement:
            true,

          neighborhood:
            true,

          city: true,

          state: true,
        },
      }),

      prisma.membership.count({
        where: {
          workspaceId:
            workspace.id,
        },
      }),
    ]);

  const isOwner =
    membership.role ===
    UserRole.OWNER;

  // Fatura aguardando pagamento (primeira cobrança ou em atraso).
  const openInvoice =
    isOwner &&
    subscription?.providerSubscriptionId &&
    (subscription.status === "TRIALING" || subscription.status === "PAST_DUE")
      ? await getOpenInvoice(subscription.providerSubscriptionId)
      : null;

  const canSubscribe =
    isOwner &&
    (subscription?.status === "TRIALING" || subscription?.status === "CANCELED");

  return (
    <AppShell>
      <div className="space-y-7">
        <header className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <CreditCard className="size-5" />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Assinatura e faturamento
              </h1>

              <p className="mt-1 max-w-2xl text-muted-foreground">
                Consulte a assinatura do LexFlow e gerencie os dados utilizados para cobrança.
              </p>
            </div>
          </div>

          <SettingsNav />
        </header>

        {pagamento === "concluido" ? (
          <div
            role="status"
            className="rounded-2xl border border-emerald-200! bg-emerald-50 px-5 py-4 text-sm text-emerald-900 dark:border-emerald-900! dark:bg-emerald-950/20 dark:text-emerald-200"
          >
            Pagamento enviado. Assim que o Asaas confirmar, a assinatura é ativada.
          </div>
        ) : null}

        {openInvoice ? (
          <div
            className={`flex flex-col gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${openInvoice.overdue ? "border-red-200! bg-red-50 dark:border-red-900! dark:bg-red-950/20" : "bg-card"}`}
          >
            <div>
              <p className="font-semibold">
                {openInvoice.overdue ? "Fatura em atraso" : "Fatura aguardando pagamento"}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {openInvoice.value !== null ? `${formatMoney(openInvoice.value)} · ` : ""}
                vencimento em {openInvoice.dueDate}
              </p>
            </div>

            <a
              href={openInvoice.invoiceUrl}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold tracking-wide text-primary-foreground transition hover:bg-primary/90"
            >
              PAGAR FATURA
            </a>
          </div>
        ) : null}

        {canSubscribe ? (
          <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">
                {openInvoice ? "Prefere outro plano ou forma de pagamento?" : "Assine o LexFlow"}
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                R$ 59,00 por mês ou R$ 590,00 por ano, por Pix, boleto ou cartão.
              </p>
            </div>

            <Link
              href="/assinar"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold tracking-wide text-primary-foreground transition hover:bg-primary/90"
            >
              ASSINE
            </Link>
          </div>
        ) : null}

        <BillingSettings
          subscription={
            subscription
              ? {
                  planName:
                    subscription.planName,

                  status:
                    subscription.status,

                  billingInterval:
                    subscription.billingInterval,

                  amountCents:
                    subscription.amountCents,

                  trialEndsAt:
                    subscription.trialEndsAt?.toISOString() ??
                    null,

                  currentPeriodEnd:
                    subscription.currentPeriodEnd?.toISOString() ??
                    null,

                  cancelAtPeriodEnd:
                    subscription.cancelAtPeriodEnd,
                }
              : null
          }
          billingProfile={
            billingProfile
          }
          memberCount={
            memberCount
          }
          isOwner={
            isOwner
          }
        />
      </div>
    </AppShell>
  );
}