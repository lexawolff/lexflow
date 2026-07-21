import {
  AdministrativeStatus,
  CaseOrigin,
  CaseStatus,
  PracticeArea,
} from "@prisma/client";

import { z } from "zod";

const optionalText = z.string().trim().optional();

const optionalNumber = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }

    const number = Number(value);

    return Number.isNaN(number) ? value : number;
  },
  z.number().nonnegative().optional()
);

const optionalDate = z
  .string()
  .optional()
  .transform((value) => value || undefined);

export const caseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Informe o título da demanda."),

  practiceArea: z.nativeEnum(PracticeArea),

  subject: optionalText,
  benefitType: optionalText,

  origin: z.nativeEnum(CaseOrigin),

  administrativeStatus: z.nativeEnum(
    AdministrativeStatus
  ),

  number: optionalText,
  administrativeNumber: optionalText,
  administrativeProcess: optionalText,

  court: optionalText,
  courtUnit: optionalText,
  judge: optionalText,
  city: optionalText,
  state: optionalText,

  opposingParty: optionalText,

  claimValue: optionalNumber,

  status: z.nativeEnum(CaseStatus),

  administrativeRequestDate: optionalDate,
  distributionDate: optionalDate,
  nextDeadline: optionalDate,

  notes: optionalText,
});

export type CaseSchema = z.infer<typeof caseSchema>;
export type CaseFormValues = z.input<typeof caseSchema>;