"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { RegisterReceivablePaymentForm } from "./register-receivable-payment-form";

type RegisterReceivablePaymentDialogProps = {
  open: boolean;

  onOpenChange: (
    open: boolean,
  ) => void;

  receivableId: string;

  description: string;

  totalAmount: number;
};

export function RegisterReceivablePaymentDialog({
  open,
  onOpenChange,
  receivableId,
  description,
  totalAmount,
}: RegisterReceivablePaymentDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Registrar pagamento
          </DialogTitle>
        </DialogHeader>

        <RegisterReceivablePaymentForm
          receivableId={
            receivableId
          }
          description={
            description
          }
          totalAmount={
            totalAmount
          }
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