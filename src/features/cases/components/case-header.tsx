import { ClientDetails } from "@/features/clients/types";

import { PracticeAreaBadge } from "./practice-area-badge";
import { CaseStatusBadge } from "./case-status-badge";

type CaseHeaderProps = {
  title: string;
  clientName: string;
  practiceArea: ClientDetails["cases"][number]["practiceArea"];
  status: ClientDetails["cases"][number]["status"];
};

export function CaseHeader({
  title,
  clientName,
  practiceArea,
  status,
}: CaseHeaderProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">
          {title}
        </h1>

        <p className="text-muted-foreground">
          Cliente: <strong>{clientName}</strong>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <PracticeAreaBadge area={practiceArea} />
        <CaseStatusBadge status={status} />
      </div>
    </div>
  );
}