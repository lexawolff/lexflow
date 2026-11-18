import {
  AppShell,
} from "@/components/app-shell/app-shell";

import {
  ClientForm,
} from "@/features/clients/components/client-form";

import {
  canUsePermission,
  requireWorkspacePagePermission,
} from "@/lib/permissions";

export default async function NovoClientePage() {
  const {
    membership,
  } =
    await requireWorkspacePagePermission(
      "CLIENT_CREATE",
    );

  const canWriteFinance =
    canUsePermission(
      membership,
      "FINANCE_WRITE",
    );

  const canManageGov =
    canUsePermission(
      membership,
      "GOV_MANAGE",
    );

  return (
    <AppShell>
      <ClientForm
        canWriteFinance={
          canWriteFinance
        }
        canManageGov={
          canManageGov
        }
      />
    </AppShell>
  );
}
