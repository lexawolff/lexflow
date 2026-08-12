"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { ReceivableCaseOption } from "./create-receivable-form";
import {
  EditReceivableForm,
  type EditableReceivable,
} from "./edit-receivable-form";

type EditReceivableDialogProps = {
  open: boolean;

  onOpenChange: (
    open: boolean,
  ) => void;

  receivable: EditableReceivable;

  caseOptions?: ReceivableCaseOption[];
};

export function EditReceivableDialog({
  open,
  onOpenChange,
  receivable,
  caseOptions = [],
}: EditReceivableDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Editar recebimento
          </DialogTitle>
        </DialogHeader>

        <EditReceivableForm
          receivable={receivable}
          caseOptions={caseOptions}
          onCancel={() =>
            onOpenChange(false)
          }
          onSuccess={() =>
            onOpenChange(false)
          }
        />
      </DialogContent>
    </Dialog>
  );
}