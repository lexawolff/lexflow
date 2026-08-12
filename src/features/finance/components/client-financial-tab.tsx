import { ClientDetails } from "@/features/clients/types";

import { CreateReceivableDialog } from "@/features/finance/components/create-receivable-dialog";

import { FinancialSummary } from "./financial-summary";
import { ReceivablesList } from "./receivables-list";

type Props = {
  client: ClientDetails;
};

export function ClientFinancialTab({
  client,
}: Props) {
  const caseOptions =
    client.cases.map(
      (process) => {
        const processNumber =
          process.number ??
          process.administrativeNumber;

        return {
          id: process.id,

          label: processNumber
            ? `${process.title} • ${processNumber}`
            : process.title,
        };
      },
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Financeiro do cliente
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe cobranças,
            parcelas, vencimentos e
            valores recebidos.
          </p>
        </div>

        <div className="shrink-0">
          <CreateReceivableDialog
            clientId={client.id}
            caseOptions={
              caseOptions
            }
          />
        </div>
      </div>

      <FinancialSummary
        client={client}
      />

      <ReceivablesList
        client={client}
      />
    </div>
  );
}