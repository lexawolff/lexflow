import { ReceivableType } from "@prisma/client";

import type { CreateReceivableFormValues } from "../schemas/create-receivable-schema";

export function getReceivableFormDefaultValues(): CreateReceivableFormValues {
  return {
    caseId: "",
    description: "",
    type: ReceivableType.HONORARIO_CONTRATUAL,
    totalAmount: 0,
    dueDate: "",
    installmentDueDates: [],
    isInstallment: false,
    totalInstallments: 1,
    notes: "",
  };
}