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

export const createPayableFormSchema =
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

export type CreatePayableFormValues =
  z.infer<
    typeof createPayableFormSchema
  >;

export const createPayableSchema =
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
      z.coerce
        .number()
        .positive(
          "Informe um valor válido.",
        ),

    dueDate:
      z
        .string({
          message:
            "Informe o vencimento.",
        })
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

export type CreatePayableInput =
  z.infer<
    typeof createPayableSchema
  >;