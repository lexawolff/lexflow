"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { DocumentList } from "@/features/documents/components/document-list";
import { UploadDocumentDialog } from "@/features/documents/components/upload-document-dialog";

import type { ClientDetails } from "../../types";

type DocumentsTabProps = {
  client: ClientDetails;
};

export function DocumentsTab({
  client,
}: DocumentsTabProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Documentos ({client.documents.length})
          </h2>

          <p className="text-sm text-muted-foreground">
            Arquivos e documentos vinculados ao cliente.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setIsUploadOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar documento
        </Button>
      </div>

      <DocumentList documents={client.documents} />

      <UploadDocumentDialog
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        clientId={client.id}
      />
    </div>
  );
}