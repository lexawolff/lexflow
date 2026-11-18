import Link from "next/link";

import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

import {
  notFound,
} from "next/navigation";

import {
  AppShell,
} from "@/components/app-shell/app-shell";

import {
  ClientEditForm,
} from "@/features/clients/components/client-edit-form";

import {
  canUsePermission,
  requireWorkspacePagePermission,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

type PageProps = {
  params:
    Promise<{
      id:
        string;
    }>;
};

function formatCpf(
  value:
    string | null,
) {
  if (!value) {
    return null;
  }

  const digits =
    value.replace(
      /\D/g,
      "",
    );

  if (
    digits.length !==
    11
  ) {
    return value;
  }

  return digits.replace(
    /(\d{3})(\d{3})(\d{3})(\d{2})/,
    "$1.$2.$3-$4",
  );
}

export default async function EditarClientePage({
  params,
}: PageProps) {
  const {
    workspace,
    membership,
  } =
    await requireWorkspacePagePermission(
      "CLIENT_EDIT",
    );

  const {
    id,
  } =
    await params;

  const canWriteFinance =
    canUsePermission(
      membership,
      "FINANCE_WRITE",
    );

  const canManageGov =
    canUsePermission(
      membership,
      "GOV_MANAGE",
    );

  /*
   * Dados cadastrais gerais.
   *
   * Informações protegidas por
   * permissões específicas continuam
   * sendo consultadas separadamente.
   */
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

        cpf:
          true,

        rg:
          true,

        birthDate:
          true,

        motherName:
          true,

        fatherName:
          true,

        gender:
          true,

        maritalStatus:
          true,

        nationality:
          true,

        education:
          true,

        profession:
          true,

        phone:
          true,

        whatsapp:
          true,

        email:
          true,

        cep:
          true,

        address:
          true,

        addressNumber:
          true,

        complement:
          true,

        neighborhood:
          true,

        city:
          true,

        state:
          true,

        pis:
          true,

        notes:
          true,
      },
    });

  if (!client) {
    notFound();
  }

  let income:
    number | null =
    null;

  if (canWriteFinance) {
    const financialData =
      await prisma.client.findFirst({
        where: {
          id:
            client.id,

          workspaceId:
            workspace.id,
        },

        select: {
          income:
            true,
        },
      });

    income =
      financialData
        ?.income ??
      null;
  }

  let govLogin:
    string | null =
    null;

  if (canManageGov) {
    const govData =
      await prisma.client.findFirst({
        where: {
          id:
            client.id,

          workspaceId:
            workspace.id,
        },

        select: {
          govLogin:
            true,
        },
      });

    govLogin =
      govData
        ?.govLogin ??
      null;
  }

  const formattedCpf =
    formatCpf(
      client.cpf,
    );

  const mainPhone =
    client.whatsapp ||
    client.phone;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl space-y-5">
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
          <div className="flex flex-col gap-5 px-5 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UserRound className="size-7" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Editar cliente
                </p>

                <h1 className="mt-1 truncate text-2xl font-bold tracking-tight sm:text-3xl">
                  {client.name}
                </h1>

                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  {formattedCpf ? (
                    <span>
                      CPF{" "}
                      <strong className="font-medium text-foreground">
                        {formattedCpf}
                      </strong>
                    </span>
                  ) : (
                    <span>
                      CPF não informado
                    </span>
                  )}

                  {mainPhone ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="size-3.5" />

                      {mainPhone}
                    </span>
                  ) : null}

                  {client.email ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="size-3.5" />

                      {client.email}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-600" />

              Cliente cadastrado
            </div>
          </div>

          <div className="border-t bg-muted/20 px-5 py-3 sm:px-6">
            <p className="text-sm text-muted-foreground">
              Atualize somente as informações necessárias. Os demais dados permanecerão preservados.
            </p>
          </div>
        </section>

        {/* ==========================
            FORMULÁRIO
        ========================== */}

        <ClientEditForm
          client={{
            ...client,

            income,

            govLogin,
          }}
          canWriteFinance={
            canWriteFinance
          }
          canManageGov={
            canManageGov
          }
        />
      </div>
    </AppShell>
  );
}
