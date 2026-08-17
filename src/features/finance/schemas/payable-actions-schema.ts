import {
  PayableCategory,
} from "@prisma/client";

import { z } from "zod";

const dateOnlyPattern =
  /^\d{4}-\d{2}-\d{2}$/;

function isValidDateOnly(
  value: string,
): boolean {
  if (
    !dateOnlyPattern.test(value)
  ) {
    return false;
  }

  const [
    year,
    month,
    day,
  ] =
    value
      .split("-")
      .map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        12,
      ),
    );

  return (
    date.getUTCFullYear() ===
      year &&
    date.getUTCMonth() ===
      month - 1 &&
    date.getUTCDate() ===
      day
  );
}

function parseDateOnly(
  value: string,
): Date {
  const [
    year,
    month,
    day,
  ] =
    value
      .split("-")
      .map(Number);

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      12,
    ),
  );
}

/*
 * ==========================
 * EDITAR CONTA
 * ==========================
 */

export const updatePayableFormSchema =
  z.object({
    description:
      z
        .string()
        .trim()
        .min(
          3,
          "Informe a descrição.",
        ),

    category:
      z.nativeEnum(
        PayableCategory,
      ),

    amount:
      z
        .number()
        .positive(
          "Informe um valor válido.",
        ),

    dueDate:
      z
        .string()
        .min(
          1,
          "Informe o vencimento.",
        )
        .refine(
          isValidDateOnly,
          "Informe uma data válida.",
        ),

    notes:
      z.string().trim(),
  });

export type UpdatePayableFormValues =
  z.infer<
    typeof updatePayableFormSchema
  >;

export const updatePayableSchema =
  z.object({
    payableId:
      z
        .string()
        .uuid(
          "Conta inválida.",
        ),

    description:
      z
        .string()
        .trim()
        .min(
          3,
          "Informe a descrição.",
        ),

    category:
      z.nativeEnum(
        PayableCategory,
      ),

    amount:
      z.coerce
        .number()
        .positive(
          "Informe um valor válido.",
        ),

    dueDate:
      z
        .string()
        .refine(
          isValidDateOnly,
          "Informe uma data válida.",
        )
        .transform(
          parseDateOnly,
        ),

    notes:
      z.preprocess(
        (value) => {
          if (
            value === null ||
            value === undefined ||
            value === ""
          ) {
            return null;
          }

          return value;
        },
        z
          .string()
          .trim()
          .nullable(),
      ),
  });

/*
 * ==========================
 * REGISTRAR PAGAMENTO
 * ==========================
 */

export const payablePaymentMethodValues =
  [
    "PIX",
    "DINHEIRO",
    "CARTAO",
    "TRANSFERENCIA",
    "DEPOSITO",
    "BOLETO",
    "DEBITO_AUTOMATICO",
    "OUTRO",
  ] as const;

export const payablePaymentMethodSchema =
  z.enum(
    payablePaymentMethodValues,
  );

export type PayablePaymentMethod =
  z.infer<
    typeof payablePaymentMethodSchema
  >;

export const registerPayablePaymentFormSchema =
  z.object({
    paidAt:
      z
        .string()
        .min(
          1,
          "Informe a data do pagamento.",
        )
        .refine(
          isValidDateOnly,
          "Informe uma data válida.",
        ),

    paymentMethod:
      payablePaymentMethodSchema,
  });

export type RegisterPayablePaymentFormValues =
  z.infer<
    typeof registerPayablePaymentFormSchema
  >;

export const registerPayablePaymentSchema =
  z.object({
    payableId:
      z
        .string()
        .uuid(
          "Conta inválida.",
        ),

    paidAt:
      z
        .string()
        .refine(
          isValidDateOnly,
          "Informe uma data válida.",
        )
        .transform(
          parseDateOnly,
        ),

    paymentMethod:
      payablePaymentMethodSchema,
  });

/*
 * ==========================
 * ESTORNO
 * ==========================
 */

export const reversePayablePaymentSchema =
  z.object({
    payableId:
      z
        .string()
        .uuid(
          "Conta inválida.",
        ),
  });

/*
 * ==========================
 * CANCELAR / EXCLUIR
 * ==========================
 */

export const payableRemovalModeSchema =
  z.enum([
    "CANCEL",
    "DELETE",
  ]);

export type PayableRemovalMode =
  z.infer<
    typeof payableRemovalModeSchema
  >;

export const removePayableSchema =
  z.object({
    payableId:
      z
        .string()
        .uuid(
          "Conta inválida.",
        ),

    mode:
      payableRemovalModeSchema,
  });