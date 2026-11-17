"use server";

import {
  revalidatePath,
} from "next/cache";

import type {
  ActionResult,
} from "@/lib/actions/action-result";

import {
  runActionResult,
} from "@/lib/actions/run-action";

import {
  requireWorkspacePermission,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

import {
  deleteFile,
} from "../services/delete-file";

export async function deleteDocument(
  documentId:
    string,
): Promise<ActionResult> {
  return runActionResult(
    () =>
      deleteDocumentImpl(
        documentId,
      ),
  );
}

async function deleteDocumentImpl(
  documentId:
    string,
): Promise<ActionResult> {
  const {
    workspace,
  } =
    await requireWorkspacePermission(
      "DOCUMENT_DELETE",
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

  await deleteFile({
    storagePath:
      document.storagePath,
  });

  await prisma.document.delete({
    where: {
      id:
        document.id,
    },
  });

  revalidatePath(
    `/clientes/${document.clientId}`,
  );

  return {
    success:
      true,

    data:
      undefined,

    message:
      "Documento removido com sucesso.",
  };
}