import { DocumentCategory } from "@prisma/client";
import { z } from "zod";

import { validateDocumentFile } from "../document-upload-rules";

/*
 * Etapa 1: pedido de autorização de upload (nome e tamanho informados
 * pelo navegador; o tamanho real é conferido no Storage na etapa 3).
 */
export const prepareDocumentUploadSchema = z
  .object({
    clientId: z.string().uuid("Cliente inválido."),

    category: z.nativeEnum(DocumentCategory).optional(),

    fileName: z
      .string()
      .trim()
      .min(1, "Selecione um arquivo.")
      .max(255, "O nome do arquivo é muito longo."),

    size: z.number().int().nonnegative(),
  })
  .superRefine((value, context) => {
    const error = validateDocumentFile({
      name: value.fileName,
      size: value.size,
    });

    if (error) {
      context.addIssue({
        code: "custom",
        path: ["fileName"],
        message: error,
      });
    }
  });

/*
 * Etapa 3: registro do arquivo já enviado ao Storage.
 */
export const registerUploadedDocumentSchema = z.object({
  clientId: z.string().uuid("Cliente inválido."),

  category: z.nativeEnum(DocumentCategory).optional(),

  originalName: z
    .string()
    .trim()
    .min(1, "Nome do arquivo inválido.")
    .max(255, "O nome do arquivo é muito longo."),

  storagePath: z.string().min(1).max(512),
});

export type PrepareDocumentUploadInput = z.input<
  typeof prepareDocumentUploadSchema
>;

export type RegisterUploadedDocumentInput = z.input<
  typeof registerUploadedDocumentSchema
>;
