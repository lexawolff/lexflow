import { DocumentCategory } from "@prisma/client";
import { z } from "zod";

import { validateDocumentFile } from "../document-upload-rules";

export const uploadDocumentSchema = z.object({
  clientId: z.string().uuid(),

  category: z.nativeEnum(DocumentCategory).optional(),

  file: z
    .instanceof(File, { message: "Selecione um arquivo." })
    .superRefine((file, context) => {
      const error = validateDocumentFile(file);

      if (error) {
        context.addIssue({
          code: "custom",
          message: error,
        });
      }
    }),
});

export type UploadDocumentInput = z.infer<
  typeof uploadDocumentSchema
>;
