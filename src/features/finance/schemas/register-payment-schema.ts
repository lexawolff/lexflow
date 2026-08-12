import { z } from "zod";

export const registerPaymentSchema = z.object({
  receivableId: z.string().min(1),

  amount: z.coerce
    .number()
    .positive("Informe um valor válido."),

  paidAt: z.coerce.date(),
});

export type RegisterPaymentSchema = z.infer<
  typeof registerPaymentSchema
>;