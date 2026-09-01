import {
  TaskType,
} from "@prisma/client";

import { z } from "zod";

const datePattern =
  /^\d{4}-\d{2}-\d{2}$/;

const timePattern =
  /^([01]\d|2[0-3]):[0-5]\d$/;

function isValidDateOnly(
  value: string,
): boolean {
  if (
    !datePattern.test(
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

const optionalUuid =
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
      .uuid()
      .nullable(),
  );

export const createAgendaTaskFormSchema =
  z.object({
    title:
      z
        .string()
        .trim()
        .min(
          2,
          "Informe o título.",
        ),

    type:
      z.nativeEnum(
        TaskType,
      ),

    date:
      z
        .string()
        .refine(
          isValidDateOnly,
          "Informe uma data válida.",
        ),

    time:
      z
        .string()
        .refine(
          (value) =>
            value === "" ||
            timePattern.test(
              value,
            ),
          "Informe um horário válido.",
        ),

    clientId:
      z.string(),

    caseId:
      z.string(),

    location:
      z.string().trim(),

    description:
      z.string().trim(),
  });

export type CreateAgendaTaskFormValues =
  z.infer<
    typeof createAgendaTaskFormSchema
  >;

export const createAgendaTaskSchema =
  z.object({
    title:
      z
        .string()
        .trim()
        .min(
          2,
          "Informe o título.",
        ),

    type:
      z.nativeEnum(
        TaskType,
      ),

    date:
      z
        .string()
        .refine(
          isValidDateOnly,
          "Informe uma data válida.",
        ),

    time:
      z.preprocess(
        (value) =>
          value === ""
            ? null
            : value,

        z
          .string()
          .regex(
            timePattern,
            "Horário inválido.",
          )
          .nullable(),
      ),

    clientId:
      optionalUuid,

    caseId:
      optionalUuid,

    location:
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

    description:
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
  });

export type CreateAgendaTaskInput =
  z.infer<
    typeof createAgendaTaskSchema
  >;