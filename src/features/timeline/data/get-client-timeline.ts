import { prisma } from "@/lib/prisma";

export async function getClientTimeline(clientId: string) {
  return prisma.timelineEvent.findMany({
    where: {
      clientId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}