"use server";

import { redirect } from "next/navigation";
import { CaseStatus, TaskStatus, TaskType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDefaultWorkspace } from "@/lib/workspace";
import { demandSchema } from "../schemas/demand-schema";

export async function createDemand(formData: FormData) {
  const workspace = await getDefaultWorkspace();

  const rawData = {
    clientId: formData.get("clientId"),
    practiceArea: formData.get("practiceArea"),
    subject: formData.get("subject"),
    summary: formData.get("summary"),
    nextAction: formData.get("nextAction"),
    dueDate: formData.get("dueDate"),
  };

  const parsed = demandSchema.safeParse(rawData);

  if (!parsed.success) {
    throw new Error("Dados inválidos para criação da demanda.");
  }

  const data = parsed.data;

  const createdCase = await prisma.$transaction(async (tx) => {
    const client = await tx.client.findFirst({
      where: {
        id: data.clientId,
        workspaceId: workspace.id,
      },
    });

    if (!client) {
      throw new Error("Cliente não encontrado.");
    }

    const newCase = await tx.case.create({
      data: {
        workspaceId: workspace.id,
        clientId: client.id,
        title: `${data.subject} - ${client.name}`,
        practiceArea: data.practiceArea,
        subject: data.subject,
        notes: data.summary,
        status: CaseStatus.ATENDIMENTO_INICIAL,
      },
    });

    await tx.task.create({
      data: {
        workspaceId: workspace.id,
        clientId: client.id,
        caseId: newCase.id,
        title: data.nextAction,
        description: `Demanda: ${data.subject}\n\nResumo: ${data.summary}`,
        type: data.nextAction.toLowerCase().includes("document")
          ? TaskType.DOCUMENTO_PENDENTE
          : TaskType.OUTRO,
        status: TaskStatus.PENDENTE,
        dueDate: data.dueDate,
      },
    });

    await tx.caseEvent.create({
      data: {
        workspaceId: workspace.id,
        caseId: newCase.id,
        title: "Demanda criada",
        content: data.summary,
      },
    });

    return newCase;
  });

  redirect(`/casos/${createdCase.id}`);
}