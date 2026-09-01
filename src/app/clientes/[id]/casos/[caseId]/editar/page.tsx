import Link from "next/link";

import {
  ArrowLeft,
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
  caseDetailsInclude,
} from "@/features/cases/types";

import {
  prisma,
} from "@/lib/prisma";

import {
  getDefaultWorkspace,
} from "@/lib/workspace";

type PageProps = {
  params: Promise<{
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
    id: clientId,
    caseId,
  } =
    await params;

  const workspace =
    await getDefaultWorkspace();

  const demand =
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

  if (!demand) {
    notFound();
  }

  const casePath =
    `/clientes/${clientId}/casos/${caseId}`;

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href={
            casePath
          }
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />

          Voltar para o processo
        </Link>

        <div>
          <h1 className="text-3xl font-bold">
            Editar processo
          </h1>

          <p className="mt-1 text-muted-foreground">
            {demand.title}
            {" • "}
            {
              demand.client.name
            }
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 sm:p-6">
          <CaseForm
            clientId={
              clientId
            }
            case={{
              id:
                demand.id,

              title:
                demand.title,

              practiceArea:
                demand.practiceArea,

              subject:
                demand.subject,

              benefitType:
                demand.benefitType,

              origin:
                demand.origin,

              administrativeStatus:
                demand.administrativeStatus,

              number:
                demand.number,

              administrativeNumber:
                demand.administrativeNumber,

              administrativeProcess:
                demand.administrativeProcess,

              court:
                demand.court,

              courtUnit:
                demand.courtUnit,

              judge:
                demand.judge,

              city:
                demand.city,

              state:
                demand.state,

              opposingParty:
                demand.opposingParty,

              claimValue:
                demand.claimValue !==
                null
                  ? Number(
                      demand.claimValue,
                    )
                  : null,

              status:
                demand.status,

              administrativeRequestDate:
                demand.administrativeRequestDate,

              distributionDate:
                demand.distributionDate,

              notes:
                demand.notes,
            }}
          />
        </div>
      </div>
    </AppShell>
  );
}