import { getStorage } from "@/lib/supabase/storage";

type DeleteFileInput = {
  storagePath: string;
};

export async function deleteFile({
  storagePath,
}: DeleteFileInput) {
  const storage = await getStorage();

  const { error } = await storage
    .from("documents")
    .remove([storagePath]);

  if (error) {
    throw new Error(error.message);
  }
}