import {
  AppShell,
} from "@/components/app-shell/app-shell";

import {
  ClientForm,
} from "@/features/clients/components/client-form";

import {
  hasPermission,
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
    hasPermission(
      membership.role,
      "FINANCE_WRITE",
    );

  const canManageGov =
    hasPermission(
      membership.role,
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
