import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Scale,
  UserPlus,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

import {
  LoginForm,
} from "@/features/auth/components/login-form";

type LoginPageProps = {
  searchParams: Promise<{
    erro?: string;
  }>;
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
  const { erro } =
    await searchParams;

  const user =
    await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  /*
   * O link de criação da primeira conta
   * só aparece enquanto ainda não existir
   * nenhum usuário no LexFlow.
   */
  const userCount =
    await prisma.user.count();

  const canSetup =
    userCount === 0;

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-2">
      {/* ==========================
          LADO ESQUERDO
      ========================== */}

      <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-white/10">
            <Scale className="size-6" />
          </div>

          <div>
            <p className="text-xl font-semibold">
              LexFlow
            </p>

            <p className="text-sm text-slate-400">
              Gestão Jurídica
            </p>
          </div>
        </div>

        <div className="max-w-xl">
          <p className="text-4xl font-semibold leading-tight">
            Seu escritório organizado
            em um único lugar.
          </p>

          <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-400">
            Clientes, casos,
            agenda e financeiro
            integrados à sua rotina.
          </p>
        </div>

        <p className="text-xs text-slate-500">
          LexFlow
        </p>
      </section>

      {/* ==========================
          LOGIN
      ========================== */}

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Logo mobile */}

          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Scale className="size-5" />
              </div>

              <div>
                <p className="text-xl font-semibold">
                  LexFlow
                </p>

                <p className="text-xs text-muted-foreground">
                  Gestão Jurídica
                </p>
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Bem-vindo
          </h1>

          <p className="mt-2 text-muted-foreground">
            Entre com sua conta para
            acessar o escritório.
          </p>

          {erro === "link-invalido" ? (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300"
            >
              O link expirou ou foi aberto em outro navegador. Solicite um novo
              em &quot;Esqueci minha senha&quot;.
            </div>
          ) : null}

          <div className="mt-8">
            <LoginForm />
          </div>

          <p className="mt-4 text-center text-sm">
            <Link
              href="/recuperar-senha"
              className="font-medium text-primary hover:underline"
            >
              Esqueci minha senha
            </Link>
          </p>

          {/* ==========================
              PRIMEIRO ACESSO
          ========================== */}

          {canSetup ? (
            <div className="mt-6 border-t pt-6">
              <div className="rounded-2xl border bg-muted/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <UserPlus className="size-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      Primeiro acesso?
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Crie a primeira conta
                      proprietária do LexFlow
                      para configurar o
                      escritório.
                    </p>

                    <Link
                      href="/setup"
                      className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
                    >
                      Criar primeiro usuário
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}