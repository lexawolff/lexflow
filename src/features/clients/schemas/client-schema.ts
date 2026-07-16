import { z } from "zod";

const optionalText = z.string().trim().optional();

const optionalNumber = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }

    const number = Number(value);

    return Number.isNaN(number) ? value : number;
  },
  z.number().nonnegative().optional()
);

export const clientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Informe o nome completo."),

  cpf: optionalText,
  rg: optionalText,

  birthDate: z
    .string()
    .optional()
    .transform((value) => value || undefined),

  motherName: optionalText,
  fatherName: optionalText,

  gender: optionalText,
  maritalStatus: optionalText,

  nationality: optionalText,
  education: optionalText,

  profession: optionalText,
  income: optionalNumber,

  phone: optionalText,
  whatsapp: optionalText,

  email: z
    .string()
    .trim()
    .email("Informe um e-mail válido.")
    .optional()
    .or(z.literal("")),

  cep: optionalText,
  address: optionalText,
  addressNumber: optionalText,
  complement: optionalText,
  neighborhood: optionalText,
  city: optionalText,
  state: optionalText,

  pis: optionalText,

  govLogin: optionalText,
  govPassword: optionalText,

  notes: optionalText,
});

export type ClientFormValues = z.input<typeof clientSchema>;
