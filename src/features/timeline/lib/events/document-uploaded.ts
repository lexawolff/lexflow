import {
  TimelineEntityType,
  TimelineEventType,
} from "@prisma/client";

import { createTimelineEvent } from "../create-timeline-event";

type RegisterDocumentUploadedInput = {
  workspaceId: string;
  clientId: string;

  documentId: string;

  fileName: string;

  category: string;
};

export async function registerDocumentUploaded({
  workspaceId,
  clientId,
  documentId,
  fileName,
  category,
}: RegisterDocumentUploadedInput) {
  return createTimelineEvent({
    workspaceId,
    clientId,

    type: TimelineEventType.DOCUMENT_UPLOADED,

    title: "Documento adicionado",

    description: fileName,

    entityType: TimelineEntityType.DOCUMENT,
    entityId: documentId,

    metadata: {
      category,
    },
  });
}