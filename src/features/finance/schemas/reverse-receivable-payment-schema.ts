import { z } from "zod";

export const reverseReceivablePaymentSchema =
  z.object({
    receivableId: z
      .string()
      .uuid("Recebimento inválido."),
  });

export type ReverseReceivablePaymentInput =
  z.infer<
    typeof reverseReceivablePaymentSchema
  >;