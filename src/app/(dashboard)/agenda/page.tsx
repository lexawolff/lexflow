import {
  AppShell,
} from "@/components/app-shell/app-shell";

import {
  AgendaMonth,
} from "@/features/agenda/components/agenda-month";

import {
  getAgendaData,
} from "@/features/agenda/services/get-agenda-data";

type Props = {
  searchParams: Promise<{
    month?: string;
  }>;
};

export default async function AgendaPage({
  searchParams,
}: Props) {
  const params =
    await searchParams;

  const data =
    await getAgendaData(
      params.month,
    );

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Agenda
          </h1>

          <p className="mt-1 text-muted-foreground">
            Organize prazos,
            compromissos e tarefas
            do escritório.
          </p>
        </div>

        <AgendaMonth
          data={data}
        />
      </div>
    </AppShell>
  );
}