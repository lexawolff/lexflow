import type {
  CaseDetails,
} from "../types";

import {
  getCaseAgendaData,
} from "../services/get-case-agenda-data";

import {
  CaseAgendaSection,
} from "./case-agenda-section";

import {
  CaseHeader,
} from "./case-header";

import {
  CaseSummaryCards,
} from "./case-summary-cards";

import {
  CaseTabs,
} from "./case-tabs";

import {
  getCurrentWorkspaceAccess,
  canUsePermission,
  hasPermission,
} from "@/lib/permissions";

type CaseViewProps = {
  caseData:
    CaseDetails;
};

const TIME_ZONE =
  "America/Sao_Paulo";

function getTodayKey() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        TIME_ZONE,

      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit",
    },
  ).format(
    new Date(),
  );
}

export async function CaseView({
  caseData,
}: CaseViewProps) {
  const {
    membership,
  } =
    await getCurrentWorkspaceAccess();

  const canEditCase =
    canUsePermission(
      membership,
      "CASE_EDIT",
    );

  const canCreateWork =
    canUsePermission(
      membership,
      "WORK_CREATE",
    );

  const canViewAgenda =
    hasPermission(
      membership.role,
      "AGENDA_VIEW",
    );

  const canCreateAgenda =
    canUsePermission(
      membership,
      "AGENDA_CREATE",
    );

  const agendaData =
    canViewAgenda
      ? await getCaseAgendaData({
          workspaceId:
            caseData.workspaceId,

          caseId:
            caseData.id,
        })
      : {
          tasks: [],
          todayKey:
            getTodayKey(),
        };

  const caseNumber =
    caseData.number ??
    caseData.administrativeNumber ??
    null;

  return (
    <div className="space-y-6">
      <CaseHeader
        caseData={
          caseData
        }
        canEditCase={
          canEditCase
        }
        canCreateWork={
          canCreateWork
        }
      />

      <CaseSummaryCards
        caseData={
          caseData
        }
        tasks={
          agendaData.tasks
        }
        todayKey={
          agendaData.todayKey
        }
      />

      {canViewAgenda ? (
        <CaseAgendaSection
          clientId={
            caseData.clientId
          }
          clientName={
            caseData.client.name
          }
          caseId={
            caseData.id
          }
          caseTitle={
            caseData.title
          }
          caseNumber={
            caseNumber
          }
          todayKey={
            agendaData.todayKey
          }
          tasks={
            agendaData.tasks
          }
          canCreate={
            canCreateAgenda
          }
        />
      ) : null}

      <CaseTabs
        caseData={
          caseData
        }
      />
    </div>
  );
}