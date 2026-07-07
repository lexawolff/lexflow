import { prisma } from "@/lib/prisma";

export async function getDefaultWorkspace() {
  const existing = await prisma.workspace.findFirst();

  if (existing) return existing;

  return prisma.workspace.create({
    data: {
      name: "Roza Advocacia",
      slug: "roza-advocacia",
    },
  });
}