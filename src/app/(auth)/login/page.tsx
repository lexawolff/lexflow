import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Building2,
  Scale,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { isSignupEnabled } from "@/features/auth/lib/signup";

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
   * O convite para cadastrar um novo
   * escritório só aparece com o cadastro
   * público aberto.
   */
  const canSignUp =
    isSignupEnabled();

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

          {erro === "confirmacao" ? (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300"
            >
              Não foi possível abrir a sessão por este link (ele pode ter
              expirado ou ter sido aberto em outro navegador). Se você acabou
              de confirmar o cadastro, entre com seu e-mail e senha abaixo.
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
              NOVO ESCRITÓRIO
          ========================== */}

          {canSignUp ? (
            <div className="mt-6 border-t pt-6">
              <div className="rounded-2xl border bg-muted/20 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Building2 className="size-4" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      Ainda não usa o LexFlow?
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Crie a conta do seu
                      escritório e convide
                      a equipe depois.
                    </p>

                    <Link
                      href="/cadastro"
                      className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
                    >
                      Cadastrar meu escritório
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <p className="mt-8 text-center text-xs text-muted-foreground">
            <Link
              href="/termos"
              className="hover:text-foreground hover:underline"
            >
              Termos de Uso
            </Link>
            {" · "}
            <Link
              href="/privacidade"
              className="hover:text-foreground hover:underline"
            >
              Política de Privacidade
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}