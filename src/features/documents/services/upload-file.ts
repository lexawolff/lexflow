import "server-only";

import { randomUUID } from "crypto";

import { getStorage } from "@/lib/supabase/storage";

import {
  getFileExtension,
  isAllowedDocumentFile,
} from "../document-upload-rules";

/*
 * Upload direto do navegador para o Supabase Storage.
 *
 * O arquivo não passa pelo servidor do LexFlow (na Vercel, o corpo de
 * cada requisição é limitado a 4,5 MB). O servidor só:
 *   1. gera o caminho e um token de upload de uso único;
 *   2. depois do envio, confere o arquivo no Storage e registra.
 */

export const DOCUMENTS_BUCKET = "documents";

const STORED_NAME_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{1,10}$/;

export function buildDocumentStoragePath({
  workspaceId,
  clientId,
  fileName,
}: {
  workspaceId: string;
  clientId: string;
  fileName: string;
}) {
  // O nome original nunca entra no caminho do Storage.
  const extension = getFileExtension(fileName) ?? "bin";

  return `${workspaceId}/clients/${clientId}/${randomUUID()}.${extension}`;
}

/*
 * O caminho volta do navegador no registro: só é aceito se tiver
 * exatamente o formato gerado acima para este escritório e cliente.
 */
export function isDocumentStoragePathFor({
  storagePath,
  workspaceId,
  clientId,
}: {
  storagePath: string;
  workspaceId: string;
  clientId: string;
}) {
  const prefix = `${workspaceId}/clients/${clientId}/`;

  if (!storagePath.startsWith(prefix)) {
    return false;
  }

  const storedName = storagePath.slice(prefix.length);

  return (
    STORED_NAME_PATTERN.test(storedName) &&
    isAllowedDocumentFile(storedName)
  );
}

export async function createSignedDocumentUpload(
  storagePath: string,
) {
  const { data, error } = await getStorage()
    .from(DOCUMENTS_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    throw new Error(
      error?.message ?? "Não foi possível autorizar o upload.",
    );
  }

  return {
    token: data.token,
  };
}

/*
 * Tamanho e tipo vêm do Storage, não do navegador.
 * Retorna null se o arquivo não existir.
 */
export async function getStoredDocumentInfo(
  storagePath: string,
) {
  const { data, error } = await getStorage()
    .from(DOCUMENTS_BUCKET)
    .info(storagePath);

  if (error || !data) {
    return null;
  }

  return {
    size:
      typeof data.size === "number" ? data.size : null,

    contentType:
      data.contentType ?? null,
  };
}
