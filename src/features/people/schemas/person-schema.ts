import { z } from "zod";

export const personSchema = z.object({
  name: z.string().min(2, "Informe o nome"),
  cpf: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  city: z.string().optional(),
  state: z.string().optional(),
  profession: z.string().optional(),
  notes: z.string().optional(),
});

export type PersonSchema = z.infer<typeof personSchema>;