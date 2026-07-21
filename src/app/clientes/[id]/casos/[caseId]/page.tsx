import { notFound } from "next/navigation";

import { AppShell } from "@/components/app-shell/app-shell";

import { prisma } from "@/lib/prisma";
import { serializePrisma } from "@/lib/prisma/serialize";
import { getDefaultWorkspace } from "@/lib/workspace";
import { caseDetailsInclude } from "@/features/cases/types";
import { CaseHeader } from "@/features/cases/components/case-header";
import { CaseTabs } from "@/features/cases/components/case-tabs";
import { CaseSummaryCards } from "@/features/cases/components/case-summary-cards";

type PageProps = {
    params: Promise<{
        id: string;
        caseId: string;
    }>;
};

export default async function CasePage({
    params,
}: PageProps) {
    const { id, caseId } = await params;

    const workspace = await getDefaultWorkspace();

    const demand = await prisma.case.findFirst({
        where: {
            id: caseId,
            clientId: id,
            workspaceId: workspace.id,
        },
        ...caseDetailsInclude,
    });

    if (!demand) {
        notFound();
    }

    const data = serializePrisma(demand);

    return (
        <AppShell>
            <div className="space-y-6">

                <CaseHeader
                    title={data.title}
                    clientName={data.client.name}
                    practiceArea={data.practiceArea}
                    status={data.status}
                />

                <CaseSummaryCards
                    caseData={data}
                />

                <CaseTabs
                    caseData={data}
                />

            </div>
        </AppShell>
    );
}