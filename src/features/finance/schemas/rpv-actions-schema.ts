import {
  RpvStatus,
  RpvType,
} from "@prisma/client";

import { z } from "zod";

const dateOnlyPattern =
  /^\d{4}-\d{2}-\d{2}$/;

function isValidDateOnly(
  value: string,
): boolean {
  if (!dateOnlyPattern.test(value)) {
    return false;
  }

  const [
    year,
    month,
    day,
  ] = value
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
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function parseDateOnly(
  value: string,
): Date {
  const [
    year,
    month,
    day,
  ] = value
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

const optionalDateSchema =
  z.preprocess(
    (value) => {
      if (
        value === "" ||
        value === null ||
        value === undefined
      ) {
        return null;
      }

      return value;
    },

    z
      .string()
      .refine(
        isValidDateOnly,
        "Informe uma data válida.",
      )
      .transform(parseDateOnly)
      .nullable(),
  );

const optionalNumberSchema =
  z.preprocess(
    (value) => {
      if (
        value === "" ||
        value === null ||
        value === undefined
      ) {
        return null;
      }

      return value;
    },

    z.coerce
      .number()
      .nonnegative(
        "Informe um valor válido.",
      )
      .nullable(),
  );

/*
 * ==========================
 * EDITAR
 * ==========================
 */

export const updateRpvFormSchema =
  z.object({
    type:
      z.nativeEnum(RpvType),

    requisitionNumber:
      z.string().trim(),

    court:
      z.string().trim(),

    grossAmount:
      z
        .number()
        .positive(
          "Informe o valor bruto.",
        ),

    contractualFeeRate:
      z
        .number()
        .min(0)
        .max(
          100,
          "O percentual não pode ultrapassar 100%.",
        ),

    contractualFeeValue:
      z
        .number()
        .min(
          0,
          "Valor inválido.",
        ),

    sucumbencyFeeValue:
      z
        .number()
        .min(
          0,
          "Valor inválido.",
        ),

    expectedPaymentDate:
      z.string(),

    bank:
      z.string().trim(),

    notes:
      z.string().trim(),
  });

export type UpdateRpvFormValues =
  z.infer<
    typeof updateRpvFormSchema
  >;

export const updateRpvSchema =
  z
    .object({
      rpvId:
        z
          .string()
          .uuid(
            "Requisição inválida.",
          ),

      type:
        z.nativeEnum(RpvType),

      requisitionNumber:
        z.preprocess(
          (value) =>
            value === ""
              ? null
              : value,

          z
            .string()
            .trim()
            .nullable(),
        ),

      court:
        z.preprocess(
          (value) =>
            value === ""
              ? null
              : value,

          z
            .string()
            .trim()
            .nullable(),
        ),

      grossAmount:
        z.coerce
          .number()
          .positive(
            "Informe o valor bruto.",
          ),

      contractualFeeRate:
        optionalNumberSchema,

      contractualFeeValue:
        optionalNumberSchema,

      sucumbencyFeeValue:
        optionalNumberSchema,

      expectedPaymentDate:
        optionalDateSchema,

      bank:
        z.preprocess(
          (value) =>
            value === ""
              ? null
              : value,

          z
            .string()
            .trim()
            .nullable(),
        ),

      notes:
        z.preprocess(
          (value) =>
            value === ""
              ? null
              : value,

          z
            .string()
            .trim()
            .nullable(),
        ),
    })
    .superRefine(
      (data, context) => {
        if (
          data.contractualFeeRate !==
            null &&
          data.contractualFeeRate >
            100
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: [
              "contractualFeeRate",
            ],

            message:
              "O percentual não pode ultrapassar 100%.",
          });
        }

        if (
          data.contractualFeeValue !==
            null &&
          data.contractualFeeValue >
            data.grossAmount
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: [
              "contractualFeeValue",
            ],

            message:
              "Os honorários contratuais não podem superar o crédito bruto.",
          });
        }
      },
    );

/*
 * ==========================
 * ALTERAR STATUS
 * ==========================
 */

export const updateRpvStatusFormSchema =
  z.object({
    status:
      z.nativeEnum(RpvStatus),

    paidAt:
      z.string(),
  });

export type UpdateRpvStatusFormValues =
  z.infer<
    typeof updateRpvStatusFormSchema
  >;

export const updateRpvStatusSchema =
  z
    .object({
      rpvId:
        z
          .string()
          .uuid(
            "Requisição inválida.",
          ),

      status:
        z.nativeEnum(RpvStatus),

      paidAt:
        optionalDateSchema,
    })
    .superRefine(
      (data, context) => {
        if (
          data.status ===
            RpvStatus.PAGA &&
          !data.paidAt
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode.custom,

            path: [
              "paidAt",
            ],

            message:
              "Informe a data do pagamento.",
          });
        }
      },
    );

/*
 * ==========================
 * CANCELAR / EXCLUIR
 * ==========================
 */

export const rpvRemovalModeSchema =
  z.enum([
    "CANCEL",
    "DELETE",
  ]);

export type RpvRemovalMode =
  z.infer<
    typeof rpvRemovalModeSchema
  >;

export const removeRpvSchema =
  z.object({
    rpvId:
      z
        .string()
        .uuid(
          "Requisição inválida.",
        ),

    mode:
      rpvRemovalModeSchema,
  });