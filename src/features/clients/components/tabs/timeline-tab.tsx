import type { ClientDetails } from "../../types";

import { Timeline } from "@/features/timeline/components/timeline";

type TimelineTabProps = {
  client: ClientDetails;
};

export function TimelineTab({
  client,
}: TimelineTabProps) {
  return (
    <Timeline
      events={client.timelineEvents}
    />
  );
}