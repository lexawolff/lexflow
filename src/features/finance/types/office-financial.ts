import type {
  FinancialStatus,
  PayableCategory,
  ReceivableType,
} from "@prisma/client";

export type OfficeFinancialCaseOption = {
  id: string;
  label: string;
};

export type OfficeFinancialClient = {
  id: string;
  name: string;
  cases: OfficeFinancialCaseOption[];
};

export type OfficeReceivable = {
  id: string;

  clientId: string;
  clientName: string;

  caseId: string | null;
  caseTitle: string | null;
  caseNumber: string | null;

  description: string;
  type: ReceivableType;

  totalAmount: number;
  paidAmount: number;

  dueDate: string | null;
  originalDueDate: string | null;
  receivedAt: string | null;

  status: FinancialStatus;

  paymentMethod: string | null;
  notes: string | null;

  installmentGroupId: string | null;
  installmentNumber: number | null;
  totalInstallments: number | null;

  createdAt: string;
  updatedAt: string;
};

export type OfficePayable = {
  id: string;

  description: string;

  category: PayableCategory;

  amount: number;

  dueDate: string;

  paidAt: string | null;

  status: FinancialStatus;

  paymentMethod: string | null;

  notes: string | null;

  createdAt: string;

  updatedAt: string;
};

export type OfficeFinancialData = {
  todayKey: string;

  clients: OfficeFinancialClient[];

  receivables: OfficeReceivable[];

  payables: OfficePayable[];
};