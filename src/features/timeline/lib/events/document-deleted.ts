import {
  TimelineEntityType,
  TimelineEventType,
} from "@prisma/client";

import { createTimelineEvent } from "../create-timeline-event";

type RegisterDocumentDeletedInput = {
  workspaceId: string;
  clientId: string;
  documentId: string;
  fileName: string;
};

export async function registerDocumentDeleted({
  workspaceId,
  clientId,
  documentId,
  fileName,
}: RegisterDocumentDeletedInput) {
  return createTimelineEvent({
    workspaceId,
    clientId,
    type: TimelineEventType.DOCUMENT_DELETED,
    title: "Documento removido",
    description: fileName,
    entityType: TimelineEntityType.DOCUMENT,
    entityId: documentId,
  });
}