import { randomUUID } from "crypto";
import { getStorage } from "@/lib/supabase/storage";

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

  const extension = file.name.split(".").pop() ?? "";

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