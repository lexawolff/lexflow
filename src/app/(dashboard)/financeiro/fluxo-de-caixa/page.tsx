import {
  CircleDollarSign,
} from "lucide-react";

import {
  AppShell,
} from "@/components/app-shell/app-shell";

import {
  FinanceNavigation,
} from "@/features/finance/components/finance-navigation";

import {
  OfficeCashFlow,
} from "@/features/finance/components/office-cash-flow";

import {
  getOfficeFinancialData,
} from "@/features/finance/services/get-office-financial-data";

export default async function FluxoDeCaixaPage() {
  const data =
    await getOfficeFinancialData();

  return (
    <AppShell>
      <div className="space-y-6">
        {/* ==========================
            CABEÇALHO FINANCEIRO
        ========================== */}

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex items-start gap-4 px-5 py-5 sm:px-6">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <CircleDollarSign className="size-6" />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Gestão financeira
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Financeiro
              </h1>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                Acompanhe receitas, despesas,
                pendências e o resultado
                financeiro do escritório.
              </p>
            </div>
          </div>

          <div className="border-t bg-muted/10 px-4 py-3 sm:px-5">
            <FinanceNavigation />
          </div>
        </section>

        {/* ==========================
            FLUXO DE CAIXA
        ========================== */}

        <OfficeCashFlow
          data={
            data
          }
        />
      </div>
    </AppShell>
  );
}