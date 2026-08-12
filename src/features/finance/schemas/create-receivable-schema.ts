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

const formDateSchema = z
  .string()
  .min(1, "Informe a data de vencimento.")
  .refine(
    isValidDateOnly,
    "Informe uma data de vencimento válida.",
  );

export const createReceivableFormSchema = z
  .object({
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

    dueDate: formDateSchema,

    installmentDueDates: z.array(
      formDateSchema,
    ),

    isInstallment: z.boolean(),

    totalInstallments: z.coerce
      .number()
      .int("Informe uma quantidade inteira.")
      .min(1, "Informe ao menos uma parcela.")
      .max(
        120,
        "O limite é de 120 parcelas.",
      ),

    notes: z.string().trim(),
  })
  .superRefine((data, context) => {
    const expectedInstallments =
      data.isInstallment
        ? data.totalInstallments
        : 1;

    if (
      data.isInstallment &&
      data.totalInstallments < 2
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totalInstallments"],
        message:
          "Informe ao menos duas parcelas.",
      });
    }

    if (
      data.installmentDueDates.length !==
      expectedInstallments
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["installmentDueDates"],
        message:
          "A quantidade de vencimentos não corresponde à quantidade de parcelas.",
      });
    }
  });

export type CreateReceivableFormInput =
  z.input<
    typeof createReceivableFormSchema
  >;

export type CreateReceivableFormValues =
  z.output<
    typeof createReceivableFormSchema
  >;

const serverDateSchema = z
  .string({
    message:
      "Informe a data de vencimento.",
  })
  .refine(
    isValidDateOnly,
    "Informe uma data de vencimento válida.",
  )
  .transform(parseDateOnly);

const installmentDueDatesSchema =
  z.preprocess(
    (value) => {
      if (Array.isArray(value)) {
        return value;
      }

      if (typeof value !== "string") {
        return value;
      }

      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    },
    z.array(serverDateSchema),
  );

export const createReceivableSchema = z
  .object({
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

    dueDate: serverDateSchema,

    installmentDueDates:
      installmentDueDatesSchema,

    isInstallment: z.preprocess(
      (value) =>
        value === true || value === "true",
      z.boolean(),
    ),

    totalInstallments: z.coerce
      .number()
      .int("Informe uma quantidade inteira.")
      .min(1, "Informe ao menos uma parcela.")
      .max(
        120,
        "O limite é de 120 parcelas.",
      ),

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
  })
  .superRefine((data, context) => {
    const expectedInstallments =
      data.isInstallment
        ? data.totalInstallments
        : 1;

    if (
      data.isInstallment &&
      data.totalInstallments < 2
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totalInstallments"],
        message:
          "Informe ao menos duas parcelas.",
      });
    }

    if (
      data.installmentDueDates.length !==
      expectedInstallments
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["installmentDueDates"],
        message:
          "A quantidade de vencimentos não corresponde à quantidade de parcelas.",
      });
    }
  });

export type CreateReceivableInput = z.infer<
  typeof createReceivableSchema
>;