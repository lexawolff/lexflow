import "server-only";

import {
  redirect,
} from "next/navigation";

import {
  prisma,
} from "@/lib/prisma";

import {
  createClient,
} from "@/lib/supabase/server";

export async function getCurrentAuthUser() {
  const supabase =
    await createClient();

  /*
   * getUser() consulta o servidor
   * de Auth e devolve o usuário
   * autenticado atual.
   */
  const {
    data,
    error,
  } =
    await supabase.auth.getUser();

  if (
    error ||
    !data.user
  ) {
    return null;
  }

  return data.user;
}

export async function getCurrentUser() {
  const authUser =
    await getCurrentAuthUser();

  if (!authUser) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      id:
        authUser.id,
    },
  });
}

export async function requireCurrentUser() {
  const user =
    await getCurrentUser();

  if (!user) {
    redirect(
      "/login",
    );
  }

  return user;
}