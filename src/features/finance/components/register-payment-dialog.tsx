"use client";

import { useState } from "react";

import { Receivable } from "@prisma/client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { RegisterPaymentForm } from "./register-payment-form";

interface RegisterPaymentDialogProps {
  receivable: Receivable;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegisterPaymentDialog({
  receivable,
  open,
  onOpenChange,
}: RegisterPaymentDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Registrar pagamento
          </DialogTitle>
        </DialogHeader>

        <RegisterPaymentForm
          receivable={receivable}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}