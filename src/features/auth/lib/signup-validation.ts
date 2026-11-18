import {
  signUpSchema,
} from "../schemas/auth-schema";

/*
 * Validação do cadastro por campo, usada no navegador (avisos ao lado de
 * cada campo) e no servidor (validação definitiva).
 */
export const SIGN_UP_STEPS = [
  {
    id: "escritorio",
    title: "Escritório",
    description: "Comece pelos dados do seu escritório.",
    fields: ["officeName", "taxId", "city", "state"],
  },
  {
    id: "responsavel",
    title: "Responsável",
    description: "Quem vai administrar a conta do escritório.",
    fields: ["name", "whatsapp", "oabNumber", "oabState"],
  },
  {
    id: "acesso",
    title: "Acesso",
    description: "Defina como você vai entrar no LexFlow.",
    fields: ["email", "password", "passwordConfirm", "acceptTerms"],
  },
] as const;

export type SignUpField =
  (typeof SIGN_UP_STEPS)[number]["fields"][number];

export const SIGN_UP_FIELDS: readonly SignUpField[] =
  SIGN_UP_STEPS.flatMap((step) => step.fields);

export type SignUpFieldErrors = Partial<Record<SignUpField, string>>;

export function getSignUpStepIndex(
  field: SignUpField,
): number {
  return SIGN_UP_STEPS.findIndex((step) =>
    (step.fields as readonly SignUpField[]).includes(field));
}

export function getSignUpFieldErrors(
  values: Record<string, unknown>,
): SignUpFieldErrors {
  const errors: SignUpFieldErrors = {};
  const parsed = signUpSchema.safeParse(values);

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as SignUpField | undefined;

      if (field && !errors[field]) {
        errors[field] = issue.message;
      }
    }
  }

  // O schema só compara as senhas quando todos os campos são válidos.
  if (
    !errors.password &&
    !errors.passwordConfirm &&
    values.password !== values.passwordConfirm
  ) {
    errors.passwordConfirm = "As senhas não coincidem.";
  }

  // OAB é opcional, mas número e UF só fazem sentido juntos.
  if (values.oabNumber && !values.oabState && !errors.oabState) {
    errors.oabState = "Selecione a UF da OAB.";
  }

  if (values.oabState && !values.oabNumber && !errors.oabNumber) {
    errors.oabNumber = "Informe o número da OAB.";
  }

  return errors;
}
