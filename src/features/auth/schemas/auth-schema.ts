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

export const setupOwnerSchema =
  z
    .object({
      name:
        z
          .string()
          .trim()
          .min(
            3,
            "Informe seu nome.",
          ),

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
            8,
            "A senha deve ter pelo menos 8 caracteres.",
          ),

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
