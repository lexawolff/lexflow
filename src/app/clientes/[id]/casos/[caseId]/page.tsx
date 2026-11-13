import {
  notFound,
} from "next/navigation";

import {
  AppShell,
} from "@/components/app-shell/app-shell";

import {
  CaseView,
} from "@/features/cases/components/case-view";

import {
  caseDetailsInclude,
} from "@/features/cases/types";

import {
  requireWorkspacePagePermission,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

type PageProps = {
  params: Promise<{
    id: string;
    caseId: string;
  }>;
};

export default async function CasePage({
  params,
}: PageProps) {
  const {
    id: clientId,
    caseId,
  } =
    await params;

  const {
    workspace,
  } =
    await requireWorkspacePagePermission(
      "CASE_VIEW",
    );

  const demand =
    await prisma.case.findFirst({
      where: {
        id:
          caseId,

        clientId,

        workspaceId:
          workspace.id,
      },

      ...caseDetailsInclude,
    });

  if (!demand) {
    notFound();
  }

  return (
    <AppShell>
      <CaseView
        caseData={
          demand
        }
      />
    </AppShell>
  );
}