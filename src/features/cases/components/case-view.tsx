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

type CaseViewProps = {
  caseData:
    CaseDetails;
};

export async function CaseView({
  caseData,
}: CaseViewProps) {
  const agendaData =
    await getCaseAgendaData({
      workspaceId:
        caseData.workspaceId,

      caseId:
        caseData.id,
    });

  const caseNumber =
    caseData.number ??
    caseData.administrativeNumber ??
    null;

  return (
    <div className="space-y-6">
      {/* ==========================
          CABEÇALHO
      ========================== */}

      <CaseHeader
        caseData={
          caseData
        }
      />

      {/* ==========================
          RESUMO
      ========================== */}

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

      {/* ==========================
          AGENDA
      ========================== */}

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
      />

      {/* ==========================
          DADOS / HISTÓRICO
      ========================== */}

      <CaseTabs
        caseData={
          caseData
        }
      />
    </div>
  );
}