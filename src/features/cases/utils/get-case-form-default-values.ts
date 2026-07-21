import type { CaseSchema } from "../schemas/case-schema";

type CaseFormSource = {
  title: string;
  practiceArea: string;

  subject: string | null;
  benefitType: string | null;

  origin: string;
  administrativeStatus: string;

  number: string | null;
  administrativeNumber: string | null;
  administrativeProcess: string | null;

  court: string | null;
  courtUnit: string | null;
  judge: string | null;
  city: string | null;
  state: string | null;

  opposingParty: string | null;

  claimValue: number | null;

  status: string;

  administrativeRequestDate: Date | null;
  distributionDate: Date | null;
  nextDeadline: Date | null;

  notes: string | null;
};

export function getCaseFormDefaultValues(
  data?: CaseFormSource
): CaseSchema {
  return {
    title: data?.title ?? "",

    practiceArea: data?.practiceArea ?? "",

    subject: data?.subject ?? "",
    benefitType: data?.benefitType ?? "",

    origin: data?.origin ?? "JUDICIAL",
    administrativeStatus:
      data?.administrativeStatus ?? "NAO_APLICAVEL",

    number: data?.number ?? "",
    administrativeNumber:
      data?.administrativeNumber ?? "",
    administrativeProcess:
      data?.administrativeProcess ?? "",

    court: data?.court ?? "",
    courtUnit: data?.courtUnit ?? "",
    judge: data?.judge ?? "",
    city: data?.city ?? "",
    state: data?.state ?? "",

    opposingParty: data?.opposingParty ?? "",

    claimValue: data?.claimValue ?? undefined,

    status:
      data?.status ?? "ATENDIMENTO_INICIAL",

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

    nextDeadline:
      data?.nextDeadline
        ? data.nextDeadline
            .toISOString()
            .split("T")[0]
        : "",

    notes: data?.notes ?? "",
  };
}