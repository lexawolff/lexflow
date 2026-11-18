import "server-only";

import {
  randomBytes,
} from "node:crypto";

import {
  UserRole,
} from "@prisma/client";

import {
  getTaxIdOwnerKey,
  isValidTaxId,
  normalizeTaxId,
  onlyDigits,
} from "@/lib/br-documents";

import {
  decryptSecret,
  keyedHash,
} from "@/lib/crypto";

import {
  prisma,
} from "@/lib/prisma";

import {
  getTrialEndsAt,
} from "@/lib/trial";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  isLegalInfoComplete,
  LEGAL_CONTACT_EMAIL,
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
 * Só no computador de desenvolvimento: mostra o link de confirmação na tela,
 * sem enviar e-mail. SIGNUP_DEV_CONFIRM_LINK="false" volta ao envio normal.
 */
export function isDevConfirmationLinkEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.SIGNUP_DEV_CONFIRM_LINK !== "false"
  );
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
  | "not-eligible"
  | "rejected";

// Não diz qual dado impediu o cadastro, para não confirmar a terceiros que um
// CPF, CNPJ ou e-mail já é usado no LexFlow.
export const SIGNUP_REJECTED_MESSAGE =
  `Não foi possível liberar um novo cadastro com estes dados. Se você já usa o LexFlow, entre com a sua conta. Se precisar de ajuda, escreva para ${LEGAL_CONTACT_EMAIL}.`;

const SIGNUP_METADATA_KEYS = [
  "signup_office_name",
  "signup_tax_id",
  "signup_whatsapp",
  "signup_city",
  "signup_state",
  "signup_oab_number",
  "signup_oab_state",
  "terms_version",
  "terms_accepted_at",
] as const;

/*
 * Os dados do cadastro ficam no Supabase Auth só até a confirmação do
 * e-mail. Depois de gravados no banco, são apagados de lá: esses campos
 * também entrariam no token de sessão. Uma falha aqui não impede o acesso;
 * o retorno do link tenta de novo.
 */
async function clearSignupMetadata(
  authUser: AuthUserLike,
) {
  const metadata = authUser.user_metadata ?? {};

  if (!SIGNUP_METADATA_KEYS.some((key) => key in metadata)) {
    return;
  }

  try {
    const { error } =
      await createAdminClient().auth.admin.updateUserById(
        authUser.id,
        {
          user_metadata: Object.fromEntries(
            SIGNUP_METADATA_KEYS.map((key) => [key, null]),
          ),
        },
      );

    if (error) {
      console.error(
        "Falha ao limpar dados temporários do cadastro:",
        error.code ?? error.status ?? "sem código",
      );
    }
  } catch {
    console.error("Falha ao limpar dados temporários do cadastro.");
  }
}

function readSignupTaxId(
  encrypted: string,
): string | null {
  try {
    const taxId = normalizeTaxId(decryptSecret(encrypted));

    return isValidTaxId(taxId) ? taxId : null;
  } catch {
    return null;
  }
}

/*
 * Cadastro recusado: apaga a identidade criada, com os dados temporários. A
 * pessoa pode se cadastrar de novo com o mesmo e-mail e o documento correto.
 */
async function discardRejectedSignup(
  authUser: AuthUserLike,
) {
  try {
    const { error } =
      await createAdminClient().auth.admin.deleteUser(authUser.id);

    if (!error) {
      return;
    }

    console.error(
      "Falha ao apagar cadastro recusado:",
      error.code ?? error.status ?? "sem código",
    );
  } catch {
    console.error("Falha ao apagar cadastro recusado.");
  }

  await clearSignupMetadata(authUser);
}

/*
 * Cria escritório, usuário e vínculo de PROPRIETÁRIO para quem se
 * cadastrou em /cadastro — somente depois do e-mail confirmado.
 *
 * Chamado no retorno do link de confirmação e no login (se o link foi
 * aberto em outro aparelho, a conta é criada no primeiro acesso).
 * Pode ser chamado mais de uma vez: só cria uma vez.
 *
 * Cada CPF, ou CNPJ com suas filiais, abre um único escritório. O registro
 * do documento é separado dos dados editáveis em Configurações.
 */
export async function provisionSignupAccount(
  authUser: AuthUserLike,
): Promise<ProvisionResult> {
  const existing = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { id: true },
  });

  if (existing) {
    await clearSignupMetadata(authUser);

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

  const taxId = readSignupTaxId(metadata.data.signup_tax_id);

  if (!taxId) {
    return "not-eligible";
  }

  const taxIdHash = keyedHash("signup-tax-id", getTaxIdOwnerKey(taxId));

  const isTaxIdClaimed = async () =>
    Boolean(
      await prisma.signupTaxIdClaim.findUnique({
        where: { taxIdHash },
        select: { taxIdHash: true },
      }),
    );

  if (await isTaxIdClaimed()) {
    await discardRejectedSignup(authUser);

    return "rejected";
  }

  const city = metadata.data.signup_city ?? null;
  const state = metadata.data.signup_state?.toUpperCase() ?? null;
  const oabNumber = metadata.data.signup_oab_number ?? null;
  const oabState = metadata.data.signup_oab_state?.toUpperCase() ?? null;
  const whatsapp = metadata.data.signup_whatsapp
    ? onlyDigits(metadata.data.signup_whatsapp)
    : null;
  const isCompanyTaxId = taxId.length === 14;

  try {
    await prisma.$transaction(async (tx) => {
      // Registro antigo com este e-mail e sem nenhum escritório: não dá acesso
      // a nada e impediria criar o usuário de quem acabou de confirmar o e-mail.
      await tx.user.deleteMany({
        where: {
          email,
          id: { not: authUser.id },
          memberships: { none: {} },
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          name: officeName,
          slug: buildWorkspaceSlug(officeName),
          cnpj: isCompanyTaxId ? taxId : null,
          // A OAB só é gravada completa (número e UF).
          oabRegistration: oabNumber && oabState ? oabNumber : null,
          oabState: oabNumber && oabState ? oabState : null,
          whatsapp,
          city,
          state,
        },
        select: { id: true },
      });

      // A chave única impede dois cadastros simultâneos do mesmo documento.
      await tx.signupTaxIdClaim.create({
        data: {
          taxIdHash,
          workspaceId: workspace.id,
        },
      });

      // O teste grátis começa quando o e-mail é confirmado.
      await tx.subscription.create({
        data: {
          workspaceId: workspace.id,
          planName: "Teste grátis",
          trialEndsAt: getTrialEndsAt(new Date()),
        },
      });

      // CPF ou CNPJ também abastecem os dados de cobrança.
      await tx.billingProfile.create({
        data: {
          workspaceId: workspace.id,
          name: isCompanyTaxId ? officeName : name,
          taxId,
          city,
          state,
        },
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
  } catch (error) {
    // Dois acessos simultâneos (link + login): o outro já criou a conta.
    const createdMeanwhile = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true },
    });

    if (createdMeanwhile) {
      return "exists";
    }

    // Outro cadastro usou o mesmo documento no mesmo instante, ou o e-mail
    // pertence a um usuário que participa de um escritório.
    const emailInUse = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (emailInUse || (await isTaxIdClaimed())) {
      await discardRejectedSignup(authUser);

      return "rejected";
    }

    throw error;
  }

  await clearSignupMetadata(authUser);

  return "created";
}

/*
 * Depois de criar a conta, troca o token da sessão por um novo, já sem os
 * dados temporários do cadastro.
 */
export async function refreshSessionAfterSignup(
  supabase: {
    auth: {
      refreshSession: () => Promise<unknown>;
    };
  },
) {
  try {
    await supabase.auth.refreshSession();
  } catch {
    console.error("Falha ao renovar a sessão após o cadastro.");
  }
}
