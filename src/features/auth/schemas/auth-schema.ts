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