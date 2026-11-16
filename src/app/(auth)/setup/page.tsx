import {
  redirect,
} from "next/navigation";

import {
  ShieldCheck,
} from "lucide-react";

import {
  prisma,
} from "@/lib/prisma";

import {
  SetupOwnerForm,
} from "@/features/auth/components/setup-owner-form";

export default async function SetupPage() {
  if (process.env.NODE_ENV !== "development") {
    redirect("/login");
  }

  const userCount =
    await prisma.user.count();

  /*
   * Depois que a primeira conta
   * existe, cadastro público deixa
   * de existir.
   */
  if (userCount > 0) {
    redirect(
      "/login",
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-lg rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="size-6" />
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">
          Configurar LexFlow
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Crie a primeira conta
          proprietária do escritório.
          Depois desta configuração,
          novos usuários serão
          adicionados pelo próprio
          LexFlow.
        </p>

        <div className="mt-8">
          <SetupOwnerForm />
        </div>
      </div>
    </main>
  );
}