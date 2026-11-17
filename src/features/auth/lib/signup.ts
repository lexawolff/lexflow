import "server-only";

import {
  randomBytes,
} from "node:crypto";

import {
  UserRole,
} from "@prisma/client";

import {
  prisma,
} from "@/lib/prisma";

import {
  isLegalInfoComplete,
} from "@/features/legal/legal-info";

import {
  signupMetadataSchema,
} from "../schemas/auth-schema";

/*
 * Cadastro público de escritórios.
 *
 * - Desenvolvimento: ligado por padrão (SIGNUP_ENABLED="false" desliga).
 * - Produção: desligado até SIGNUP_ENABLED="true". Serve também como
 *   botão de emergência em caso de abuso.
 */
export function isSignupEnabled(): boolean {
  const flag = process.env.SIGNUP_ENABLED;

  if (flag === "false") {
    return false;
  }

  if (process.env.NODE_ENV === "development") {
    return true;
  }

  // Produção: só abre com a variável ligada E com os Termos e a
  // Política preenchidos (sem campos entre colchetes).
  return flag === "true" && isLegalInfoComplete();
}

/*
 * Slug único: nome sem acentos + sufixo aleatório (evita colisões entre
 * escritórios de mesmo nome sem consultar o banco).
 */
export function buildWorkspaceSlug(officeName: string): string {
  const base = officeName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");

  const suffix = randomBytes(3).toString("hex");

  return `${base || "escritorio"}-${suffix}`;
}

type AuthUserLike = {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

export type ProvisionResult =
  | "exists"
  | "created"
  | "not-eligible";

/*
 * Cria escritório, usuário e vínculo de PROPRIETÁRIO para quem se
 * cadastrou em /cadastro — somente depois do e-mail confirmado.
 *
 * Chamado no retorno do link de confirmação e no login (se o link foi
 * aberto em outro aparelho, a conta é criada no primeiro acesso).
 * Pode ser chamado mais de uma vez: só cria uma vez.
 */
export async function provisionSignupAccount(
  authUser: AuthUserLike,
): Promise<ProvisionResult> {
  const existing = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true },
  });

  if (existing) {
    return "exists";
  }

  // Contas criadas direto pela API do Supabase com o cadastro fechado
  // não ganham escritório.
  if (!isSignupEnabled()) {
    return "not-eligible";
  }

  if (!authUser.email || !authUser.email_confirmed_at) {
    return "not-eligible";
  }

  const metadata = signupMetadataSchema.safeParse(
    authUser.user_metadata ?? {},
  );

  if (!metadata.success) {
    return "not-eligible";
  }

  const officeName = metadata.data.signup_office_name;
  const name = metadata.data.name;
  const email = authUser.email.toLowerCase();
  const termsVersion = metadata.data.terms_version;
  const termsAcceptedAt = new Date(metadata.data.terms_accepted_at);

  try {
    await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: officeName,
          slug: buildWorkspaceSlug(officeName),
        },
        select: { id: true },
      });

      await tx.user.create({
        data: {
          // Mesmo UUID do Supabase Auth.
          id: authUser.id,
          name,
          email,
          termsVersion,
          termsAcceptedAt,
        },
      });

      await tx.membership.create({
        data: {
          userId: authUser.id,
          workspaceId: workspace.id,
          role: UserRole.OWNER,
        },
      });
    });

    return "created";
  } catch (error) {
    // Dois acessos simultâneos (link + login): o outro já criou a conta.
    const createdMeanwhile = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true },
    });

    if (createdMeanwhile) {
      return "exists";
    }

    throw error;
  }
}
