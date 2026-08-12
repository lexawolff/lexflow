"use client";

import { splitAmount } from "../lib/split-amount";

type InstallmentsPreviewProps = {
  totalAmount: number;
  totalInstallments: number;
  firstDueDate: string;
  installmentDueDates: string[];
  onDueDateChange: (
    index: number,
    value: string,
  ) => void;
  disabled?: boolean;
};

function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function InstallmentsPreview({
  totalAmount,
  totalInstallments,
  firstDueDate,
  installmentDueDates,
  onDueDateChange,
  disabled = false,
}: InstallmentsPreviewProps) {
  if (
    totalAmount <= 0 ||
    totalInstallments < 1 ||
    !firstDueDate ||
    installmentDueDates.length === 0
  ) {
    return (
      <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        Informe o valor e o vencimento para
        visualizar a prévia.
      </div>
    );
  }

  const installmentValues = splitAmount(
    totalAmount,
    totalInstallments,
  );

  return (
    <section className="space-y-4 rounded-lg border p-4">
      <div>
        <h3 className="text-sm font-semibold">
          Parcelas e vencimentos
        </h3>

        <p className="text-xs text-muted-foreground">
          {totalInstallments === 1
            ? "Confira a data do recebimento."
            : "As datas foram geradas mensalmente. Você pode alterar individualmente qualquer vencimento."}
        </p>
      </div>

      <div className="max-h-80 overflow-y-auto rounded-md border">
        <div className="grid grid-cols-[minmax(90px,1fr)_minmax(145px,180px)_minmax(110px,140px)] gap-3 border-b bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
          <span>Parcela</span>
          <span>Vencimento</span>
          <span className="text-right">
            Valor
          </span>
        </div>

        <div className="divide-y">
          {installmentValues.map(
            (installmentValue, index) => {
              const installmentDueDate =
                installmentDueDates[index] ?? "";

              return (
                <div
                  key={index}
                  className="grid grid-cols-[minmax(90px,1fr)_minmax(145px,180px)_minmax(110px,140px)] items-center gap-3 px-3 py-2"
                >
                  <span className="text-sm font-medium">
                    {totalInstallments === 1
                      ? "Pagamento"
                      : `${index + 1}/${totalInstallments}`}
                  </span>

                  <input
                    type="date"
                    value={installmentDueDate}
                    disabled={disabled}
                    aria-label={`Vencimento da parcela ${
                      index + 1
                    }`}
                    onChange={(event) =>
                      onDueDateChange(
                        index,
                        event.target.value,
                      )
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  <span className="text-right text-sm font-medium">
                    {formatMoney(
                      installmentValue,
                    )}
                  </span>
                </div>
              );
            },
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-3 text-sm">
        <span className="text-muted-foreground">
          Total
        </span>

        <span className="font-semibold">
          {formatMoney(totalAmount)}
        </span>
      </div>
    </section>
  );
}