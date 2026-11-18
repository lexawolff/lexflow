import "server-only";

import {
  prisma,
} from "@/lib/prisma";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

export const UNCONFIRMED_SIGNUP_TTL_DAYS = 7;

const USERS_PER_PAGE = 1000;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

/*
 * Apaga do Supabase Auth os cadastros públicos que nunca confirmaram o
 * e-mail, junto com os dados temporários guardados neles. Só alcança contas
 * criadas por /cadastro que ainda não têm usuário no LexFlow.
 */
export async function deleteExpiredUnconfirmedSignups(
  now: Date = new Date(),
) {
  const admin = createAdminClient().auth.admin;
  const cutoff = now.getTime() - UNCONFIRMED_SIGNUP_TTL_DAYS * DAY_IN_MS;
  const expiredIds: string[] = [];

  // Lista tudo antes de apagar: apagar durante a leitura desloca as páginas.
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.listUsers({
      page,
      perPage: USERS_PER_PAGE,
    });

    if (error) {
      throw error;
    }

    for (const user of data.users) {
      if (
        !user.email_confirmed_at &&
        user.user_metadata?.signup_office_name &&
        Date.parse(user.created_at) <= cutoff
      ) {
        expiredIds.push(user.id);
      }
    }

    if (data.users.length < USERS_PER_PAGE) {
      break;
    }
  }

  const activeUsers = await prisma.user.findMany({
    where: { id: { in: expiredIds } },
    select: { id: true },
  });
  const activeIds = new Set(activeUsers.map((user) => user.id));

  let deleted = 0;
  let failed = 0;

  for (const id of expiredIds) {
    if (activeIds.has(id)) {
      continue;
    }

    const { error } = await admin.deleteUser(id);

    if (error) {
      failed += 1;
    } else {
      deleted += 1;
    }
  }

  return { deleted, failed };
}
