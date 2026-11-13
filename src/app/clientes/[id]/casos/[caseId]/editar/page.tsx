import Link from "next/link";

import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  UserRound,
} from "lucide-react";

import {
  notFound,
} from "next/navigation";

import {
  AppShell,
} from "@/components/app-shell/app-shell";

import {
  CaseEditForm,
} from "@/features/cases/components/case-edit-form";

import {
  caseDetailsInclude,
} from "@/features/cases/types";

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

      caseId:
        string;
    }>;
};

export default async function EditCasePage({
  params,
}: PageProps) {
  const {
    id:
      clientId,

    caseId,
  } =
    await params;

  const {
    workspace,
  } =
    await requireWorkspacePagePermission(
      "CASE_EDIT",
    );

  const caseData =
    await prisma.case.findFirst({
      where: {
        id:
          caseId,

        clientId,

        workspaceId:
          workspace.id,
      },

      ...caseDetailsInclude,
    });

  if (!caseData) {
    notFound();
  }

  const casePath =
    `/clientes/${clientId}/casos/${caseId}`;

  const mainReference =
    caseData.number
      ? `Processo ${caseData.number}`
      : caseData.administrativeNumber
        ? `NB ${caseData.administrativeNumber}`
        : null;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl space-y-5">
        {/* ==========================
            VOLTAR
        ========================== */}

        <Link
          href={
            casePath
          }
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />

          Voltar para o caso
        </Link>

        {/* ==========================
            CABEÇALHO
        ========================== */}

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex flex-col gap-5 px-5 py-5 sm:px-6 sm:py-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <BriefcaseBusiness className="size-7" />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Editar caso
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                  {
                    caseData.title
                  }
                </h1>

                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <Link
                    href={`/clientes/${clientId}`}
                    className="inline-flex items-center gap-1.5 font-medium text-foreground transition hover:text-primary"
                  >
                    <UserRound className="size-3.5" />

                    {
                      caseData.client.name
                    }
                  </Link>

                  {mainReference ? (
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="size-3.5" />

                      {
                        mainReference
                      }
                    </span>
                  ) : (
                    <span>
                      Sem número informado
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-600" />

              Caso cadastrado
            </div>
          </div>

          <div className="border-t bg-muted/20 px-5 py-3 sm:px-6">
            <p className="text-sm text-muted-foreground">
              Atualize somente as informações necessárias. Prazos e compromissos permanecem na Agenda.
            </p>
          </div>
        </section>

        {/* ==========================
            FORMULÁRIO
        ========================== */}

        <CaseEditForm
          clientId={
            clientId
          }
          case={{
            id:
              caseData.id,

            title:
              caseData.title,

            practiceArea:
              caseData.practiceArea,

            subject:
              caseData.subject,

            benefitType:
              caseData.benefitType,

            origin:
              caseData.origin,

            administrativeStatus:
              caseData.administrativeStatus,

            number:
              caseData.number,

            administrativeNumber:
              caseData.administrativeNumber,

            administrativeProcess:
              caseData.administrativeProcess,

            court:
              caseData.court,

            courtUnit:
              caseData.courtUnit,

            judge:
              caseData.judge,

            city:
              caseData.city,

            state:
              caseData.state,

            opposingParty:
              caseData.opposingParty,

            claimValue:
              caseData.claimValue !==
              null
                ? Number(
                    caseData.claimValue,
                  )
                : null,

            status:
              caseData.status,

            administrativeRequestDate:
              caseData.administrativeRequestDate,

            distributionDate:
              caseData.distributionDate,

            notes:
              caseData.notes,
          }}
        />
      </div>
    </AppShell>
  );
}