import { TimelineEventType } from "@prisma/client";

import { timelineEvents } from "../config/timeline-events";

type TimelineIconProps = {
  type: TimelineEventType;
};

export function TimelineIcon({ type }: TimelineIconProps) {
  const config = timelineEvents[type];

  const Icon = config.icon;

  return (
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-full ${config.className}`}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}