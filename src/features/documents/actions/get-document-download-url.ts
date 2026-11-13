"use server";

import type {
  ActionResult,
} from "@/lib/actions/action-result";

import {
  requireWorkspacePermission,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

import {
  getDocumentUrl,
} from "../services/get-document-url";

export async function getDocumentDownloadUrl(
  documentId:
    string,
): Promise<ActionResult<string>> {
  const {
    workspace,
  } =
    await requireWorkspacePermission(
      "DOCUMENT_VIEW",
    );

  const document =
    await prisma.document.findFirst({
      where: {
        id:
          documentId,

        workspaceId:
          workspace.id,
      },
    });

  if (!document) {
    return {
      success:
        false,

      message:
        "Documento não encontrado.",
    };
  }

  const url =
    await getDocumentUrl({
      storagePath:
        document.storagePath,
    });

  return {
    success:
      true,

    data:
      url,
  };
}