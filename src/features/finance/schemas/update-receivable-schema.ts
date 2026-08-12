import { ReceivableType } from "@prisma/client";
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

const optionalFormDateSchema = z
  .string()
  .refine(
    (value) =>
      value === "" || isValidDateOnly(value),
    "Informe uma data de vencimento válida.",
  );

export const updateReceivableFormSchema =
  z.object({
    caseId: z
      .string()
      .refine(
        (value) =>
          !value ||
          z.string().uuid().safeParse(value)
            .success,
        "Processo inválido.",
      ),

    description: z
      .string()
      .trim()
      .min(3, "Informe a descrição."),

    type: z.nativeEnum(ReceivableType),

    totalAmount: z
      .number()
      .positive("Informe um valor válido."),

    dueDate: optionalFormDateSchema,

    notes: z.string().trim(),
  });

export type UpdateReceivableFormValues =
  z.infer<
    typeof updateReceivableFormSchema
  >;

const optionalServerDateSchema =
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
      .refine(
        isValidDateOnly,
        "Informe uma data de vencimento válida.",
      )
      .transform(parseDateOnly)
      .nullable(),
  );

export const updateReceivableSchema =
  z.object({
    receivableId: z
      .string()
      .uuid("Recebimento inválido."),

    caseId: z.preprocess(
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
        .uuid("Processo inválido.")
        .nullable(),
    ),

    description: z
      .string()
      .trim()
      .min(3, "Informe a descrição."),

    type: z.nativeEnum(ReceivableType),

    totalAmount: z.coerce
      .number()
      .positive("Informe um valor válido."),

    dueDate: optionalServerDateSchema,

    notes: z.preprocess(
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
      z.string().trim().nullable(),
    ),
  });

export type UpdateReceivableInput =
  z.infer<typeof updateReceivableSchema>;