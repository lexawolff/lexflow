import {
  redirect,
} from "next/navigation";

import {
  AppShell,
} from "@/components/app-shell/app-shell";

import {
  SubscribePanel,
} from "@/features/settings/components/subscribe-panel";

import {
  formatDate,
} from "@/lib/format/date";

import {
  getCurrentWorkspaceAccess,
  hasPermission,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

import {
  getTrialDataDeletionAt,
} from "@/lib/trial";

export default async function AssinarPage() {
  const {
    workspace,
    membership,
    readOnly,
  } =
    await getCurrentWorkspaceAccess();

  const [subscription, billing] = await Promise.all([
    prisma.subscription.findUnique({
      where: { workspaceId: workspace.id },
      select: { status: true, trialEndsAt: true },
    }),
    prisma.billingProfile.findUnique({
      where: { workspaceId: workspace.id },
      select: { taxId: true },
    }),
  ]);

  // Escritório sem teste (anterior ao plano) ou já assinante.
  if (!subscription || subscription.status === "ACTIVE") {
    redirect("/configuracoes/assinatura");
  }

  const trialEndsAt = subscription.trialEndsAt;

  return (
    <AppShell>
      <SubscribePanel
        canSubscribe={
          hasPermission(
            membership.role,
            "BILLING_MANAGE",
          )
        }
        hasTaxId={Boolean(billing?.taxId)}
        deletionDate={
          readOnly && trialEndsAt
            ? formatDate(getTrialDataDeletionAt(trialEndsAt))
            : null
        }
        trialEndDate={
          !readOnly && trialEndsAt
            ? formatDate(trialEndsAt)
            : null
        }
      />
    </AppShell>
  );
}
