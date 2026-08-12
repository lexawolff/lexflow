import { z } from "zod";

export const registerPaymentFormSchema = z.object({
  amount: z
    .number()
    .positive("Informe um valor válido."),

  paidAt: z
    .string()
    .min(1, "Informe a data do pagamento."),
});

export type RegisterPaymentFormValues = z.infer<
  typeof registerPaymentFormSchema
>;