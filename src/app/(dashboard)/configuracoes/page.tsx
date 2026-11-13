import Link from "next/link";

import type {
  ReactNode,
} from "react";

import {
  ArrowRight,
  Blocks,
  Building2,
  CreditCard,
  Settings2,
  SlidersHorizontal,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  AppShell,
} from "@/components/app-shell/app-shell";

import {
  SettingsNav,
} from "@/components/settings/settings-nav";

import {
  getCurrentWorkspaceAccess,
  hasPermission,
} from "@/lib/permissions";

type SettingsCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  href?: string;
  available?: boolean;
};

function SettingsCard({
  title,
  description,
  icon,
  href,
  available = false,
}: SettingsCardProps) {
  const content = (
    <div
      className={[
        "group h-full rounded-2xl border bg-card p-5 transition sm:p-6",
        available
          ? "hover:border-primary/30 hover:shadow-sm"
          : "opacity-70",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
          {icon}
        </div>

        {available ? (
          <ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
        ) : (
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            Em breve
          </span>
        )}
      </div>

      <h2 className="mt-5 text-lg font-semibold">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );

  if (
    available &&
    href
  ) {
    return (
      <Link
        href={href}
        className="block h-full"
      >
        {content}
      </Link>
    );
  }

  return content;
}

export default async function ConfiguracoesPage() {
  const {
    membership,
  } =
    await getCurrentWorkspaceAccess();

  const canManageOffice =
    hasPermission(
      membership.role,
      "OFFICE_MANAGE",
    );

  const canManageTeam =
    hasPermission(
      membership.role,
      "TEAM_MANAGE",
    );

  const canManageBilling =
    hasPermission(
      membership.role,
      "BILLING_MANAGE",
    );

  return (
    <AppShell>
      <div className="space-y-7">
        <header className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              <Settings2 className="size-5" />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Configurações
              </h1>

              <p className="mt-1 max-w-2xl text-muted-foreground">
                Gerencie sua conta, integrações e parâmetros do LexFlow.
              </p>
            </div>
          </div>

          <SettingsNav />
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SettingsCard
            title="Perfil e conta"
            description="Consulte seus dados pessoais, e-mail de acesso e função no escritório."
            icon={
              <UserRound className="size-5" />
            }
            href="/configuracoes/perfil"
            available
          />

          <SettingsCard
            title="Integrações"
            description="Conecte serviços externos ao LexFlow, como o Google Agenda."
            icon={
              <Blocks className="size-5" />
            }
            href="/configuracoes/integracoes"
            available
          />

          {canManageOffice ? (
            <SettingsCard
              title="Escritório"
              description="Dados institucionais, contato profissional e endereço do escritório."
              icon={
                <Building2 className="size-5" />
              }
              href="/configuracoes/escritorio"
              available
            />
          ) : null}

          <SettingsCard
            title="Preferências"
            description="Personalize a exibição da Agenda e o comportamento da sua rotina no LexFlow."
            icon={
              <SlidersHorizontal className="size-5" />
            }
            href="/configuracoes/preferencias"
            available
          />

          {canManageTeam ? (
            <SettingsCard
              title="Equipe e permissões"
              description="Gerencie usuários vinculados ao escritório e suas funções."
              icon={
                <UsersRound className="size-5" />
              }
              href="/configuracoes/equipe"
              available
            />
          ) : null}

          {canManageBilling ? (
            <SettingsCard
              title="Assinatura e faturamento"
              description="Plano do LexFlow, dados de cobrança e informações da assinatura."
              icon={
                <CreditCard className="size-5" />
              }
              href="/configuracoes/assinatura"
              available
            />
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}