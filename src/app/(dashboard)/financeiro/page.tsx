import { AppShell } from "@/components/app-shell/app-shell";

import { FinanceNavigation } from "@/features/finance/components/finance-navigation";
import { OfficeFinancialDashboard } from "@/features/finance/components/office-financial-dashboard";

import { getOfficeFinancialData } from "@/features/finance/services/get-office-financial-data";

export default async function FinanceiroPage() {
  const data =
    await getOfficeFinancialData();

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Financeiro
          </h1>

          <p className="mt-1 text-muted-foreground">
            Acompanhe receitas,
            despesas e o resultado
            financeiro do escritório.
          </p>
        </div>

        <FinanceNavigation />

        <OfficeFinancialDashboard
          data={data}
        />
      </div>
    </AppShell>
  );
}