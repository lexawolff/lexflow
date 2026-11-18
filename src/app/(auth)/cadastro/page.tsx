import type {
  Metadata,
} from "next";

import Link from "next/link";

import {
  redirect,
} from "next/navigation";

import {
  Building2,
  CalendarDays,
  CircleDollarSign,
  FileText,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import {
  AuthCard,
} from "@/features/auth/components/auth-card";

import {
  AuthSplitLayout,
} from "@/features/auth/components/auth-split-layout";

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

const HIGHLIGHTS = [
  {
    icon: UsersRound,
    title: "Clientes e processos",
    text: "Cadastros, andamentos e histórico no mesmo lugar.",
  },
  {
    icon: CalendarDays,
    title: "Agenda e trabalho",
    text: "Prazos, perícias e prioridades da equipe.",
  },
  {
    icon: FileText,
    title: "Documentos",
    text: "Arquivos de cada cliente sempre à mão.",
  },
  {
    icon: CircleDollarSign,
    title: "Financeiro",
    text: "Honorários, RPVs, precatórios e contas.",
  },
];

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
    <AuthSplitLayout
      headline="Do primeiro atendimento ao recebimento."
      description="O dia a dia do seu escritório organizado em um único sistema."
      contentClassName="max-w-lg"
      panelContent={
        <ul className="mt-10 grid gap-6 xl:grid-cols-2">
          {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="flex gap-3"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Icon
                  className="size-4"
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-sm font-semibold">
                  {title}
                </p>

                <p className="mt-0.5 text-sm leading-relaxed text-slate-400">
                  {text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      }
      panelFooter={
        <p className="flex items-center gap-2 text-slate-400">
          <ShieldCheck
            className="size-4 shrink-0"
            aria-hidden="true"
          />
          Dados armazenados no Brasil e separados por escritório.
        </p>
      }
    >
      <SignUpForm />

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
    </AuthSplitLayout>
  );
}
