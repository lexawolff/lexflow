import { randomUUID } from "crypto";
import { getStorage } from "@/lib/supabase/storage";
import { getFileExtension } from "../document-upload-rules";

type UploadFileInput = {
  workspaceId: string;
  clientId: string;
  file: File;
};

export async function uploadFile({
  workspaceId,
  clientId,
  file,
}: UploadFileInput) {
  const storage = getStorage();

  /*
   * A extensão já foi validada pela lista
   * de permissões; normalizamos para
   * minúsculas e nunca usamos o nome
   * original no caminho do Storage.
   */
  const extension = getFileExtension(file.name) ?? "bin";

  const filename = `${randomUUID()}.${extension}`;

  const storagePath = `${workspaceId}/clients/${clientId}/${filename}`;

  const { error } = await storage
    .from("documents")
    .upload(storagePath, file, {
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw new Error(error.message);
  }

  return {
    storagePath,
    originalName: file.name,
    fileType: file.type,
    size: file.size,
  };
}