import { notFound } from "next/navigation";

import { getDefaultWorkspace } from "@/lib/workspace";

import { CaseView } from "@/features/cases/components/case-view";
import { getCase } from "@/features/cases/services/get-case";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CasePage({
  params,
}: PageProps) {
  const { id } = await params;

  const workspace = await getDefaultWorkspace();

  const caseData = await getCase({
    workspaceId: workspace.id,
    caseId: id,
  });

  if (!caseData) {
    notFound();
  }

  return <CaseView caseData={caseData} />;
}