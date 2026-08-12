"use client";

import {
  useEffect,
  useState,
  useTransition,
} from "react";

import {
  AlertTriangle,
  Ban,
  Trash2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { removeReceivable } from "../actions/remove-receivable";
import type {
  ReceivableRemovalMode,
  ReceivableRemovalScope,
} from "../schemas/remove-receivable-schema";

import type { EditableReceivable } from "./edit-receivable-form";

type RemoveReceivableDialogProps = {
  open: boolean;

  onOpenChange: (
    open: boolean,
  ) => void;

  receivable: EditableReceivable;

  mode: ReceivableRemovalMode;
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

export function RemoveReceivableDialog({
  open,
  onOpenChange,
  receivable,
  mode,
}: RemoveReceivableDialogProps) {
  const [scope, setScope] =
    useState<ReceivableRemovalScope>(
      "SINGLE",
    );

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [isPending, startTransition] =
    useTransition();

  const isInstallment =
    Boolean(
      receivable.installmentGroupId &&
        receivable.installmentNumber &&
        receivable.totalInstallments,
    );

  const isDelete =
    mode === "DELETE";

  useEffect(() => {
    if (!open) {
      setScope("SINGLE");
      setErrorMessage(null);
    }
  }, [open]);

  function handleConfirm() {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const formData =
          new FormData();

        formData.set(
          "receivableId",
          receivable.id,
        );

        formData.set(
          "mode",
          mode,
        );

        formData.set(
          "scope",
          isInstallment
            ? scope
            : "SINGLE",
        );

        await removeReceivable(
          formData,
        );

        onOpenChange(false);
      } catch (error) {
        console.error(error);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : isDelete
              ? "Não foi possível excluir o recebimento."
              : "Não foi possível cancelar o recebimento.",
        );
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={
        isPending
          ? undefined
          : onOpenChange
      }
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isDelete
              ? "Excluir recebimento"
              : "Cancelar cobrança"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div
            className={
              isDelete
                ? "rounded-lg border border-destructive/30 bg-destructive/5 p-4"
                : "rounded-lg border bg-muted/40 p-4"
            }
          >
            <div className="flex items-start gap-3">
              {isDelete ? (
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
              ) : (
                <Ban className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              )}

              <div>
                <p className="font-medium">
                  {
                    receivable.description
                  }
                </p>

                <p className="mt-1 text-lg font-semibold">
                  {formatMoney(
                    receivable.totalAmount,
                  )}
                </p>

                <p className="mt-2 text-sm text-muted-foreground">
                  {isDelete
                    ? "A exclusão é definitiva e deve ser usada apenas para lançamentos criados por engano."
                    : "O recebimento continuará no histórico, mas ficará marcado como cancelado."}
                </p>
              </div>
            </div>
          </div>

          {isInstallment ? (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">
                  Esta cobrança pertence
                  a um parcelamento
                </p>

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
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    setScope("SINGLE")
                  }
                  className={`w-full rounded-lg border p-4 text-left transition ${
                    scope === "SINGLE"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <span className="block text-sm font-medium">
                    Somente esta parcela
                  </span>

                  <span className="mt-1 block text-xs text-muted-foreground">
                    {isDelete
                      ? "Exclui apenas a parcela selecionada."
                      : "Cancela apenas a parcela selecionada."}
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    setScope("GROUP")
                  }
                  className={`w-full rounded-lg border p-4 text-left transition ${
                    scope === "GROUP"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <span className="block text-sm font-medium">
                    Todo o parcelamento
                  </span>

                  <span className="mt-1 block text-xs text-muted-foreground">
                    {isDelete
                      ? "Exclui todas as parcelas, desde que nenhuma tenha pagamento registrado."
                      : "Cancela todas as parcelas ainda não pagas. Parcelas já pagas permanecem preservadas."}
                  </span>
                </button>
              </div>
            </div>
          ) : null}

          {isDelete ? (
            <div className="rounded-lg border border-destructive/30 px-4 py-3 text-sm">
              <strong>
                Atenção:
              </strong>{" "}
              esta ação não poderá ser
              desfeita.
            </div>
          ) : null}

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
              disabled={isPending}
              onClick={() =>
                onOpenChange(false)
              }
              className="rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Voltar
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={handleConfirm}
              className={
                isDelete
                  ? "inline-flex items-center rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
                  : "inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              }
            >
              {isDelete ? (
                <Trash2 className="mr-2 size-4" />
              ) : (
                <Ban className="mr-2 size-4" />
              )}

              {isPending
                ? "Processando..."
                : isDelete
                  ? "Excluir definitivamente"
                  : "Confirmar cancelamento"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}