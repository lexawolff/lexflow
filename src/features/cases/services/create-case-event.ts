"use server";

import { prisma } from "@/lib/prisma";
import { getDefaultWorkspace } from "@/lib/workspace";

type Input = {
  caseId: string;
  title: string;
  content?: string;
  date?: Date;
};

export async function createCaseEvent({
  caseId,
  title,
  content,
  date,
}: Input) {
  const workspace = await getDefaultWorkspace();

  return prisma.caseEvent.create({
    data: {
      workspaceId: workspace.id,
      caseId,
      title,
      content,
      date,
    },
  });
}