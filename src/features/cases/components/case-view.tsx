import type { CaseDetails } from "../types";

import { CaseTabs } from "./case-tabs";

type CaseViewProps = {
  caseData: CaseDetails;
};

export function CaseView({
  caseData,
}: CaseViewProps) {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">
          {caseData.title}
        </h1>

        <p className="text-muted-foreground">
          {caseData.client?.name}
        </p>
      </header>

      <CaseTabs caseData={caseData} />
    </div>
  );
}