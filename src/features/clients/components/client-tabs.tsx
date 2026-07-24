"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ClientCasesList } from "@/features/cases/components/client-cases-list";

import type { ClientDetails } from "../types";

import { DocumentsTab } from "./tabs/documents-tab";
import { GovTab } from "./tabs/gov-tab";
import { OverviewTab } from "./tabs/overview-tab";

type ClientTabsProps = {
  client: ClientDetails;
};

export function ClientTabs({
  client,
}: ClientTabsProps) {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">
          Visão Geral
        </TabsTrigger>

        <TabsTrigger value="cases">
          Casos
        </TabsTrigger>

        <TabsTrigger value="documents">
          Documentos
        </TabsTrigger>

        <TabsTrigger value="financial">
          Financeiro
        </TabsTrigger>

        <TabsTrigger value="timeline">
          Timeline
        </TabsTrigger>

        <TabsTrigger value="gov">
          Gov.br
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <OverviewTab client={client} />
      </TabsContent>

      <TabsContent value="cases">
        <ClientCasesList
          clientId={client.id}
          cases={client.cases}
        />
      </TabsContent>

      <TabsContent value="documents">
        <DocumentsTab client={client} />
      </TabsContent>

      <TabsContent value="financial">
        <div className="rounded-xl border bg-card p-6">
          Aba Financeiro em construção.
        </div>
      </TabsContent>

      <TabsContent value="timeline">
        <div className="rounded-xl border bg-card p-6">
          Aba Timeline em construção.
        </div>
      </TabsContent>

      <TabsContent value="gov">
        <GovTab
          clientId={client.id}
          govLogin={client.govLogin || client.cpf}
          hasGovPassword={Boolean(
            client.govPasswordEncrypted
          )}
        />
      </TabsContent>
    </Tabs>
  );
}