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

export async function getCurrentAuthUserId() {
  const supabase =
    await createClient();

  const {
    data,
    error,
  } =
    await supabase.auth.getClaims();

  const userId =
    data?.claims?.sub;

  if (
    error ||
    typeof userId !== "string" ||
    !userId
  ) {
    return null;
  }

  return userId;
}

export async function getCurrentUser() {
  const userId =
    await getCurrentAuthUserId();

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      id:
        userId,
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