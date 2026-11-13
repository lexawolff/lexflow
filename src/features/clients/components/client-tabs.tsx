import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  ClientCasesList,
} from "@/features/cases/components/client-cases-list";

import {
  ClientFinancialTab,
} from "@/features/finance/components/client-financial-tab";

import type {
  ClientDetails,
} from "../types";

import {
  DocumentsTab,
} from "./tabs/documents-tab";

import {
  GovTab,
} from "./tabs/gov-tab";

import {
  OverviewTab,
} from "./tabs/overview-tab";

import {
  TimelineTab,
} from "./tabs/timeline-tab";

type ClientTabsProps = {
  client:
    ClientDetails;

  canCreateCase:
    boolean;

  canViewDocuments:
    boolean;

  canCreateDocuments:
    boolean;

  canDeleteDocuments:
    boolean;

  canViewFinance:
    boolean;

  canWriteFinance:
    boolean;

  canViewGov:
    boolean;

  canCreateAgenda:
    boolean;

  canEditClient:
    boolean;
};

export function ClientTabs({
  client,
  canCreateCase,
  canViewDocuments,
  canCreateDocuments,
  canDeleteDocuments,
  canViewFinance,
  canWriteFinance,
  canViewGov,
  canCreateAgenda,
  canEditClient,
}: ClientTabsProps) {
  return (
    <Tabs
      defaultValue="overview"
      className="space-y-4"
    >
      <TabsList className="flex h-auto flex-wrap">
        <TabsTrigger value="overview">
          Visão Geral
        </TabsTrigger>

        <TabsTrigger value="cases">
          Casos
        </TabsTrigger>

        {canViewDocuments ? (
          <TabsTrigger value="documents">
            Documentos
          </TabsTrigger>
        ) : null}

        {canViewFinance ? (
          <TabsTrigger value="financial">
            Financeiro
          </TabsTrigger>
        ) : null}

        <TabsTrigger value="timeline">
          Timeline
        </TabsTrigger>

        {canViewGov ? (
          <TabsTrigger value="gov">
            Gov.br
          </TabsTrigger>
        ) : null}
      </TabsList>

      <TabsContent value="overview">
        <OverviewTab
          client={
            client
          }
          canCreateAgenda={
            canCreateAgenda
          }
          canCreateCase={
            canCreateCase
          }
          canEditClient={
            canEditClient
          }
          canViewFinance={
            canViewFinance
          }
        />
      </TabsContent>

      <TabsContent value="cases">
        <ClientCasesList
          clientId={
            client.id
          }
          cases={
            client.cases
          }
          canCreateCase={
            canCreateCase
          }
        />
      </TabsContent>

      {canViewDocuments ? (
        <TabsContent value="documents">
          <DocumentsTab
            clientId={
              client.id
            }
            documents={
              client.documents
            }
            canCreateDocuments={
              canCreateDocuments
            }
            canDeleteDocuments={
              canDeleteDocuments
            }
          />
        </TabsContent>
      ) : null}

      {canViewFinance ? (
        <TabsContent
          value="financial"
          className="mt-6"
        >
          <ClientFinancialTab
            client={
              client
            }
            canWriteFinance={
              canWriteFinance
            }
          />
        </TabsContent>
      ) : null}

      <TabsContent value="timeline">
        <TimelineTab
          client={
            client
          }
        />
      </TabsContent>

      {canViewGov ? (
        <TabsContent value="gov">
          <GovTab
            key={client.id}
            clientId={
              client.id
            }
            govLogin={
              client.govLogin ||
              client.cpf
            }
            hasGovPassword={
              client.hasGovPassword
            }
          />
        </TabsContent>
      ) : null}
    </Tabs>
  );
}
