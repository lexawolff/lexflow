"use server";

import type { Document } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { ActionError } from "@/lib/actions/action-error";
import type { ActionResult } from "@/lib/actions/action-result";
import { parseFormData } from "@/lib/actions/parse-form-data";

import { prisma } from "@/lib/prisma";
import { getDefaultWorkspace } from "@/lib/workspace";

import { uploadDocumentSchema } from "../schemas/upload-document-schema";
import { uploadFile } from "../services/upload-file";

export async function uploadDocument(
  formData: FormData
): Promise<ActionResult<Document>> {
  try {
    const {
      clientId,
      category,
      file,
    } = parseFormData(uploadDocumentSchema, {
      clientId: formData.get("clientId")?.toString(),
      category: formData.get("category")?.toString() || undefined,
      file: formData.get("file"),
    });

    const workspace = await getDefaultWorkspace();

    const uploaded = await uploadFile({
      workspaceId: workspace.id,
      clientId,
      file,
    });

    const document = await prisma.document.create({
      data: {
        workspaceId: workspace.id,
        clientId,
        originalName: uploaded.originalName,
        storagePath: uploaded.storagePath,
        fileType: uploaded.fileType,
        size: uploaded.size,
        category,
      },
    });

    revalidatePath(`/clients/${clientId}`);

    return {
      success: true,
      data: document,
      message: "Documento anexado com sucesso.",
    };
  } catch (error) {
    if (error instanceof ActionError) {
      return {
        success: false,
        message: error.message,
      };
    }

    throw error;
  }
}