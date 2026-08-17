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
  if (
    !dateOnlyPattern.test(
      value,
    )
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
      .transform(
        parseDateOnly,
      )
      .nullable(),
  );

export const createRpvFormSchema =
  z.object({
    caseId:
      z
        .string()
        .min(
          1,
          "Selecione o processo.",
        ),

    type:
      z.nativeEnum(
        RpvType,
      ),

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
        .min(
          0,
          "Percentual inválido.",
        )
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

    paidAt:
      z.string(),

    bank:
      z.string().trim(),

    status:
      z.nativeEnum(
        RpvStatus,
      ),

    notes:
      z.string().trim(),
  });

export type CreateRpvFormValues =
  z.infer<
    typeof createRpvFormSchema
  >;

export const createRpvSchema =
  z
    .object({
      caseId:
        z.string().uuid(
          "Processo inválido.",
        ),

      type:
        z.nativeEnum(
          RpvType,
        ),

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

      paidAt:
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

      status:
        z.nativeEnum(
          RpvStatus,
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
      (
        data,
        context,
      ) => {
        if (
          data.contractualFeeRate !==
            null &&
          data.contractualFeeRate >
            100
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode
                .custom,

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
              z.ZodIssueCode
                .custom,

            path: [
              "contractualFeeValue",
            ],

            message:
              "Os honorários contratuais não podem superar o valor bruto.",
          });
        }

        if (
          data.status ===
            RpvStatus.PAGA &&
          !data.paidAt
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            path: [
              "paidAt",
            ],

            message:
              "Informe a data do pagamento para uma requisição paga.",
          });
        }
      },
    );

export type CreateRpvInput =
  z.infer<
    typeof createRpvSchema
  >;