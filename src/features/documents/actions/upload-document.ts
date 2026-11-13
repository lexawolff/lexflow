"use server";

import type {
  Document,
} from "@prisma/client";

import {
  revalidatePath,
} from "next/cache";

import {
  ActionError,
} from "@/lib/actions/action-error";

import type {
  ActionResult,
} from "@/lib/actions/action-result";

import {
  parseFormData,
} from "@/lib/actions/parse-form-data";

import {
  requireWorkspacePermission,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

import {
  registerDocumentUploaded,
} from "@/features/timeline/lib/events/document-uploaded";

import {
  uploadDocumentSchema,
} from "../schemas/upload-document-schema";

import {
  uploadFile,
} from "../services/upload-file";

export async function uploadDocument(
  formData:
    FormData,
): Promise<ActionResult<Document>> {
  const {
    workspace,
  } =
    await requireWorkspacePermission(
      "DOCUMENT_CREATE",
    );

  try {
    const {
      clientId,
      category,
      file,
    } =
      parseFormData(
        uploadDocumentSchema,
        {
          clientId:
            formData
              .get("clientId")
              ?.toString(),

          category:
            formData
              .get("category")
              ?.toString() ||
            undefined,

          file:
            formData.get(
              "file",
            ),
        },
      );

    /*
     * Não confiamos no clientId
     * enviado pelo navegador.
     *
     * O cliente precisa pertencer
     * ao mesmo workspace do usuário.
     */
    const client =
      await prisma.client.findFirst({
        where: {
          id:
            clientId,

          workspaceId:
            workspace.id,
        },

        select: {
          id:
            true,
        },
      });

    if (!client) {
      return {
        success:
          false,

        message:
          "Cliente não encontrado neste escritório.",
      };
    }

    const uploaded =
      await uploadFile({
        workspaceId:
          workspace.id,

        clientId:
          client.id,

        file,
      });

    const document =
      await prisma.document.create({
        data: {
          workspaceId:
            workspace.id,

          clientId:
            client.id,

          originalName:
            uploaded.originalName,

          storagePath:
            uploaded.storagePath,

          fileType:
            uploaded.fileType,

          size:
            uploaded.size,

          category,
        },
      });

    await registerDocumentUploaded({
      workspaceId:
        workspace.id,

      clientId:
        client.id,

      documentId:
        document.id,

      fileName:
        document.originalName,

      category:
        document.category ??
        "OUTROS",
    });

    revalidatePath(
      `/clientes/${client.id}`,
    );

    return {
      success:
        true,

      data:
        document,

      message:
        "Documento anexado com sucesso.",
    };
  } catch (error) {
    if (
      error instanceof
      ActionError
    ) {
      return {
        success:
          false,

        message:
          error.message,
      };
    }

    throw error;
  }
}