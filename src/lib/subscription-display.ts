/*
 * Textos de exibição da assinatura e das faturas do Asaas. Sem dependências
 * de servidor.
 */

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Aguardando pagamento",
  OVERDUE: "Vencida",
  CONFIRMED: "Paga",
  RECEIVED: "Paga",
  RECEIVED_IN_CASH: "Paga",
  REFUNDED: "Estornada",
  REFUND_REQUESTED: "Estorno solicitado",
  REFUND_IN_PROGRESS: "Estorno em andamento",
  CHARGEBACK_REQUESTED: "Contestada",
  CHARGEBACK_DISPUTE: "Contestada",
  AWAITING_CHARGEBACK_REVERSAL: "Contestada",
  DUNNING_REQUESTED: "Em cobrança",
  DUNNING_RECEIVED: "Paga",
  AWAITING_RISK_ANALYSIS: "Em análise",
};

export function paymentStatusLabel(status: string): string {
  return PAYMENT_STATUS_LABELS[status] ?? "Em processamento";
}

export function isPaymentOpen(status: string): boolean {
  return status === "PENDING" || status === "OVERDUE";
}

const BILLING_TYPE_LABELS: Record<string, string> = {
  PIX: "Pix",
  BOLETO: "Boleto",
  CREDIT_CARD: "Cartão de crédito",
  DEBIT_CARD: "Cartão de débito",
  UNDEFINED: "A escolher na fatura",
};

export function billingTypeLabel(
  billingType: string,
  card?: { brand?: string | null; last4?: string | null } | null,
): string {
  const label = BILLING_TYPE_LABELS[billingType] ?? "Não informado";

  if (billingType === "CREDIT_CARD" && card?.last4) {
    return `${label} ${card.brand ? `${card.brand} ` : ""}final ${card.last4}`;
  }

  return label;
}

// "AAAA-MM-DD" do Asaas para "DD/MM/AAAA".
export function formatAsaasDate(value: string): string {
  const [year, month, day] = value.split("-");

  return `${day}/${month}/${year}`;
}

export function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
