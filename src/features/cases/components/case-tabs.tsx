"use client";

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import type { CaseDetails } from "../types";
import { OverviewTab } from "./tabs/overview-tab";
import { TimelineTab } from "./tabs/timeline-tab";
import { DocumentsTab } from "./tabs/documents-tab";

type Props = {
    caseData: CaseDetails;
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
                    Visão Geral
                </TabsTrigger>

                <TabsTrigger value="timeline">
                    Timeline
                </TabsTrigger>

                <TabsTrigger value="tasks">
                    Tarefas
                </TabsTrigger>

                <TabsContent value="documents">
                    <DocumentsTab caseData={caseData} />
                </TabsContent>

                <TabsTrigger value="financial">
                    Financeiro
                </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
                <OverviewTab caseData={caseData} />
            </TabsContent>

            <TabsContent value="timeline">
                <TimelineTab caseData={caseData} />
            </TabsContent>

            <TabsContent value="tasks">
                Em construção
            </TabsContent>

            <TabsContent value="documents">
                Em construção
            </TabsContent>

            <TabsContent value="financial">
                Em construção
            </TabsContent>
        </Tabs>
    );
}