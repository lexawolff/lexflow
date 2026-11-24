/*
 * Plano do LexFlow: preço único por escritório. Sem dependências de
 * servidor: usado também nas telas.
 */
export const PLAN_CODE = "lexflow";

// Pessoas por escritório, contando o proprietário.
export const PLAN_MAX_USERS = 5;

export const BILLING_OPTIONS = {
  MONTHLY: {
    cycle: "MONTHLY",
    amountCents: 5_900,
    label: "Mensal",
    priceLabel: "R$ 59,00 por mês",
    note: null,
    planName: "LexFlow mensal",
  },
  YEARLY: {
    cycle: "YEARLY",
    amountCents: 59_000,
    label: "Anual",
    priceLabel: "R$ 590,00 por ano",
    note: "2 meses grátis",
    planName: "LexFlow anual",
  },
} as const;

export type BillingIntervalKey = keyof typeof BILLING_OPTIONS;

export const PAYMENT_METHODS = {
  PIX: {
    label: "Pix",
    description: "A cobrança chega por e-mail a cada vencimento e é paga pelo QR code.",
  },
  BOLETO: {
    label: "Boleto",
    description: "A cobrança chega por e-mail a cada vencimento. Compensa em até 3 dias úteis.",
  },
  CREDIT_CARD: {
    label: "Cartão de crédito",
    description: "Renovação automática: as próximas cobranças saem no mesmo cartão.",
  },
} as const;

export type PaymentMethodKey = keyof typeof PAYMENT_METHODS;
