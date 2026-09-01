import Link from "next/link";

import {
  CalendarDays,
  CircleDollarSign,
  FolderKanban,
  LayoutDashboard,
  UsersRound,
} from "lucide-react";

import {
  AppShell,
} from "@/components/app-shell/app-shell";

import type {
  ReactNode,
} from "react";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        {/* ==========================
            CABEÇALHO
        ========================== */}

        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <LayoutDashboard className="size-5" />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Painel
              </h1>

              <p className="mt-1 text-muted-foreground">
                Visão geral do escritório e
                acesso rápido às principais
                áreas do LexFlow.
              </p>
            </div>
          </div>
        </div>

        {/* ==========================
            ACESSOS RÁPIDOS
        ========================== */}

        <section>
          <h2 className="text-lg font-semibold">
            Acessos rápidos
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Vá diretamente para as áreas
            que você mais utiliza.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardLink
              href="/clientes"
              title="Clientes"
              description="Cadastros, documentos e histórico."
              icon={
                <UsersRound className="size-5" />
              }
              tone="blue"
            />

            <DashboardLink
              href="/casos"
              title="Processos"
              description="Processos judiciais e administrativos."
              icon={
                <FolderKanban className="size-5" />
              }
              tone="violet"
            />

            <DashboardLink
              href="/agenda"
              title="Agenda"
              description="Prazos, perícias, audiências e tarefas."
              icon={
                <CalendarDays className="size-5" />
              }
              tone="amber"
            />

            <DashboardLink
              href="/financeiro"
              title="Financeiro"
              description="Receitas, despesas, RPVs e fluxo de caixa."
              icon={
                <CircleDollarSign className="size-5" />
              }
              tone="emerald"
            />
          </div>
        </section>

        {/* ==========================
            PRÓXIMA EVOLUÇÃO
        ========================== */}

        <section className="rounded-2xl border bg-card p-6">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
              <LayoutDashboard className="size-5 text-muted-foreground" />
            </div>

            <div>
              <h2 className="font-semibold">
                Resumo do escritório
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Este espaço será usado para
                reunir as informações mais
                importantes do dia: tarefas,
                prazos, audiências, perícias,
                recebimentos, despesas e
                alertas.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function DashboardLink({
  href,
  title,
  description,
  icon,
  tone,
}: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  tone:
    | "blue"
    | "violet"
    | "amber"
    | "emerald";
}) {
  const styles = {
    blue: {
      card:
        "border-blue-200 hover:border-blue-300 dark:border-blue-900 dark:hover:border-blue-800",

      icon:
        "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
    },

    violet: {
      card:
        "border-violet-200 hover:border-violet-300 dark:border-violet-900 dark:hover:border-violet-800",

      icon:
        "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300",
    },

    amber: {
      card:
        "border-amber-200 hover:border-amber-300 dark:border-amber-900 dark:hover:border-amber-800",

      icon:
        "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    },

    emerald: {
      card:
        "border-emerald-200 hover:border-emerald-300 dark:border-emerald-900 dark:hover:border-emerald-800",

      icon:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    },
  }[tone];

  return (
    <Link
      href={href}
      className={`group rounded-2xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-sm ${styles.card}`}
    >
      <div
        className={`flex size-10 items-center justify-center rounded-xl ${styles.icon}`}
      >
        {icon}
      </div>

      <h3 className="mt-4 font-semibold group-hover:underline">
        {title}
      </h3>

      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </Link>
  );
}