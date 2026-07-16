import { z } from "zod";

export const demandSchema = z.object({
  clientId: z.string().min(1, "Selecione um cliente"),

  practiceArea: z.enum([
    "PREVIDENCIARIO",
    "CIVEL",
    "FAMILIA",
    "TRABALHISTA",
    "CONSUMIDOR",
    "ADMINISTRATIVO",
    "TRIBUTARIO",
    "EMPRESARIAL",
    "CRIMINAL",
    "OUTRO",
  ]),

  subject: z.string().min(3, "Informe o tipo da demanda"),

  summary: z.string().min(10, "Faça um breve resumo"),

  nextAction: z.string().min(3),

  dueDate: z.coerce.date(),
});

export type DemandSchema = z.infer<typeof demandSchema>;