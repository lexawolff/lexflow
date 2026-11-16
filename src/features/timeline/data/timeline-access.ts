import "server-only";

import type { Prisma, TimelineEntityType, TimelineEventType } from "@prisma/client";

type TimelineAccess = {
  canViewCases: boolean;
  canViewAgenda: boolean;
  canViewDocuments: boolean;
  canViewFinance: boolean;
};

export function buildTimelineAccessWhere(access: TimelineAccess): Prisma.TimelineEventWhereInput {
  const types: TimelineEventType[] = [
    "CLIENT_CREATED", "CLIENT_UPDATED", "NOTE_CREATED", "SYSTEM",
  ];
  const entities: TimelineEntityType[] = ["CLIENT", "NOTE"];

  if (access.canViewCases) {
    types.push("CASE_CREATED", "CASE_UPDATED", "CASE_STATUS_CHANGED");
    entities.push("CASE");
  }
  if (access.canViewAgenda) {
    types.push("TASK_CREATED", "TASK_COMPLETED");
    entities.push("TASK");
  }
  if (access.canViewDocuments) {
    types.push("DOCUMENT_UPLOADED", "DOCUMENT_DELETED");
    entities.push("DOCUMENT");
  }
  if (access.canViewFinance) {
    types.push("FINANCIAL_CREATED", "FINANCIAL_UPDATED", "FINANCIAL_PAID");
    entities.push("FINANCIAL");
  }

  // Verifica tipo e entidade para não expor um documento disfarçado de SYSTEM,
  // nem um evento financeiro com entidade nula.
  return {
    AND: [
      { type: { in: types } },
      { OR: [{ entityType: null }, { entityType: { in: entities } }] },
    ],
  };
}
