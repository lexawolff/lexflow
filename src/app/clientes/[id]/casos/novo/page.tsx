import Link from "next/link";

import {
  ArrowLeft,
  BriefcaseBusiness,
  UserRound,
} from "lucide-react";

import {
  notFound,
} from "next/navigation";

import {
  AppShell,
} from "@/components/app-shell/app-shell";

import {
  CaseForm,
} from "@/features/cases/components/case-form";

import {
  prisma,
} from "@/lib/prisma";

import {
  requireWorkspacePagePermission,
} from "@/lib/permissions";

type PageProps = {
  params:
    Promise<{
      id:
        string;
    }>;
};

export default async function NovoCasoPage({
  params,
}: PageProps) {
  const {
    id,
  } =
    await params;

  const {
  workspace,
} =
  await requireWorkspacePagePermission(
    "CASE_CREATE",
  );

  const client =
    await prisma.client.findFirst({
      where: {
        id,

        workspaceId:
          workspace.id,
      },

      select: {
        id:
          true,

        name:
          true,
      },
    });

  if (
    !client
  ) {
    notFound();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* ==========================
            VOLTAR
        ========================== */}

        <Link
          href={`/clientes/${client.id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />

          Voltar para o cliente
        </Link>

        {/* ==========================
            CABEÇALHO
        ========================== */}

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex items-start gap-4 px-5 py-5 sm:px-6">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BriefcaseBusiness className="size-6" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Cadastro de caso
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Novo caso
              </h1>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Cadastre as informações administrativas e judiciais
                relacionadas ao atendimento.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t bg-muted/10 px-5 py-3 text-sm sm:px-6">
            <UserRound className="size-4 shrink-0 text-muted-foreground" />

            <span className="text-muted-foreground">
              Cliente:
            </span>

            <span className="min-w-0 truncate font-medium">
              {
                client.name
              }
            </span>
          </div>
        </section>

        {/* ==========================
            FORMULÁRIO
        ========================== */}

        <CaseForm
          clientId={
            client.id
          }
        />
      </div>
    </AppShell>
  );
}