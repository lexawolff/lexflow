"use client";

import {
  type FormEvent,
  useRef,
  useState,
} from "react";

import {
  ListPlus,
  X,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  createWorkItemAction,
} from "@/features/work/actions/work-items";

type WorkCaseOption = {
  id: string;
  title: string;
  number: string | null;
};

type AddToWorkQueueProps = {
  clientId: string;
  clientName: string;

  cases?: WorkCaseOption[];

  fixedCase?: WorkCaseOption | null;
};

export function AddToWorkQueue({
  clientId,
  clientName,
  cases = [],
  fixedCase = null,
}: AddToWorkQueueProps) {
  const dialogRef =
    useRef<HTMLDialogElement>(
      null,
    );

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  function openDialog() {
    setError(
      null,
    );

    dialogRef.current?.showModal();
  }

  function closeDialog() {
    if (saving) {
      return;
    }

    dialogRef.current?.close();
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const form =
      event.currentTarget;

    setSaving(
      true,
    );

    setError(
      null,
    );

    try {
      await createWorkItemAction(
        new FormData(
          form,
        ),
      );

      form.reset();

      dialogRef.current?.close();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Não foi possível adicionar o trabalho à fila.",
      );
    } finally {
      setSaving(
        false,
      );
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={
          openDialog
        }
        className="cursor-pointer"
      >
        <ListPlus className="mr-2 h-4 w-4" />

        Adicionar à fila
      </Button>

      <dialog
        ref={
          dialogRef
        }
        className="w-[calc(100%-2rem)] max-w-xl rounded-2xl border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/40"
      >
        <div className="border-b px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">
                Adicionar à fila de trabalho
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Organize este trabalho
                na sua fila de
                prioridades.
              </p>
            </div>

            <button
              type="button"
              onClick={
                closeDialog
              }
              disabled={
                saving
              }
              aria-label="Fechar"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="grid gap-4 p-5 md:grid-cols-2"
        >
          <input
            type="hidden"
            name="clientId"
            value={
              clientId
            }
          />

          {fixedCase ? (
            <input
              type="hidden"
              name="caseId"
              value={
                fixedCase.id
              }
            />
          ) : null}

          <div className="md:col-span-2">
            <p className="text-sm font-medium">
              Cliente
            </p>

            <div className="mt-1 rounded-md border bg-muted/30 px-3 py-2 text-sm">
              {clientName}
            </div>
          </div>

          {fixedCase ? (
            <div className="md:col-span-2">
              <p className="text-sm font-medium">
                Caso
              </p>

              <div className="mt-1 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                {fixedCase.title}

                {fixedCase.number
                  ? ` · ${fixedCase.number}`
                  : ""}
              </div>
            </div>
          ) : (
            <div className="md:col-span-2">
              <label
                htmlFor={`work-case-${clientId}`}
                className="mb-1 block text-sm font-medium"
              >
                Caso
              </label>

              <select
                id={`work-case-${clientId}`}
                name="caseId"
                defaultValue=""
                disabled={
                  saving
                }
                className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-50"
              >
                <option value="">
                  Sem caso específico
                </option>

                {cases.map(
                  (
                    caseItem,
                  ) => (
                    <option
                      key={
                        caseItem.id
                      }
                      value={
                        caseItem.id
                      }
                    >
                      {
                        caseItem.title
                      }

                      {caseItem.number
                        ? ` · ${caseItem.number}`
                        : ""}
                    </option>
                  ),
                )}
              </select>
            </div>
          )}

          <div className="md:col-span-2">
            <label
              htmlFor={`work-title-${clientId}-${fixedCase?.id ?? "client"}`}
              className="mb-1 block text-sm font-medium"
            >
              O que precisa ser feito?
            </label>

            <input
              id={`work-title-${clientId}-${fixedCase?.id ?? "client"}`}
              name="title"
              required
              disabled={
                saving
              }
              autoFocus
              placeholder="Ex.: Elaborar recurso inominado"
              className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor={`work-period-${clientId}-${fixedCase?.id ?? "client"}`}
              className="mb-1 block text-sm font-medium"
            >
              Planejamento
            </label>

            <select
              id={`work-period-${clientId}-${fixedCase?.id ?? "client"}`}
              name="period"
              defaultValue="ESTA_SEMANA"
              disabled={
                saving
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-50"
            >
              <option value="ESTA_SEMANA">
                Esta semana
              </option>

              <option value="ESTE_MES">
                Este mês
              </option>

              <option value="DEPOIS">
                Depois
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor={`work-due-${clientId}-${fixedCase?.id ?? "client"}`}
              className="mb-1 block text-sm font-medium"
            >
              Prazo real
              (opcional)
            </label>

            <input
              id={`work-due-${clientId}-${fixedCase?.id ?? "client"}`}
              name="dueDate"
              type="date"
              disabled={
                saving
              }
              className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-50"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor={`work-description-${clientId}-${fixedCase?.id ?? "client"}`}
              className="mb-1 block text-sm font-medium"
            >
              Observação
              (opcional)
            </label>

            <textarea
              id={`work-description-${clientId}-${fixedCase?.id ?? "client"}`}
              name="description"
              rows={3}
              disabled={
                saving
              }
              placeholder="Alguma informação útil para quando for executar este trabalho."
              className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50"
            />
          </div>

          {error ? (
            <div className="md:col-span-2">
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 md:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={
                closeDialog
              }
              disabled={
                saving
              }
              className="cursor-pointer"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={
                saving
              }
              className="cursor-pointer"
            >
              {saving
                ? "Adicionando..."
                : "Adicionar à fila"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}