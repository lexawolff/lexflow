import {
  FileText,
  History,
} from "lucide-react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import type {
  CaseDetails,
} from "../types";

import {
  OverviewTab,
} from "./tabs/overview-tab";

import {
  TimelineTab,
} from "./tabs/timeline-tab";

type Props = {
  caseData:
    CaseDetails;
};

export function CaseTabs({
  caseData,
}: Props) {
  return (
    <Tabs
      defaultValue="overview"
      className="space-y-4"
    >
      <TabsList>
        <TabsTrigger value="overview">
          <FileText className="size-4" />

          Visão geral
        </TabsTrigger>

        <TabsTrigger value="timeline">
          <History className="size-4" />

          Histórico
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <OverviewTab
          caseData={
            caseData
          }
        />
      </TabsContent>

      <TabsContent value="timeline">
        <TimelineTab
          caseData={
            caseData
          }
        />
      </TabsContent>
    </Tabs>
  );
}