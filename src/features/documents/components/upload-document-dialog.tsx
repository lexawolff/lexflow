"use client";

import { FormDialog } from "@/components/form-dialog";

import { UploadDocumentForm } from "./upload-document-form";

type UploadDocumentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  clientId: string;
};

export function UploadDocumentDialog({
  open,
  onOpenChange,
  clientId,
}: UploadDocumentDialogProps) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Adicionar documento"
      description="Selecione um arquivo e informe sua categoria."
    >
      <UploadDocumentForm
        clientId={clientId}
        onSuccess={() => onOpenChange(false)}
      />
    </FormDialog>
  );
}