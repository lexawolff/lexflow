import "server-only";

import { prisma } from "@/lib/prisma";

/*
 * Registra um evento no histórico do processo.
 *
 * Função interna do servidor (não é Server Action): só pode ser chamada
 * por actions que já validaram permissão e escritório. Mesmo assim,
 * confere que o processo pertence ao escritório informado.
 */
type Input = {
  workspaceId: string;
  caseId: string;
  title: string;
  content?: string;
  date?: Date;
};

export async function createCaseEvent({
  workspaceId,
  caseId,
  title,
  content,
  date,
}: Input) {
  const ownedCase = await prisma.case.findFirst({
    where: {
      id: caseId,
      workspaceId,
    },
    select: {
      id: true,
    },
  });

  if (!ownedCase) {
    throw new Error("Processo não encontrado neste escritório.");
  }

  return prisma.caseEvent.create({
    data: {
      workspaceId,
      caseId: ownedCase.id,
      title,
      content,
      date,
    },
  });
}
