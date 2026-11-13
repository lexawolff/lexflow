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
      className="space-y-5"
    >
      {/* ==========================
          NAVEGAÇÃO DAS ABAS
      ========================== */}

      <div className="overflow-x-auto">
        <TabsList className="h-auto min-w-max justify-start gap-1 rounded-2xl border bg-card p-1.5 shadow-sm">
          <TabsTrigger
            value="overview"
            className="gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
          >
            <FileText className="size-4" />

            Visão geral
          </TabsTrigger>

          <TabsTrigger
            value="timeline"
            className="gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
          >
            <History className="size-4" />

            Histórico
          </TabsTrigger>
        </TabsList>
      </div>

      {/* ==========================
          CONTEÚDO
      ========================== */}

      <TabsContent
        value="overview"
        className="mt-0"
      >
        <OverviewTab
          caseData={
            caseData
          }
        />
      </TabsContent>

      <TabsContent
        value="timeline"
        className="mt-0"
      >
        <TimelineTab
          caseData={
            caseData
          }
        />
      </TabsContent>
    </Tabs>
  );
}