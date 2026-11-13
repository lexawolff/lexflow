"use client";

import {
  type ReactNode,
  useState,
  useTransition,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  Eye,
  LayoutGrid,
  Loader2,
  Save,
} from "lucide-react";

import {
  updatePreferencesAction,
} from "@/features/settings/actions/update-preferences";

type Props = {
  agendaShowCompleted:
    boolean;

  agendaDefaultStatus:
    string;

  agendaItemsPerDay:
    number;

  agendaShowAttention:
    boolean;
};

export function PreferencesForm({
  agendaShowCompleted,
  agendaDefaultStatus,
  agendaItemsPerDay,
  agendaShowAttention,
}: Props) {
  const [
    isPending,
    startTransition,
  ] =
    useTransition();

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState<string | null>(
      null,
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<string | null>(
      null,
    );

  function submit(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSuccessMessage(
      null,
    );

    setErrorMessage(
      null,
    );

    const formData =
      new FormData(
        event.currentTarget,
      );

    startTransition(
      async () => {
        const result =
          await updatePreferencesAction(
            formData,
          );

        if (
          !result.success
        ) {
          setErrorMessage(
            result.error,
          );

          return;
        }

        setSuccessMessage(
          "Preferências salvas com sucesso.",
        );
      },
    );
  }

  return (
    <form
      onSubmit={
        submit
      }
      className="space-y-6"
    >
      <section className="overflow-hidden rounded-2xl border bg-card">
        <SectionHeader
          icon={
            <CalendarDays className="size-5" />
          }
          title="Agenda"
          description="Defina como a Agenda deve aparecer para você."
        />

        <div className="space-y-6 p-5 sm:p-6">
          <PreferenceToggle
            name="agendaShowCompleted"
            title="Mostrar tarefas concluídas"
            description="Mantém tarefas já concluídas visíveis no calendário."
            defaultChecked={
              agendaShowCompleted
            }
          />

          <PreferenceToggle
            name="agendaShowAttention"
            title="Mostrar painel de atenção"
            description="Exibe os cartões de tarefas atrasadas e compromissos de hoje acima do calendário."
            defaultChecked={
              agendaShowAttention
            }
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <SectionHeader
          icon={
            <Eye className="size-5" />
          }
          title="Exibição inicial"
          description="Escolha o filtro aplicado automaticamente quando você abrir a Agenda."
        />

        <div className="p-5 sm:p-6">
          <label className="block">
            <span className="text-sm font-medium">
              Situação padrão
            </span>

            <select
              name="agendaDefaultStatus"
              defaultValue={
                agendaDefaultStatus
              }
              className="mt-2 h-11 w-full max-w-md rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="TODOS">
                Todas as situações
              </option>

              <option value="PENDENTE">
                Pendentes
              </option>

              <option value="EM_ANDAMENTO">
                Em andamento
              </option>

              <option value="ATRASADA">
                Atrasadas
              </option>

              <option value="CANCELADA">
                Canceladas
              </option>
            </select>

            <p className="mt-2 text-xs text-muted-foreground">
              Você continuará podendo alterar o filtro manualmente dentro da Agenda.
            </p>
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <SectionHeader
          icon={
            <LayoutGrid className="size-5" />
          }
          title="Densidade do calendário"
          description="Defina quantos compromissos aparecem diretamente dentro de cada dia."
        />

        <div className="p-5 sm:p-6">
          <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
            <ItemsOption
              value={
                2
              }
              title="Compacta"
              description="Até 2 itens"
              defaultChecked={
                agendaItemsPerDay ===
                2
              }
            />

            <ItemsOption
              value={
                4
              }
              title="Padrão"
              description="Até 4 itens"
              defaultChecked={
                agendaItemsPerDay ===
                4
              }
            />

            <ItemsOption
              value={
                6
              }
              title="Expandida"
              description="Até 6 itens"
              defaultChecked={
                agendaItemsPerDay ===
                6
              }
            />
          </div>
        </div>
      </section>

      {successMessage ? (
        <div className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />

          {
            successMessage
          }
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {
            errorMessage
          }
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={
            isPending
          }
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}

          {isPending
            ? "Salvando..."
            : "Salvar preferências"}
        </button>
      </div>
    </form>
  );
}

function PreferenceToggle({
  name,
  title,
  description,
  defaultChecked,
}: {
  name:
    string;

  title:
    string;

  description:
    string;

  defaultChecked:
    boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-5 rounded-xl border bg-background p-4">
      <div>
        <p className="text-sm font-semibold">
          {
            title
          }
        </p>

        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {
            description
          }
        </p>
      </div>

      <input
        type="checkbox"
        name={
          name
        }
        defaultChecked={
          defaultChecked
        }
        className="mt-1 size-5 shrink-0 accent-primary"
      />
    </label>
  );
}

function ItemsOption({
  value,
  title,
  description,
  defaultChecked,
}: {
  value:
    number;

  title:
    string;

  description:
    string;

  defaultChecked:
    boolean;
}) {
  return (
    <label className="cursor-pointer">
      <input
        type="radio"
        name="agendaItemsPerDay"
        value={
          value
        }
        defaultChecked={
          defaultChecked
        }
        className="peer sr-only"
      />

      <div className="rounded-xl border bg-background p-4 transition peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:ring-1 peer-checked:ring-primary">
        <p className="text-sm font-semibold">
          {
            title
          }
        </p>

        <p className="mt-1 text-xs text-muted-foreground">
          {
            description
          }
        </p>
      </div>
    </label>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon:
    ReactNode;

  title:
    string;

  description:
    string;
}) {
  return (
    <div className="flex items-start gap-3 border-b p-5 sm:p-6">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
        {
          icon
        }
      </div>

      <div>
        <h2 className="font-semibold">
          {
            title
          }
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          {
            description
          }
        </p>
      </div>
    </div>
  );
}