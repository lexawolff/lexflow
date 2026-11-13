import {
  History,
} from "lucide-react";

import type {
  ClientDetails,
} from "../../types";

import {
  Timeline,
} from "@/features/timeline/components/timeline";

type TimelineTabProps = {
  client:
    ClientDetails;
};

export function TimelineTab({
  client,
}: TimelineTabProps) {
  const eventsCount =
    client.timelineEvents.length;

  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* ==========================
          CABEÇALHO
      ========================== */}

      <div className="border-b bg-muted/20 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <History className="size-5" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold">
                Histórico
              </h2>

              {eventsCount >
              0 ? (
                <span className="inline-flex min-w-6 items-center justify-center rounded-full border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {
                    eventsCount
                  }
                </span>
              ) : null}
            </div>

            <p className="mt-0.5 text-sm text-muted-foreground">
              Registro cronológico das principais movimentações e atividades relacionadas ao cliente.
            </p>
          </div>
        </div>
      </div>

      {/* ==========================
          CONTEÚDO
      ========================== */}

      <div className="p-5 sm:p-6">
        {eventsCount >
        0 ? (
          <Timeline
            events={
              client.timelineEvents
            }
          />
        ) : (
          <div className="rounded-2xl border border-dashed bg-muted/10 px-6 py-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <History className="size-5" />
            </div>

            <p className="mt-4 font-medium">
              Nenhum registro no histórico
            </p>

            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
              As movimentações e atividades relevantes deste cliente aparecerão aqui em ordem cronológica.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}