import "server-only";

import {
  DOCUMENTS_BUCKET,
} from "@/features/documents/services/upload-file";

import {
  AsaasError,
  deleteAsaasSubscription,
} from "@/lib/asaas";

import {
  prisma,
} from "@/lib/prisma";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  getStorage,
} from "@/lib/supabase/storage";

import {
  getTrialDataCutoff,
  getTrialFinalNoticeCutoff,
} from "@/lib/trial";

import {
  syncAsaasSubscription,
} from "./sync-asaas-subscription";

// Limita o alcance de cada execução; o restante fica para o dia seguinte.
const WORKSPACES_PER_RUN = 25;
const STORAGE_PAGE_SIZE = 1000;
const STORAGE_REMOVE_SIZE = 100;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

type DocumentBucket = ReturnType<ReturnType<typeof getStorage>["from"]>;

/*
 * Só teste nunca pago (status TRIALING). O último aviso por e-mail precisa
 * ter saído há pelo menos 7 dias.
 */
function expiredTrialWhere(
  cutoff: Date,
  noticeCutoff: Date,
) {
  return {
    status: "TRIALING" as const,
    trialEndsAt: { lte: cutoff },
    trialDeletionFinalNoticeAt: { lte: noticeCutoff },
  };
}

async function listStoredFiles(
  bucket: DocumentBucket,
  prefix: string,
): Promise<string[]> {
  const files: string[] = [];

  for (let offset = 0; ; offset += STORAGE_PAGE_SIZE) {
    const { data, error } = await bucket.list(prefix, {
      limit: STORAGE_PAGE_SIZE,
      offset,
    });

    if (error) {
      throw error;
    }

    for (const item of data) {
      const path = `${prefix}/${item.name}`;

      // Pastas vêm sem id.
      if (item.id) {
        files.push(path);
      } else {
        files.push(...(await listStoredFiles(bucket, path)));
      }
    }

    if (data.length < STORAGE_PAGE_SIZE) {
      return files;
    }
  }
}

async function removeWorkspaceFiles(
  workspaceId: string,
) {
  // Um prefixo vazio alcançaria os arquivos de todos os escritórios.
  if (!UUID_PATTERN.test(workspaceId)) {
    throw new Error("Identificador de escritório inválido.");
  }

  const bucket = getStorage().from(DOCUMENTS_BUCKET);

  const documents = await prisma.document.findMany({
    where: { workspaceId },
    select: { storagePath: true },
  });

  const paths = [
    ...new Set([
      ...documents.map((document) => document.storagePath),
      ...(await listStoredFiles(bucket, workspaceId)),
    ]),
  ];

  for (let index = 0; index < paths.length; index += STORAGE_REMOVE_SIZE) {
    const { error } = await bucket.remove(
      paths.slice(index, index + STORAGE_REMOVE_SIZE),
    );

    if (error) {
      throw error;
    }
  }
}

async function deleteAuthAccount(
  userId: string,
) {
  const { error } =
    await createAdminClient().auth.admin.deleteUser(userId);

  // Conta já apagada em uma tentativa anterior.
  if (
    error &&
    error.status !== 404 &&
    error.code !== "user_not_found"
  ) {
    throw error;
  }
}

/*
 * A ordem permite repetir a rotina depois de uma falha: o registro do
 * escritório é o último a sair e marca o que ainda falta concluir.
 */
async function deleteWorkspaceData(
  workspaceId: string,
  cutoff: Date,
  noticeCutoff: Date,
) {
  const where = expiredTrialWhere(cutoff, noticeCutoff);

  const stillExpired = await prisma.subscription.findFirst({
    where: { ...where, workspaceId },
    select: { id: true, providerSubscriptionId: true },
  });

  if (!stillExpired) {
    return false;
  }

  // Ligado ao Asaas: confere se houve pagamento antes de apagar qualquer coisa.
  if (stillExpired.providerSubscriptionId) {
    const status = await syncAsaasSubscription(stillExpired.id);

    if (status !== "TRIALING") {
      return false;
    }

    try {
      await deleteAsaasSubscription(stillExpired.providerSubscriptionId);
    } catch (error) {
      if (!(error instanceof AsaasError && error.status === 404)) {
        throw error;
      }
    }
  }

  await removeWorkspaceFiles(workspaceId);

  const members = await prisma.membership.findMany({
    where: { workspaceId },
    select: { userId: true },
  });

  // Quem participa de outro escritório mantém a conta.
  const exclusiveMembers = {
    id: { in: members.map((member) => member.userId) },
    memberships: {
      none: { workspaceId: { not: workspaceId } },
    },
  };

  const exclusiveUsers = await prisma.user.findMany({
    where: exclusiveMembers,
    select: { id: true },
  });

  for (const user of exclusiveUsers) {
    await deleteAuthAccount(user.id);
  }

  await prisma.$transaction(async (tx) => {
    // A auditoria não tem chave estrangeira e não sai em cascata.
    await tx.auditLog.deleteMany({ where: { workspaceId } });
    await tx.user.deleteMany({ where: exclusiveMembers });

    // O registro da trava de CPF/CNPJ permanece, sem vínculo com o escritório.
    await tx.workspace.deleteMany({
      where: {
        id: workspaceId,
        subscription: { is: where },
      },
    });
  });

  return true;
}

export async function deleteExpiredTrialWorkspaces(
  now: Date = new Date(),
) {
  const cutoff = getTrialDataCutoff(now);
  const noticeCutoff = getTrialFinalNoticeCutoff(now);

  const expired = await prisma.subscription.findMany({
    where: expiredTrialWhere(cutoff, noticeCutoff),
    orderBy: { trialEndsAt: "asc" },
    take: WORKSPACES_PER_RUN,
    select: { workspaceId: true },
  });

  let deleted = 0;
  let failed = 0;

  // Uma falha não impede os demais; ela é repetida na próxima execução.
  for (const { workspaceId } of expired) {
    try {
      if (await deleteWorkspaceData(workspaceId, cutoff, noticeCutoff)) {
        deleted += 1;
      }
    } catch {
      failed += 1;
      console.error("Falha ao excluir teste vencido:", workspaceId);
    }
  }

  return { deleted, failed };
}
