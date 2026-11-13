import Link from "next/link";

import {
  ArrowLeft,
  Pencil,
  UserRound,
} from "lucide-react";

import {
  AddToWorkQueue,
} from "@/features/work/components/add-to-work-queue";

import type {
  CaseDetails,
} from "../types";

import {
  CaseStatusBadge,
} from "./case-status-badge";

import {
  PracticeAreaBadge,
} from "./practice-area-badge";

type Props = {
  caseData:
    CaseDetails;

  canEditCase:
    boolean;

  canCreateWork:
    boolean;
};

export function CaseHeader({
  caseData,
  canEditCase,
  canCreateWork,
}: Props) {
  const casePath =
    `/clientes/${caseData.clientId}/casos/${caseData.id}`;

  const caseNumber =
    caseData.number ??
    caseData.administrativeNumber ??
    null;

  return (
    <header className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/casos"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />

          Voltar para casos
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {canCreateWork ? (
            <AddToWorkQueue
              clientId={
                caseData.clientId
              }
              clientName={
                caseData.client.name
              }
              fixedCase={{
                id:
                  caseData.id,

                title:
                  caseData.title,

                number:
                  caseNumber,
              }}
            />
          ) : null}

          {canEditCase ? (
            <Link
              href={`${casePath}/editar`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium transition hover:bg-muted"
            >
              <Pencil className="size-4" />

              Editar caso
            </Link>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {caseData.title}
          </h1>

          <Link
            href={`/clientes/${caseData.clientId}`}
            className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <UserRound className="size-4" />

            Cliente:

            <span className="font-medium text-foreground">
              {caseData.client.name}
            </span>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <PracticeAreaBadge
            area={
              caseData.practiceArea
            }
          />

          <CaseStatusBadge
            status={
              caseData.status
            }
          />
        </div>

        {caseData.subject ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {caseData.subject}
          </p>
        ) : null}
      </div>
    </header>
  );
}