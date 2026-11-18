import {
  AppShell,
} from "@/components/app-shell/app-shell";

import {
  FinanceNavigation,
} from "@/features/finance/components/finance-navigation";

import {
  OfficeRpvDashboard,
} from "@/features/finance/components/office-rpv-dashboard";

import {
  getOfficeRpvData,
} from "@/features/finance/services/get-office-rpv-data";

import {
  canUsePermission,
  requireWorkspacePagePermission,
} from "@/lib/permissions";

export default async function RpvsEPrecatoriosPage() {
  const {
    membership,
  } =
    await requireWorkspacePagePermission(
      "FINANCE_VIEW",
    );

  const canWriteFinance =
    canUsePermission(
      membership,
      "FINANCE_WRITE",
    );

  const data =
    await getOfficeRpvData();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Financeiro
          </h1>

          <p className="mt-1 text-muted-foreground">
            Acompanhe receitas,
            despesas e créditos
            judiciais do escritório.
          </p>
        </div>

        <FinanceNavigation />

        <OfficeRpvDashboard
          data={
            data
          }
          canWriteFinance={
            canWriteFinance
          }
        />
      </div>
    </AppShell>
  );
}