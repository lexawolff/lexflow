import type {
  TimelineEvent,
} from "@prisma/client";

import {
  TimelineItem,
} from "./timeline-item";

type DateLike =
  | Date
  | string;

type TimelineEventInput =
  Omit<
    TimelineEvent,
    | "createdAt"
    | "updatedAt"
  > & {
    createdAt:
      DateLike;

    updatedAt:
      DateLike;
  };

type TimelineProps = {
  events:
    TimelineEventInput[];
};

function normalizeDate(
  value:
    DateLike,
): Date {
  if (
    value instanceof Date
  ) {
    return value;
  }

  return new Date(
    value,
  );
}

function normalizeTimelineEvent(
  event:
    TimelineEventInput,
): TimelineEvent {
  return {
    ...event,

    createdAt:
      normalizeDate(
        event.createdAt,
      ),

    updatedAt:
      normalizeDate(
        event.updatedAt,
      ),
  };
}

export function Timeline({
  events,
}: TimelineProps) {
  if (
    events.length ===
    0
  ) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/10 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhum evento foi registrado até o momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {events.map(
        (
          event,
          index,
        ) => {
          const normalizedEvent =
            normalizeTimelineEvent(
              event,
            );

          return (
            <TimelineItem
              key={
                event.id
              }
              event={
                normalizedEvent
              }
              isLast={
                index ===
                events.length -
                  1
              }
            />
          );
        },
      )}
    </div>
  );
}