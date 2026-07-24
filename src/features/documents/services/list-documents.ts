import { prisma } from "@/lib/prisma";

type ListDocumentsInput = {
  workspaceId: string;
  clientId: string;
};

export async function listDocuments({
  workspaceId,
  clientId,
}: ListDocumentsInput) {
  return prisma.document.findMany({
    where: {
      workspaceId,
      clientId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}