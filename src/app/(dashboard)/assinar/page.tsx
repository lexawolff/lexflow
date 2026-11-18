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
  getCurrentWorkspaceAccess,
  hasPermission,
} from "@/lib/permissions";

export default async function AssinarPage() {
  const {
    workspace,
    membership,
    readOnly,
  } =
    await getCurrentWorkspaceAccess();

  if (!readOnly) {
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
      />
    </AppShell>
  );
}
