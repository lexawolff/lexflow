import {
  z,
} from "zod";

import {
  BRAZIL_STATES,
} from "@/features/clients/constants";

import {
  isValidBrazilPhone,
  isValidTaxId,
  normalizeTaxId,
  onlyDigits,
} from "@/lib/br-documents";

export const loginSchema =
  z.object({
    email:
      z
        .string()
        .trim()
        .email(
          "Informe um e-mail válido.",
        )
        .transform(
          (value) =>
            value.toLowerCase(),
        ),

    password:
      z
        .string()
        .min(
          1,
          "Informe sua senha.",
        ),
  });

/*
 * Caixa "Li e aceito os Termos de Uso e a Política de Privacidade".
 * Checkbox marcado chega como "on"; desmarcado não é enviado.
 */
const acceptTermsSchema =
  z.literal(
    "on",
    {
      message:
        "Para continuar, aceite os Termos de Uso e a Política de Privacidade.",
    },
  );

/*
 * O Supabase Auth limita senhas a 72 caracteres (bcrypt).
 */
const newPasswordSchema =
  z
    .string()
    .min(
      8,
      "A senha deve ter pelo menos 8 caracteres.",
    )
    .max(
      72,
      "A senha deve ter no máximo 72 caracteres.",
    );

export const acceptInvitationSchema =
  z
    .object({
      name:
        z
          .string()
          .trim()
          .min(
            3,
            "Informe seu nome completo.",
          )
          .max(
            100,
            "O nome deve ter no máximo 100 caracteres.",
          ),

      password:
        newPasswordSchema,

      passwordConfirm:
        z.string(),

      acceptTerms:
        acceptTermsSchema,
    })
    .refine(
      (data) =>
        data.password ===
        data.passwordConfirm,

      {
        path: [
          "passwordConfirm",
        ],

        message:
          "As senhas não coincidem.",
      },
    );

export const requestPasswordResetSchema =
  z.object({
    email:
      z
        .string()
        .trim()
        .email(
          "Informe um e-mail válido.",
        )
        .transform(
          (value) =>
            value.toLowerCase(),
        ),
  });

export const newPasswordFormSchema =
  z
    .object({
      password:
        newPasswordSchema,

      passwordConfirm:
        z.string(),
    })
    .refine(
      (data) =>
        data.password ===
        data.passwordConfirm,

      {
        path: [
          "passwordConfirm",
        ],

        message:
          "As senhas não coincidem.",
      },
    );

export const changePasswordSchema =
  z
    .object({
      currentPassword:
        z
          .string()
          .min(
            1,
            "Informe sua senha atual.",
          ),

      password:
        newPasswordSchema,

      passwordConfirm:
        z.string(),
    })
    .refine(
      (data) =>
        data.password ===
        data.passwordConfirm,

      {
        path: [
          "passwordConfirm",
        ],

        message:
          "As senhas não coincidem.",
      },
    )
    .refine(
      (data) =>
        data.password !==
        data.currentPassword,

      {
        path: [
          "password",
        ],

        message:
          "A nova senha deve ser diferente da atual.",
      },
    );


const personNameSchema =
  z
    .string()
    .trim()
    .min(
      3,
      "Informe seu nome completo.",
    )
    .max(
      100,
      "O nome deve ter no máximo 100 caracteres.",
    );

const officeNameSchema =
  z
    .string()
    .trim()
    .min(
      3,
      "Informe o nome do escritório.",
    )
    .max(
      120,
      "O nome do escritório deve ter no máximo 120 caracteres.",
    );

function isBrazilState(
  value: string,
) {
  return BRAZIL_STATES.includes(
    value.toUpperCase(),
  );
}

function isOabNumber(
  value: string,
) {
  return /^[0-9A-Za-z./ -]{1,20}$/.test(value);
}

function emptyToUndefined(
  value: string | undefined,
) {
  return value || undefined;
}

const taxIdSchema =
  z
    .string({ error: "Informe o CPF ou CNPJ." })
    .trim()
    .min(
      1,
      "Informe o CPF ou CNPJ.",
    )
    .refine(
      (value) => isValidTaxId(value),
      "Confira o CPF ou CNPJ informado.",
    )
    .transform((value) => normalizeTaxId(value));

// Dados opcionais: em branco é válido; preenchido precisa estar correto.

const optionalWhatsappSchema =
  z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || isValidBrazilPhone(value),
      "Informe o WhatsApp com DDD.",
    )
    .transform((value) => emptyToUndefined(onlyDigits(value ?? "")));

const optionalCitySchema =
  z
    .string()
    .trim()
    .max(
      100,
      "A cidade deve ter no máximo 100 caracteres.",
    )
    .optional()
    .transform(emptyToUndefined);

const optionalStateSchema =
  z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || isBrazilState(value),
      "Selecione uma UF válida.",
    )
    .transform((value) => emptyToUndefined(value?.toUpperCase()));

const optionalOabNumberSchema =
  z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || isOabNumber(value),
      "Confira o número da OAB.",
    )
    .transform((value) => emptyToUndefined(value?.toUpperCase()));

/*
 * Cadastro público de um novo escritório (/cadastro).
 */
export const signUpSchema =
  z
    .object({
      officeName:
        officeNameSchema,

      taxId:
        taxIdSchema,

      city:
        optionalCitySchema,

      state:
        optionalStateSchema,

      name:
        personNameSchema,

      whatsapp:
        optionalWhatsappSchema,

      oabNumber:
        optionalOabNumberSchema,

      oabState:
        optionalStateSchema,

      email:
        z
          .string()
          .trim()
          .max(
            254,
            "E-mail muito longo.",
          )
          .email(
            "Informe um e-mail válido.",
          )
          .transform(
            (value) =>
              value.toLowerCase(),
          ),

      password:
        newPasswordSchema,

      passwordConfirm:
        z.string(),

      acceptTerms:
        acceptTermsSchema,
    })
    .refine(
      (data) =>
        data.password ===
        data.passwordConfirm,

      {
        path: [
          "passwordConfirm",
        ],

        message:
          "As senhas não coincidem.",
      },
    );

/*
 * Dados guardados no Supabase Auth (user_metadata) no cadastro e usados
 * para criar o escritório depois que o e-mail é confirmado.
 * terms_*: versão e momento do aceite (gravados pelo servidor).
 */
export const signupMetadataSchema =
  z.object({
    name:
      personNameSchema,

    signup_office_name:
      officeNameSchema,

    terms_version:
      z.string().min(1).max(20),

    terms_accepted_at:
      z.string().datetime(),

    // Cifrado pelo servidor e conferido ao criar o escritório.
    signup_tax_id:
      z.string().min(1).max(500),

    // Opcionais: valor inválido é ignorado e não impede criar o escritório.
    signup_whatsapp:
      z.string().refine((value) => isValidBrazilPhone(value)).optional().catch(undefined),

    signup_city:
      z.string().trim().min(1).max(100).optional().catch(undefined),

    signup_state:
      z.string().refine(isBrazilState).optional().catch(undefined),

    signup_oab_number:
      z.string().refine(isOabNumber).optional().catch(undefined),

    signup_oab_state:
      z.string().refine(isBrazilState).optional().catch(undefined),
  });
