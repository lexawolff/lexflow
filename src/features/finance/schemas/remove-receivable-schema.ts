import { z } from "zod";

export const receivableRemovalModeSchema = z.enum([
  "CANCEL",
  "DELETE",
]);

export const receivableRemovalScopeSchema = z.enum([
  "SINGLE",
  "GROUP",
]);

export type ReceivableRemovalMode = z.infer<
  typeof receivableRemovalModeSchema
>;

export type ReceivableRemovalScope = z.infer<
  typeof receivableRemovalScopeSchema
>;

export const removeReceivableSchema = z.object({
  receivableId: z
    .string()
    .uuid("Recebimento inválido."),

  mode: receivableRemovalModeSchema,

  scope: receivableRemovalScopeSchema,
});

export type RemoveReceivableInput = z.infer<
  typeof removeReceivableSchema
>;