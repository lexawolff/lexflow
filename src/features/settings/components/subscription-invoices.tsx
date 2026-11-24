import {
  ReceiptText,
} from "lucide-react";

import {
  formatAsaasDate,
  formatMoney,
  isPaymentOpen,
  paymentStatusLabel,
} from "@/lib/subscription-display";

import {
  CancelSubscriptionButton,
} from "./cancel-subscription-button";

export type InvoiceRow = {
  id: string;
  dueDate: string;
  value: number | null;
  status: string;
  invoiceUrl: string | null;
};

type Props = {
  paymentMethod: string | null;
  invoices: InvoiceRow[];
  // Botão de cancelar só para assinatura ativa ou em atraso.
  canCancel: boolean;
  accessUntil: string | null;
  canceled: boolean;
  // Ex-assinante que voltou a assinar e ainda não pagou a primeira fatura.
  awaitingPayment?: boolean;
};

function describe(canceled: boolean, awaitingPayment: boolean, accessUntil: string | null) {
  if (canceled && awaitingPayment) {
    return accessUntil
      ? `Nova assinatura aguardando o pagamento da primeira fatura. O acesso atual vai até ${accessUntil}.`
      : "Nova assinatura aguardando o pagamento da primeira fatura.";
  }

  if (canceled && accessUntil) {
    return `Assinatura cancelada: o acesso completo vai até ${accessUntil}.`;
  }

  return "Faturas da assinatura no Asaas.";
}

export function SubscriptionInvoices({
  paymentMethod,
  invoices,
  canCancel,
  accessUntil,
  canceled,
  awaitingPayment = false,
}: Props) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <ReceiptText className="size-5" />
          </div>

          <div>
            <h2 className="font-semibold">
              Pagamentos
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {paymentMethod ? `Forma de pagamento: ${paymentMethod}. ` : ""}
              {describe(canceled, awaitingPayment, accessUntil)}
            </p>
          </div>
        </div>

        {canCancel ? (
          <CancelSubscriptionButton accessUntil={accessUntil} />
        ) : null}
      </div>

      {invoices.length === 0 ? (
        <p className="p-5 text-sm text-muted-foreground sm:p-6">
          Nenhuma fatura gerada ainda.
        </p>
      ) : (
        <ul className="divide-y">
          {invoices.map((invoice) => (
            <li
              key={invoice.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm sm:px-6"
            >
              <div>
                <p className="font-medium">
                  Vencimento em {formatAsaasDate(invoice.dueDate)}
                </p>

                <p className="text-muted-foreground">
                  {invoice.value !== null ? `${formatMoney(invoice.value)} · ` : ""}
                  {paymentStatusLabel(invoice.status)}
                </p>
              </div>

              {invoice.invoiceUrl ? (
                <a
                  href={invoice.invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    isPaymentOpen(invoice.status)
                      ? "inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
                      : "text-sm font-medium text-primary hover:underline"
                  }
                >
                  {isPaymentOpen(invoice.status) ? "Pagar" : "Ver fatura"}
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
