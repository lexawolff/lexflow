"use server";

import type { ActionResult } from "@/lib/actions/action-result";
import { prisma } from "@/lib/prisma";
import { getDefaultWorkspace } from "@/lib/workspace";

import { getDocumentUrl } from "../services/get-document-url";

export async function getDocumentDownloadUrl(
  documentId: string
): Promise<ActionResult<string>> {
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

  const url = await getDocumentUrl({
    storagePath: document.storagePath,
  });

  return {
    success: true,
    data: url,
  };
}