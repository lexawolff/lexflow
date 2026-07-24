import { prisma } from "@/lib/prisma";

import {
  caseDetailsInclude,
  type CaseDetails,
} from "../types";

type GetCaseInput = {
  workspaceId: string;
  caseId: string;
};

export async function getCase({
  workspaceId,
  caseId,
}: GetCaseInput): Promise<CaseDetails | null> {
  return prisma.case.findFirst({
    where: {
      id: caseId,
      workspaceId,
    },
    ...caseDetailsInclude,
  });
}