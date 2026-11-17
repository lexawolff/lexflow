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

import {
  deleteFile,
} from "../services/delete-file";

export async function uploadDocument(
  formData:
    FormData,
): Promise<ActionResult<Document>> {
  try {
    const {
      workspace,
    } =
      await requireWorkspacePermission(
        "DOCUMENT_CREATE",
      );

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

    let document: Document;

    try {
      document =
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
    } catch (error) {
      /*
       * O arquivo já foi para o Storage,
       * mas o registro falhou: removemos
       * o arquivo para não deixar dado
       * sensível órfão.
       */
      await deleteFile({
        storagePath:
          uploaded.storagePath,
      }).catch((cleanupError) => {
        console.error(
          "Falha ao remover arquivo órfão do Storage:",
          uploaded.storagePath,
          cleanupError,
        );
      });

      throw error;
    }

    /*
     * O documento já está salvo; uma
     * falha ao registrar o histórico
     * não deve parecer falha no upload.
     */
    try {
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
    } catch (error) {
      console.error(
        "Documento enviado, mas o evento de histórico falhou:",
        error,
      );
    }

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

    console.error(
      "Erro inesperado no upload de documento:",
      error,
    );

    return {
      success:
        false,

      message:
        "Não foi possível enviar o documento. Tente novamente.",
    };
  }
}