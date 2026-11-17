"use server";

import type {
  Document,
} from "@prisma/client";

import {
  revalidatePath,
} from "next/cache";

import type {
  ActionResult,
} from "@/lib/actions/action-result";

import {
  parseFormData,
} from "@/lib/actions/parse-form-data";

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
  registerDocumentUploaded,
} from "@/features/timeline/lib/events/document-uploaded";

import {
  MAX_DOCUMENT_SIZE_BYTES,
  MAX_DOCUMENT_SIZE_MB,
} from "../document-upload-rules";

import {
  prepareDocumentUploadSchema,
  registerUploadedDocumentSchema,
  type PrepareDocumentUploadInput,
  type RegisterUploadedDocumentInput,
} from "../schemas/upload-document-schema";

import {
  deleteFile,
} from "../services/delete-file";

import {
  buildDocumentStoragePath,
  createSignedDocumentUpload,
  getStoredDocumentInfo,
  isDocumentStoragePathFor,
} from "../services/upload-file";

export type PreparedDocumentUpload = {
  storagePath: string;
  token: string;
};

async function findClientInWorkspace(
  clientId: string,
  workspaceId: string,
) {
  /*
   * Não confiamos no clientId enviado pelo navegador:
   * o cliente precisa pertencer ao escritório do usuário.
   */
  return prisma.client.findFirst({
    where: {
      id: clientId,
      workspaceId,
    },
    select: {
      id: true,
    },
  });
}

/*
 * Etapa 1: confere permissão, cliente e arquivo e devolve um token de
 * upload de uso único para o navegador enviar direto ao Storage.
 */
async function prepareDocumentUploadImpl(
  input: PrepareDocumentUploadInput,
): Promise<ActionResult<PreparedDocumentUpload>> {
  const {
    workspace,
  } =
    await requireWorkspacePermission(
      "DOCUMENT_CREATE",
    );

  const {
    clientId,
    fileName,
  } =
    parseFormData(
      prepareDocumentUploadSchema,
      input,
    );

  const client =
    await findClientInWorkspace(
      clientId,
      workspace.id,
    );

  if (!client) {
    return {
      success: false,
      message: "Cliente não encontrado neste escritório.",
    };
  }

  const storagePath =
    buildDocumentStoragePath({
      workspaceId: workspace.id,
      clientId: client.id,
      fileName,
    });

  const { token } =
    await createSignedDocumentUpload(
      storagePath,
    );

  return {
    success: true,
    data: {
      storagePath,
      token,
    },
  };
}

/*
 * Etapa 3: o arquivo já está no Storage. Conferimos caminho, existência
 * e tamanho real antes de criar o registro.
 */
async function registerUploadedDocumentImpl(
  input: RegisterUploadedDocumentInput,
): Promise<ActionResult<Document>> {
  const {
    workspace,
  } =
    await requireWorkspacePermission(
      "DOCUMENT_CREATE",
    );

  const {
    clientId,
    category,
    originalName,
    storagePath,
  } =
    parseFormData(
      registerUploadedDocumentSchema,
      input,
    );

  const client =
    await findClientInWorkspace(
      clientId,
      workspace.id,
    );

  if (
    !client ||
    !isDocumentStoragePathFor({
      storagePath,
      workspaceId: workspace.id,
      clientId: client.id,
    })
  ) {
    return {
      success: false,
      message: "Envio inválido. Selecione o arquivo e tente novamente.",
    };
  }

  const alreadyRegistered =
    await prisma.document.findFirst({
      where: {
        storagePath,
      },
      select: {
        id: true,
      },
    });

  if (alreadyRegistered) {
    return {
      success: false,
      message: "Este arquivo já foi registrado.",
    };
  }

  const stored =
    await getStoredDocumentInfo(
      storagePath,
    );

  if (!stored) {
    return {
      success: false,
      message: "O arquivo não chegou ao armazenamento. Tente enviar novamente.",
    };
  }

  if (
    stored.size !== null &&
    stored.size > MAX_DOCUMENT_SIZE_BYTES
  ) {
    await deleteFile({ storagePath }).catch(() => undefined);

    return {
      success: false,
      message: `O arquivo excede o limite de ${MAX_DOCUMENT_SIZE_MB} MB.`,
    };
  }

  let document: Document;

  try {
    document =
      await prisma.document.create({
        data: {
          workspaceId: workspace.id,
          clientId: client.id,
          originalName,
          storagePath,
          fileType: stored.contentType,
          size: stored.size ?? 0,
          category,
        },
      });
  } catch (error) {
    /*
     * O arquivo já está no Storage, mas o registro falhou:
     * removemos o arquivo para não deixar dado sensível órfão.
     */
    await deleteFile({ storagePath }).catch(() => {
      console.error(
        "Falha ao remover arquivo órfão do Storage:",
        storagePath,
      );
    });

    throw error;
  }

  /*
   * O documento já está salvo; uma falha ao registrar o histórico
   * não deve parecer falha no upload.
   */
  try {
    await registerDocumentUploaded({
      workspaceId: workspace.id,
      clientId: client.id,
      documentId: document.id,
      fileName: document.originalName,
      category: document.category ?? "OUTROS",
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
    success: true,
    data: document,
    message: "Documento anexado com sucesso.",
  };
}

export async function prepareDocumentUpload(
  input: PrepareDocumentUploadInput,
): Promise<ActionResult<PreparedDocumentUpload>> {
  return runActionResult(
    () =>
      prepareDocumentUploadImpl(
        input,
      ),
  );
}

export async function registerUploadedDocument(
  input: RegisterUploadedDocumentInput,
): Promise<ActionResult<Document>> {
  return runActionResult(
    () =>
      registerUploadedDocumentImpl(
        input,
      ),
  );
}
