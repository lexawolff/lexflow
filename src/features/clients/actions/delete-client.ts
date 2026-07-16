"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getDefaultWorkspace } from "@/lib/workspace";

export async function deleteClient(clientId: string) {
  const workspace = await getDefaultWorkspace();

  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      workspaceId: workspace.id,
    },
    include: {
      cases: {
        select: { id: true },
      },
      documents: {
        select: { id: true },
      },
      tasks: {
        select: { id: true },
      },
      receivables: {
        select: { id: true },
      },
      events: {
        select: { id: true },
      },
    },
  });

  if (!client) {
    throw new Error("Cliente não encontrado.");
  }

  const hasDependencies =
    client.cases.length > 0 ||
    client.documents.length > 0 ||
    client.tasks.length > 0 ||
    client.receivables.length > 0 ||
    client.events.length > 0;

  if (hasDependencies) {
    throw new Error(
      "Não é possível excluir este cliente porque existem registros vinculados a ele."
    );
  }

  await prisma.client.delete({
    where: {
      id: client.id,
    },
  });

  redirect("/clientes");
}