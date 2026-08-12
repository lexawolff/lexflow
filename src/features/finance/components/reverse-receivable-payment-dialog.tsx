"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { reverseReceivablePayment } from "../actions/reverse-receivable-payment";

import type { EditableReceivable } from "./edit-receivable-form";

type ReverseReceivablePaymentDialogProps =
  {
    open: boolean;

    onOpenChange: (
      open: boolean,
    ) => void;

    receivable:
      EditableReceivable;
  };

function formatMoney(
  value: number,
): string {
  return value.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    },
  );
}

export function ReverseReceivablePaymentDialog({
  open,
  onOpenChange,
  receivable,
}: ReverseReceivablePaymentDialogProps) {
  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null,
    );

  const [
    isPending,
    startTransition,
  ] =
    useTransition();

  function handleOpenChange(
    nextOpen: boolean,
  ) {
    if (isPending) {
      return;
    }

    if (!nextOpen) {
      setErrorMessage(null);
    }

    onOpenChange(nextOpen);
  }

  function handleConfirm() {
    setErrorMessage(null);

    startTransition(
      async () => {
        try {
          const formData =
            new FormData();

          formData.set(
            "receivableId",
            receivable.id,
          );

          await reverseReceivablePayment(
            formData,
          );

          onOpenChange(false);
        } catch (error) {
          console.error(error);

          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Não foi possível estornar o pagamento.",
          );
        }
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={
        handleOpenChange
      }
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Estornar pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-yellow-700" />

              <div>
                <p className="font-medium text-yellow-950">
                  Confirmar estorno
                </p>

                <p className="mt-2 text-sm text-yellow-900">
                  O pagamento
                  registrado será
                  removido e a cobrança
                  voltará a ficar
                  pendente ou atrasada,
                  conforme o
                  vencimento.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">
              {
                receivable.description
              }
            </p>

            {receivable.installmentNumber &&
            receivable.totalInstallments ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Parcela{" "}
                {
                  receivable.installmentNumber
                }
                /
                {
                  receivable.totalInstallments
                }
              </p>
            ) : null}

            <p className="mt-3 text-2xl font-bold">
              {formatMoney(
                receivable.totalAmount,
              )}
            </p>
          </div>

          <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            A data do recebimento e a
            forma de pagamento também
            serão removidas.
          </div>

          {errorMessage ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {errorMessage}
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={
                isPending
              }
              onClick={() =>
                handleOpenChange(
                  false,
                )
              }
              className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Voltar
            </button>

            <button
              type="button"
              disabled={
                isPending
              }
              onClick={
                handleConfirm
              }
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="mr-2 size-4" />

              {isPending
                ? "Estornando..."
                : "Confirmar estorno"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}