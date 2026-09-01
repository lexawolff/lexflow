import type {
  AdministrativeStatus,
  CaseOrigin,
  CaseStatus,
  PracticeArea,
} from "@prisma/client";

import type {
  DefaultValues,
} from "react-hook-form";

import type {
  CaseFormValues,
} from "../schemas/case-schema";

export type CaseFormSource = {
  title: string;

  practiceArea: PracticeArea;

  subject: string | null;
  benefitType: string | null;

  origin: CaseOrigin;

  administrativeStatus:
    AdministrativeStatus;

  number: string | null;

  administrativeNumber:
    string | null;

  administrativeProcess:
    string | null;

  court: string | null;

  courtUnit:
    string | null;

  judge: string | null;

  city: string | null;

  state: string | null;

  opposingParty:
    string | null;

  claimValue:
    number | null;

  status:
    CaseStatus;

  administrativeRequestDate:
    Date | null;

  distributionDate:
    Date | null;

  notes:
    string | null;
};

export function getCaseFormDefaultValues(
  data?: CaseFormSource,
): DefaultValues<CaseFormValues> {
  return {
    title:
      data?.title ??
      "",

    /*
     * Em criação deixamos a área
     * sem valor inicial.
     *
     * Não usamos "" porque o schema
     * exige um PracticeArea válido.
     */
    practiceArea:
      data?.practiceArea,

    subject:
      data?.subject ??
      "",

    benefitType:
      data?.benefitType ??
      "",

    origin:
      data?.origin ??
      "JUDICIAL",

    administrativeStatus:
      data?.administrativeStatus ??
      "NAO_APLICAVEL",

    number:
      data?.number ??
      "",

    administrativeNumber:
      data?.administrativeNumber ??
      "",

    administrativeProcess:
      data?.administrativeProcess ??
      "",

    court:
      data?.court ??
      "",

    courtUnit:
      data?.courtUnit ??
      "",

    judge:
      data?.judge ??
      "",

    city:
      data?.city ??
      "",

    state:
      data?.state ??
      "",

    opposingParty:
      data?.opposingParty ??
      "",

    claimValue:
      data?.claimValue ??
      undefined,

    status:
      data?.status ??
      "ATENDIMENTO_INICIAL",

    administrativeRequestDate:
      data?.administrativeRequestDate
        ? data.administrativeRequestDate
            .toISOString()
            .split("T")[0]
        : "",

    distributionDate:
      data?.distributionDate
        ? data.distributionDate
            .toISOString()
            .split("T")[0]
        : "",

    notes:
      data?.notes ??
      "",
  };
}