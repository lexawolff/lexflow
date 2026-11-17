"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  createWorkItemAction,
} from "@/features/work/actions/work-items";

import {
  withFailureToast,
} from "@/lib/actions/action-feedback";

type ClientOption = {
  id: string;
  name: string;
};

type CaseOption = {
  id: string;
  clientId: string;
  title: string;
  number: string | null;
};

type Props = {
  clients: ClientOption[];
  cases: CaseOption[];
};

export function WorkItemCreateForm({
  clients,
  cases,
}: Props) {
  const [
    clientId,
    setClientId,
  ] =
    useState("");

  const [
    caseId,
    setCaseId,
  ] =
    useState("");

  const filteredCases =
    useMemo(
      () =>
        clientId
          ? cases.filter(
              (caseItem) =>
                caseItem.clientId ===
                clientId,
            )
          : [],
      [
        cases,
        clientId,
      ],
    );

  return (
    <details className="rounded-xl border bg-card">
      <summary className="cursor-pointer select-none rounded-t-xl px-5 py-4 font-semibold transition-colors hover:bg-muted/50">
        + Adicionar à fila
      </summary>

      <form
        action={withFailureToast(
          createWorkItemAction,
        )}
        className="grid gap-4 border-t p-5 md:grid-cols-2"
      >
        <div className="md:col-span-2">
          <label
            htmlFor="title"
            className="mb-1 block text-sm font-medium"
          >
            O que precisa ser feito?
          </label>

          <input
            id="title"
            name="title"
            required
            placeholder="Ex.: Elaborar petição inicial"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="clientId"
            className="mb-1 block text-sm font-medium"
          >
            Cliente
          </label>

          <select
            id="clientId"
            name="clientId"
            value={
              clientId
            }
            onChange={(
              event,
            ) => {
              setClientId(
                event.target.value,
              );

              setCaseId(
                "",
              );
            }}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">
              Sem cliente
            </option>

            {clients.map(
              (client) => (
                <option
                  key={
                    client.id
                  }
                  value={
                    client.id
                  }
                >
                  {
                    client.name
                  }
                </option>
              ),
            )}
          </select>
        </div>

        <div>
          <label
            htmlFor="caseId"
            className="mb-1 block text-sm font-medium"
          >
            Caso
          </label>

          <select
            id="caseId"
            name="caseId"
            value={
              caseId
            }
            onChange={(
              event,
            ) =>
              setCaseId(
                event.target.value,
              )
            }
            disabled={
              !clientId ||
              filteredCases.length ===
                0
            }
            className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {!clientId ? (
              <option value="">
                Selecione um cliente primeiro
              </option>
            ) : filteredCases.length ===
              0 ? (
              <option value="">
                Este cliente não possui casos
              </option>
            ) : (
              <>
                <option value="">
                  Sem caso específico
                </option>

                {filteredCases.map(
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
              </>
            )}
          </select>

          {clientId &&
          filteredCases.length >
            0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Mostrando apenas os casos
              deste cliente.
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="period"
            className="mb-1 block text-sm font-medium"
          >
            Planejamento
          </label>

          <select
            id="period"
            name="period"
            defaultValue="ESTA_SEMANA"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
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
            htmlFor="dueDate"
            className="mb-1 block text-sm font-medium"
          >
            Prazo real
            (opcional)
          </label>

          <input
            id="dueDate"
            name="dueDate"
            type="date"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          />

          <p className="mt-1 text-xs text-muted-foreground">
            Com prazo informado, o
            LexFlow encaixa o trabalho
            automaticamente pela data.
          </p>
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="description"
            className="mb-1 block text-sm font-medium"
          >
            Observação
            (opcional)
          </label>

          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="Alguma informação útil para quando for executar este trabalho."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98]"
          >
            Adicionar à fila
          </button>
        </div>
      </form>
    </details>
  );
}