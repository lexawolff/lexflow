import type { TimelineEvent } from "@prisma/client";

import { TimelineDate } from "./timeline-date";
import { TimelineIcon } from "./timeline-icon";

type TimelineItemProps = {
  event: TimelineEvent;
  isLast: boolean;
};

export function TimelineItem({
  event,
  isLast,
}: TimelineItemProps) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <TimelineIcon type={event.type} />

        {!isLast && (
          <div className="mt-2 w-px flex-1 bg-border" />
        )}
      </div>

      <div className="flex-1 rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">
          {event.title}
        </h3>

        {event.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {event.description}
          </p>
        )}

        <TimelineDate date={event.createdAt} />
      </div>
    </div>
  );
}