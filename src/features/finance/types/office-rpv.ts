import type {
  RpvStatus,
  RpvType,
} from "@prisma/client";

export type OfficeRpvCaseOption = {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  number: string | null;
  administrativeNumber: string | null;
  label: string;
};

export type OfficeRpvRecord = {
  id: string;

  type: RpvType;

  caseId: string;

  clientId: string;
  clientName: string;

  caseTitle: string;
  caseNumber: string | null;

  requisitionNumber: string | null;

  court: string | null;

  grossAmount: number;

  contractualFeeRate: number | null;
  contractualFeeValue: number | null;

  sucumbencyFeeValue: number | null;

  clientNetAmount: number | null;

  expectedPaymentDate: string | null;

  paidAt: string | null;

  bank: string | null;

  status: RpvStatus;

  notes: string | null;

  createdAt: string;
  updatedAt: string;
};

export type OfficeRpvData = {
  todayKey: string;

  cases: OfficeRpvCaseOption[];

  rpvs: OfficeRpvRecord[];
};