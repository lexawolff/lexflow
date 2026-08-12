import { prisma } from "@/lib/prisma";

import {
  TimelineEntityType,
  TimelineEventType,
} from "@prisma/client";

import { Prisma } from "@prisma/client";

type CreateTimelineEventInput = {
  workspaceId: string;
  clientId: string;

  type: TimelineEventType;

  title: string;
  description?: string;

  entityType?: TimelineEntityType;
  entityId?: string;

  metadata?: Prisma.InputJsonValue;
};

export async function createTimelineEvent({
  workspaceId,
  clientId,
  type,
  title,
  description,
  entityType,
  entityId,
  metadata,
}: CreateTimelineEventInput) {
  return prisma.timelineEvent.create({
    data: {
      workspaceId,
      clientId,
      type,
      title,
      description,
      entityType,
      entityId,
      metadata,
    },
  });
}