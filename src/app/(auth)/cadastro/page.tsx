import type {
  Metadata,
} from "next";

import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import {
  Building2,
} from "lucide-react";

import {
  AuthCard,
} from "@/features/auth/components/auth-card";

import {
  authButtonClass,
} from "@/features/auth/components/auth-styles";

import {
  SignUpForm,
} from "@/features/auth/components/signup-form";

import {
  isSignupEnabled,
} from "@/features/auth/lib/signup";

import {
  getCurrentUser,
} from "@/lib/auth";

export const metadata: Metadata = {
  title: "Cadastro do escritório",
};

export default async function CadastroPage() {
  if (await getCurrentUser()) {
    redirect("/dashboard");
  }

  if (!isSignupEnabled()) {
    return (
      <AuthCard
        icon={<Building2 className="size-6" />}
        title="Cadastro indisponível"
        description="O cadastro de novos escritórios não está aberto no momento. Se você faz parte de um escritório que já usa o LexFlow, peça um convite a quem administra a equipe."
      >
        <Link
          href="/login"
          className={authButtonClass}
        >
          Ir para o login
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      icon={<Building2 className="size-6" />}
      title="Crie a conta do seu escritório"
      description="Cadastre o escritório e a sua conta de proprietário. Depois, convide a equipe em Configurações → Equipe."
    >
      <SignUpForm />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline"
        >
          Entrar
        </Link>
      </p>
    </AuthCard>
  );
}
