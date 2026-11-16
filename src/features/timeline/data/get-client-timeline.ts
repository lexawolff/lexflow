import "server-only";

import { prisma } from "@/lib/prisma";
import { hasPermission, requireWorkspacePermission } from "@/lib/permissions";
import { buildTimelineAccessWhere } from "./timeline-access";

export async function getClientTimeline(clientId: string) {
  const { workspace, membership } = await requireWorkspacePermission("CLIENT_VIEW");
  return prisma.timelineEvent.findMany({
    where: {
      clientId,
      workspaceId: workspace.id,
      ...buildTimelineAccessWhere({
        canViewCases: hasPermission(membership.role, "CASE_VIEW"),
        canViewAgenda: hasPermission(membership.role, "AGENDA_VIEW"),
        canViewDocuments: hasPermission(membership.role, "DOCUMENT_VIEW"),
        canViewFinance: hasPermission(membership.role, "FINANCE_VIEW"),
      }),
    },
    orderBy: { createdAt: "desc" },
  });
}
