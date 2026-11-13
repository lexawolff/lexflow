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
  requireWorkspacePagePermission,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

export default async function AssinaturaPage() {
  const {
    workspace,
    membership,
  } =
    await requireWorkspacePagePermission(
      "BILLING_MANAGE",
    );

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