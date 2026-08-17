"use client";

import {
  useEffect,
  useState,
  useTransition,
} from "react";

import {
  Ban,
  CalendarClock,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";

import {
  RpvStatus,
  RpvType,
} from "@prisma/client";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import {
  useForm,
} from "react-hook-form";

import {
  Button,
} from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  CurrencyField,
} from "@/components/forms/currency-field";

import {
  SelectField,
} from "@/components/forms/select-field";

import {
  TextareaField,
} from "@/components/forms/textarea-field";

import {
  TextField,
} from "@/components/forms/text-field";

import {
  updateRpv,
} from "../actions/update-rpv";

import {
  updateRpvStatus,
} from "../actions/update-rpv-status";

import {
  removeRpv,
} from "../actions/remove-rpv";

import {
  updateRpvFormSchema,
  updateRpvStatusFormSchema,
  type RpvRemovalMode,
  type UpdateRpvFormValues,
  type UpdateRpvStatusFormValues,
} from "../schemas/rpv-actions-schema";

export type EditableRpv = {
  id: string;

  type: RpvType;

  requisitionNumber: string;

  court: string;

  grossAmount: number;

  contractualFeeRate: number;

  contractualFeeValue: number;

  sucumbencyFeeValue: number;

  expectedPaymentDate: string;

  paidAt: string;

  bank: string;

  status: RpvStatus;

  notes: string;
};

type Props = {
  rpv:
    EditableRpv;
};

const typeOptions = [
  {
    label: "RPV",
    value: RpvType.RPV,
  },

  {
    label: "Precatório",
    value:
      RpvType.PRECATORIO,
  },
];

const statusOptions = [
  {
    label:
      "Aguardando expedição",
    value:
      RpvStatus.AGUARDANDO_EXPEDICAO,
  },

  {
    label:
      "Expedida",
    value:
      RpvStatus.EXPEDIDA,
  },

  {
    label:
      "Autuada",
    value:
      RpvStatus.AUTUADA,
  },

  {
    label:
      "Liberada",
    value:
      RpvStatus.LIBERADA,
  },

  {
    label:
      "Paga",
    value:
      RpvStatus.PAGA,
  },

  {
    label:
      "Cancelada",
    value:
      RpvStatus.CANCELADA,
  },
];

const statusLabels: Record<
  RpvStatus,
  string
> = {
  AGUARDANDO_EXPEDICAO:
    "Aguardando expedição",

  EXPEDIDA:
    "Expedida",

  AUTUADA:
    "Autuada",

  LIBERADA:
    "Liberada",

  PAGA:
    "Paga",

  CANCELADA:
    "Cancelada",
};

function getTodayInputValue(): string {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "America/Sao_Paulo",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      },
    );

  const parts =
    formatter.formatToParts(
      new Date(),
    );

  const year =
    parts.find(
      (part) =>
        part.type === "year",
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type === "month",
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type === "day",
    )?.value;

  if (
    !year ||
    !month ||
    !day
  ) {
    return "";
  }

  return `${year}-${month}-${day}`;
}

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

export function RpvActionsMenu({
  rpv,
}: Props) {
  const [
    editOpen,
    setEditOpen,
  ] =
    useState(false);

  const [
    statusOpen,
    setStatusOpen,
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

  const isPaid =
    rpv.status ===
    RpvStatus.PAGA;

  const isCanceled =
    rpv.status ===
    RpvStatus.CANCELADA;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Ações da requisição"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          }
        />

        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() =>
              setStatusOpen(true)
            }
          >
            {isPaid ? (
              <RotateCcw className="mr-2 size-4" />
            ) : (
              <CalendarClock className="mr-2 size-4" />
            )}

            Alterar situação
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={isCanceled}
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
              isPaid ||
              isCanceled
            }
            onClick={() =>
              setCancelOpen(true)
            }
          >
            <Ban className="mr-2 size-4" />

            Cancelar
          </DropdownMenuItem>

          <DropdownMenuItem
            disabled={isPaid}
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

      <EditRpvDialog
        open={editOpen}
        onOpenChange={
          setEditOpen
        }
        rpv={rpv}
      />

      <ChangeRpvStatusDialog
        open={statusOpen}
        onOpenChange={
          setStatusOpen
        }
        rpv={rpv}
      />

      <RemoveRpvDialog
        open={cancelOpen}
        onOpenChange={
          setCancelOpen
        }
        rpv={rpv}
        mode="CANCEL"
      />

      <RemoveRpvDialog
        open={deleteOpen}
        onOpenChange={
          setDeleteOpen
        }
        rpv={rpv}
        mode="DELETE"
      />
    </>
  );
}

/*
 * ==========================
 * EDITAR
 * ==========================
 */

function EditRpvDialog({
  open,
  onOpenChange,
  rpv,
}: {
  open: boolean;

  onOpenChange:
    (open: boolean) => void;

  rpv:
    EditableRpv;
}) {
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

  const defaultValues: UpdateRpvFormValues =
    {
      type:
        rpv.type,

      requisitionNumber:
        rpv.requisitionNumber,

      court:
        rpv.court,

      grossAmount:
        rpv.grossAmount,

      contractualFeeRate:
        rpv.contractualFeeRate,

      contractualFeeValue:
        rpv.contractualFeeValue,

      sucumbencyFeeValue:
        rpv.sucumbencyFeeValue,

      expectedPaymentDate:
        rpv.expectedPaymentDate,

      bank:
        rpv.bank,

      notes:
        rpv.notes,
    };

  const form =
    useForm<UpdateRpvFormValues>({
      resolver:
        zodResolver(
          updateRpvFormSchema,
        ),

      defaultValues,
    });

  const {
    control,
    handleSubmit,
    reset,
  } = form;

  useEffect(() => {
    if (open) {
      reset(defaultValues);
      setErrorMessage(null);
    }
  }, [
    open,
    reset,
    rpv,
  ]);

  const submit =
    handleSubmit(
      (values) => {
        setErrorMessage(null);

        startTransition(
          async () => {
            try {
              const formData =
                new FormData();

              formData.set(
                "rpvId",
                rpv.id,
              );

              formData.set(
                "type",
                values.type,
              );

              formData.set(
                "requisitionNumber",
                values.requisitionNumber,
              );

              formData.set(
                "court",
                values.court,
              );

              formData.set(
                "grossAmount",
                String(
                  values.grossAmount,
                ),
              );

              formData.set(
                "contractualFeeRate",
                values.contractualFeeRate >
                  0
                  ? String(
                      values.contractualFeeRate,
                    )
                  : "",
              );

              formData.set(
                "contractualFeeValue",
                values.contractualFeeValue >
                  0
                  ? String(
                      values.contractualFeeValue,
                    )
                  : "",
              );

              formData.set(
                "sucumbencyFeeValue",
                values.sucumbencyFeeValue >
                  0
                  ? String(
                      values.sucumbencyFeeValue,
                    )
                  : "",
              );

              formData.set(
                "expectedPaymentDate",
                values.expectedPaymentDate,
              );

              formData.set(
                "bank",
                values.bank,
              );

              formData.set(
                "notes",
                values.notes,
              );

              await updateRpv(
                formData,
              );

              onOpenChange(false);
            } catch (error) {
              console.error(error);

              setErrorMessage(
                error instanceof Error
                  ? error.message
                  : "Não foi possível atualizar a requisição.",
              );
            }
          },
        );
      },
    );

  return (
    <Dialog
      open={open}
      onOpenChange={
        isPending
          ? undefined
          : onOpenChange
      }
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Editar RPV ou precatório
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={submit}
          className="space-y-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              control={control}
              name="type"
              label="Tipo"
              options={
                typeOptions
              }
            />

            <TextField
              control={control}
              name="requisitionNumber"
              label="Número da requisição"
            />

            <TextField
              control={control}
              name="court"
              label="Tribunal"
            />

            <CurrencyField
              control={control}
              name="grossAmount"
              label="Valor bruto"
            />

            <TextField
              control={control}
              name="contractualFeeRate"
              label="Honorários contratuais (%)"
              type="number"
            />

            <CurrencyField
              control={control}
              name="contractualFeeValue"
              label="Honorários contratuais (valor)"
            />

            <CurrencyField
              control={control}
              name="sucumbencyFeeValue"
              label="Honorários sucumbenciais"
            />

            <TextField
              control={control}
              name="expectedPaymentDate"
              label="Previsão de pagamento"
              type="date"
            />

            <TextField
              control={control}
              name="bank"
              label="Banco"
            />
          </div>

          <TextareaField
            control={control}
            name="notes"
            label="Observações"
          />

          {errorMessage ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
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
              className="rounded-lg border bg-background px-4 py-2 text-sm font-medium"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              {isPending
                ? "Salvando..."
                : "Salvar alterações"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/*
 * ==========================
 * STATUS
 * ==========================
 */

function ChangeRpvStatusDialog({
  open,
  onOpenChange,
  rpv,
}: {
  open: boolean;

  onOpenChange:
    (open: boolean) => void;

  rpv:
    EditableRpv;
}) {
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

  const form =
    useForm<UpdateRpvStatusFormValues>({
      resolver:
        zodResolver(
          updateRpvStatusFormSchema,
        ),

      defaultValues: {
        status:
          rpv.status,

        paidAt:
          rpv.paidAt ||
          getTodayInputValue(),
      },
    });

  const {
    control,
    handleSubmit,
    reset,
    watch,
  } = form;

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({
      status:
        rpv.status,

      paidAt:
        rpv.paidAt ||
        getTodayInputValue(),
    });

    setErrorMessage(null);
  }, [
    open,
    reset,
    rpv,
  ]);

  const selectedStatus =
    watch("status");

  const submit =
    handleSubmit(
      (values) => {
        setErrorMessage(null);

        startTransition(
          async () => {
            try {
              const formData =
                new FormData();

              formData.set(
                "rpvId",
                rpv.id,
              );

              formData.set(
                "status",
                values.status,
              );

              formData.set(
                "paidAt",
                values.status ===
                  RpvStatus.PAGA
                  ? values.paidAt
                  : "",
              );

              await updateRpvStatus(
                formData,
              );

              onOpenChange(false);
            } catch (error) {
              console.error(error);

              setErrorMessage(
                error instanceof Error
                  ? error.message
                  : "Não foi possível alterar a situação.",
              );
            }
          },
        );
      },
    );

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
            Alterar situação
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={submit}
          className="space-y-6"
        >
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">
              Situação atual
            </p>

            <p className="mt-1 font-semibold">
              {
                statusLabels[
                  rpv.status
                ]
              }
            </p>

            <p className="mt-3 text-sm text-muted-foreground">
              Crédito bruto
            </p>

            <p className="mt-1 text-xl font-bold">
              {formatMoney(
                rpv.grossAmount,
              )}
            </p>
          </div>

          <SelectField
            control={control}
            name="status"
            label="Nova situação"
            options={
              statusOptions
            }
          />

          {selectedStatus ===
          RpvStatus.PAGA ? (
            <TextField
              control={control}
              name="paidAt"
              label="Data do pagamento"
              type="date"
            />
          ) : null}

          {rpv.status ===
            RpvStatus.PAGA &&
          selectedStatus !==
            RpvStatus.PAGA ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
              Ao retirar a situação
              de “Paga”, a data de
              pagamento será removida.
              Isso funciona como
              estorno do pagamento
              registrado.
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
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
              className="rounded-lg border bg-background px-4 py-2 text-sm font-medium"
            >
              Voltar
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              {isPending
                ? "Salvando..."
                : "Confirmar alteração"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/*
 * ==========================
 * CANCELAR / EXCLUIR
 * ==========================
 */

function RemoveRpvDialog({
  open,
  onOpenChange,
  rpv,
  mode,
}: {
  open: boolean;

  onOpenChange:
    (open: boolean) => void;

  rpv:
    EditableRpv;

  mode:
    RpvRemovalMode;
}) {
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

  const isDelete =
    mode === "DELETE";

  function confirm() {
    setErrorMessage(null);

    startTransition(
      async () => {
        try {
          const formData =
            new FormData();

          formData.set(
            "rpvId",
            rpv.id,
          );

          formData.set(
            "mode",
            mode,
          );

          await removeRpv(
            formData,
          );

          onOpenChange(false);
        } catch (error) {
          console.error(error);

          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Não foi possível concluir a operação.",
          );
        }
      },
    );
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
              ? "Excluir requisição"
              : "Cancelar requisição"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div
            className={`rounded-xl border p-4 ${
              isDelete
                ? "border-destructive/30 bg-destructive/5"
                : "bg-muted/30"
            }`}
          >
            <p className="font-semibold">
              {rpv.type ===
              RpvType.RPV
                ? "RPV"
                : "Precatório"}
            </p>

            <p className="mt-2 text-2xl font-bold">
              {formatMoney(
                rpv.grossAmount,
              )}
            </p>

            <p className="mt-3 text-sm text-muted-foreground">
              {isDelete
                ? "O registro será removido definitivamente. Use esta opção apenas quando a requisição tiver sido cadastrada por engano."
                : "A requisição permanecerá no histórico, mas passará a constar como cancelada."}
            </p>
          </div>

          {errorMessage ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
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
              className="rounded-lg border bg-background px-4 py-2 text-sm font-medium"
            >
              Voltar
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={confirm}
              className={
                isDelete
                  ? "inline-flex items-center rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground"
                  : "inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
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