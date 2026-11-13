"use client";

import {
  useState,
} from "react";

import {
  Plus,
  ReceiptText,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  CreatePayableForm,
} from "./create-payable-form";

export function CreatePayableDialog() {
  const [
    open,
    setOpen,
  ] =
    useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={
        setOpen
      }
    >
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-2 size-4" />

            Nova conta
          </Button>
        }
      />

      <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-2xl">
        <div className="border-b bg-rose-50/50 px-6 py-5 dark:bg-rose-950/15">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                <ReceiptText className="size-5" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-rose-700 dark:text-rose-300">
                  Despesas do escritório
                </p>

                <DialogTitle>
                  Nova conta a pagar
                </DialogTitle>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Registre uma despesa para
                  acompanhar vencimento e
                  pagamento no financeiro.
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <CreatePayableForm
          onCancel={() =>
            setOpen(false)
          }
          onSuccess={() =>
            setOpen(false)
          }
        />
      </DialogContent>
    </Dialog>
  );
}