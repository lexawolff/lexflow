import { z } from "zod";

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateOnly(value: string): boolean {
  if (!dateOnlyPattern.test(value)) {
    return false;
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day, 12),
  );

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value
    .split("-")
    .map(Number);

  return new Date(
    Date.UTC(year, month - 1, day, 12),
  );
}

export const paymentMethodValues = [
  "PIX",
  "DINHEIRO",
  "CARTAO",
  "TRANSFERENCIA",
  "DEPOSITO",
  "BOLETO",
  "OUTRO",
] as const;

export const paymentMethodSchema = z.enum(
  paymentMethodValues,
);

export type PaymentMethod =
  z.infer<typeof paymentMethodSchema>;

export const registerReceivablePaymentFormSchema =
  z.object({
    receivedAt: z
      .string()
      .min(
        1,
        "Informe a data do recebimento.",
      )
      .refine(
        isValidDateOnly,
        "Informe uma data válida.",
      ),

    paymentMethod:
      paymentMethodSchema,
  });

export type RegisterReceivablePaymentFormValues =
  z.infer<
    typeof registerReceivablePaymentFormSchema
  >;

export const registerReceivablePaymentSchema =
  z.object({
    receivableId: z
      .string()
      .uuid(
        "Recebimento inválido.",
      ),

    receivedAt: z
      .string()
      .min(
        1,
        "Informe a data do recebimento.",
      )
      .refine(
        isValidDateOnly,
        "Informe uma data válida.",
      )
      .transform(parseDateOnly),

    paymentMethod:
      paymentMethodSchema,
  });

export type RegisterReceivablePaymentInput =
  z.infer<
    typeof registerReceivablePaymentSchema
  >;