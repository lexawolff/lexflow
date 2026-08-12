"use client";

import { useState } from "react";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  CreateReceivableForm,
  type ReceivableCaseOption,
} from "./create-receivable-form";

type CreateReceivableDialogProps = {
  clientId: string;
  caseOptions?: ReceivableCaseOption[];
};

export function CreateReceivableDialog({
  clientId,
  caseOptions = [],
}: CreateReceivableDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo recebimento
          </Button>
        }
      />

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Novo recebimento
          </DialogTitle>
        </DialogHeader>

        <CreateReceivableForm
          clientId={clientId}
          caseOptions={caseOptions}
          onCancel={() => setOpen(false)}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}