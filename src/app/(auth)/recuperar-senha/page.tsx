import type {
  Metadata,
} from "next";

import Link from "next/link";

import {
  KeyRound,
} from "lucide-react";

import {
  AuthCard,
} from "@/features/auth/components/auth-card";

import {
  RequestPasswordResetForm,
} from "@/features/auth/components/request-password-reset-form";

export const metadata: Metadata = {
  title: "Recuperar senha | LexFlow",
};

export default function RecuperarSenhaPage() {
  return (
    <AuthCard
      icon={<KeyRound className="size-6" />}
      title="Esqueceu sua senha?"
      description="Informe o e-mail da sua conta. Enviaremos um link para você criar uma nova senha."
    >
      <RequestPasswordResetForm />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Lembrou a senha?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline"
        >
          Voltar ao login
        </Link>
      </p>
    </AuthCard>
  );
}
