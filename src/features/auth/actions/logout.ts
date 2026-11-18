"use server";

import {
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

export async function logoutAction() {
  const supabase =
    await createClient();

  // "local": sai só deste navegador, sem derrubar outros aparelhos.
  await supabase.auth.signOut({
    scope: "local",
  });

  redirect(
    "/login",
  );
}