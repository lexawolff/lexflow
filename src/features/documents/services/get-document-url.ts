import { getStorage } from "@/lib/supabase/storage";

type GetDocumentUrlInput = {
  storagePath: string;
};

export async function getDocumentUrl({
  storagePath,
}: GetDocumentUrlInput) {
  const storage = await getStorage();

  const { data, error } = await storage
    .from("documents")
    .createSignedUrl(storagePath, 60 * 10); // 10 minutos

  if (error) {
    throw new Error(error.message);
  }

  return data.signedUrl;
}