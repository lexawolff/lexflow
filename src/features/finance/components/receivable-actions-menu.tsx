"use client";

import { useState } from "react";

import {
  Ban,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { ReceivableCaseOption } from "./create-receivable-form";
import { EditReceivableDialog } from "./edit-receivable-dialog";
import type { EditableReceivable } from "./edit-receivable-form";
import { RegisterReceivablePaymentDialog } from "./register-receivable-payment-dialog";
import { RemoveReceivableDialog } from "./remove-receivable-dialog";
import { ReverseReceivablePaymentDialog } from "./reverse-receivable-payment-dialog";

type Props = {
  receivable:
    EditableReceivable;

  caseOptions?:
    ReceivableCaseOption[];
};

export function ReceivableActionsMenu({
  receivable,
  caseOptions = [],
}: Props) {
  const [
    editOpen,
    setEditOpen,
  ] =
    useState(false);

  const [
    paymentOpen,
    setPaymentOpen,
  ] =
    useState(false);

  const [
    reversePaymentOpen,
    setReversePaymentOpen,
  ] =
    useState(false);

  const [
    cancelOpen,
    setCancelOpen,
  ] =
    useState(false);

  const [
    deleteOpen,
    setDeleteOpen,
  ] =
    useState(false);

  const canRegisterPayment =
    receivable.status !==
      "PAGO" &&
    receivable.status !==
      "CANCELADO";

  const canReversePayment =
    receivable.status ===
    "PAGO";

  const canEdit =
    receivable.status !==
    "CANCELADO";

  const canCancel =
    receivable.status !==
      "PAGO" &&
    receivable.status !==
      "PARCIAL" &&
    receivable.status !==
      "CANCELADO";

  const canDelete =
    receivable.status !==
      "PAGO" &&
    receivable.status !==
      "PARCIAL";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Ações do recebimento"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          }
        />

        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={
              !canRegisterPayment
            }
            onClick={() =>
              setPaymentOpen(
                true,
              )
            }
          >
            <Wallet className="mr-2 size-4" />
            Registrar pagamento
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={
              !canReversePayment
            }
            onClick={() =>
              setReversePaymentOpen(
                true,
              )
            }
          >
            <RotateCcw className="mr-2 size-4" />
            Estornar pagamento
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={!canEdit}
            onClick={() =>
              setEditOpen(true)
            }
          >
            <Pencil className="mr-2 size-4" />
            Editar
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            disabled={
              !canCancel
            }
            onClick={() =>
              setCancelOpen(true)
            }
          >
            <Ban className="mr-2 size-4" />
            Cancelar cobrança
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={
              !canDelete
            }
            onClick={() =>
              setDeleteOpen(true)
            }
            className="text-destructive"
          >
            <Trash2 className="mr-2 size-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RegisterReceivablePaymentDialog
        open={paymentOpen}
        onOpenChange={
          setPaymentOpen
        }
        receivableId={
          receivable.id
        }
        description={
          receivable.description
        }
        totalAmount={
          receivable.totalAmount
        }
      />

      <ReverseReceivablePaymentDialog
        open={
          reversePaymentOpen
        }
        onOpenChange={
          setReversePaymentOpen
        }
        receivable={
          receivable
        }
      />

      <EditReceivableDialog
        open={editOpen}
        onOpenChange={
          setEditOpen
        }
        receivable={
          receivable
        }
        caseOptions={
          caseOptions
        }
      />

      <RemoveReceivableDialog
        open={cancelOpen}
        onOpenChange={
          setCancelOpen
        }
        receivable={
          receivable
        }
        mode="CANCEL"
      />

      <RemoveReceivableDialog
        open={deleteOpen}
        onOpenChange={
          setDeleteOpen
        }
        receivable={
          receivable
        }
        mode="DELETE"
      />
    </>
  );
}