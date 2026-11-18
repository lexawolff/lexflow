import {
  redirect,
} from "next/navigation";

import {
  AppShell,
} from "@/components/app-shell/app-shell";

import {
  LEGAL_CONTACT_EMAIL,
} from "@/features/legal/legal-info";

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
  getTrialDataDeletionAt,
} from "@/lib/trial";

export default async function AssinarPage() {
  const {
    workspace,
    membership,
    readOnly,
    trialEndsAt,
  } =
    await getCurrentWorkspaceAccess();

  if (!readOnly || !trialEndsAt) {
    redirect("/dashboard");
  }

  const subject =
    encodeURIComponent(
      `Assinatura do LexFlow - ${workspace.name}`,
    );

  return (
    <AppShell>
      <SubscribePanel
        canSubscribe={
          hasPermission(
            membership.role,
            "BILLING_MANAGE",
          )
        }
        contactHref={
          `mailto:${LEGAL_CONTACT_EMAIL}?subject=${subject}`
        }
        deletionDate={
          formatDate(
            getTrialDataDeletionAt(trialEndsAt),
          )
        }
      />
    </AppShell>
  );
}
