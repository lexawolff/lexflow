"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/actions/action-result";
import { prisma } from "@/lib/prisma";
import { getDefaultWorkspace } from "@/lib/workspace";

import { createCaseEvent } from "@/features/cases/services/create-case-event";

import { deleteFile } from "../services/delete-file";

export async function deleteDocument(
  documentId: string
): Promise<ActionResult> {
  const workspace = await getDefaultWorkspace();

  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      workspaceId: workspace.id,
    },
  });

  if (!document) {
    return {
      success: false,
      message: "Documento não encontrado.",
    };
  }

  await deleteFile({
    storagePath: document.storagePath,
  });

  await prisma.document.delete({
    where: {
      id: document.id,
    },
  });

  if (document.caseId) {
    await createCaseEvent({
      caseId: document.caseId,
      title: "Documento removido",
      content: document.originalName,
    });

    revalidatePath(`/cases/${document.caseId}`);
  }

  if (document.clientId) {
    revalidatePath(`/clients/${document.clientId}`);
  }

  return {
    success: true,
    data: undefined,
    message: "Documento removido com sucesso.",
  };
}