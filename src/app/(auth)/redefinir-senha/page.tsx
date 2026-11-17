import type {
  Metadata,
} from "next";

import {
  redirect,
} from "next/navigation";

import {
  KeyRound,
} from "lucide-react";

import {
  AuthCard,
} from "@/features/auth/components/auth-card";

import {
  UpdatePasswordForm,
} from "@/features/auth/components/update-password-form";

import {
  getCurrentAuthUser,
} from "@/lib/auth";

export const metadata: Metadata = {
  title: "Nova senha",
};

/*
 * Chega-se aqui pelo link do e-mail de redefinição, que abre uma
 * sessão em /auth/callback. Sem sessão, o link expirou ou foi aberto
 * em outro navegador.
 */
export default async function RedefinirSenhaPage() {
  const user = await getCurrentAuthUser();

  if (!user) {
    redirect("/login?erro=link-invalido");
  }

  return (
    <AuthCard
      icon={<KeyRound className="size-6" />}
      title="Crie uma nova senha"
      description={
        <>
          Conta: <strong className="text-foreground">{user.email}</strong>
        </>
      }
    >
      <UpdatePasswordForm />
    </AuthCard>
  );
}
