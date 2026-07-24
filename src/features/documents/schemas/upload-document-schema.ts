import { DocumentCategory } from "@prisma/client";
import { z } from "zod";

export const uploadDocumentSchema = z.object({
  clientId: z.string().uuid(),

  category: z.nativeEnum(DocumentCategory).optional(),

  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, "Selecione um arquivo."),
});

export type UploadDocumentInput = z.infer<
  typeof uploadDocumentSchema
>;