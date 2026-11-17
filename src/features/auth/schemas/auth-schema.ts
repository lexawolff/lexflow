import {
  z,
} from "zod";

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

/*
 * Cadastro público de um novo escritório (/cadastro).
 */
export const signUpSchema =
  z
    .object({
      officeName:
        officeNameSchema,

      name:
        personNameSchema,

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
  });
