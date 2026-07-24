import { ZodTypeAny } from "zod";

import { ActionError } from "./action-error";

export function parseFormData<TSchema extends ZodTypeAny>(
  schema: TSchema,
  values: unknown
) {
  const parsed = schema.safeParse(values);

  if (!parsed.success) {
    throw new ActionError(
      parsed.error.issues[0]?.message ??
        "Dados inválidos."
    );
  }

  return parsed.data;
}