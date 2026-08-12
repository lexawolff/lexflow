import type { TimelineEvent } from "@prisma/client";

import { TimelineItem } from "./timeline-item";

type TimelineProps = {
  events: TimelineEvent[];
};

export function Timeline({ events }: TimelineProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhum evento foi registrado até o momento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {events.map((event, index) => (
        <TimelineItem
          key={event.id}
          event={event}
          isLast={index === events.length - 1}
        />
      ))}
    </div>
  );
}