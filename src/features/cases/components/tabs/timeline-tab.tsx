import {
  Clock3,
  FileText,
  History,
} from "lucide-react";

import {
  formatDateTime,
} from "@/lib/format/date";

import type {
  CaseDetails,
} from "../../types";

type Props = {
  caseData:
    CaseDetails;
};

export function TimelineTab({
  caseData,
}: Props) {
  const eventsCount =
    caseData.events.length;

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
                Histórico do caso
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

            <p className="mt-0.5 text-sm leading-5 text-muted-foreground">
              Registro cronológico dos acontecimentos vinculados a este caso.
            </p>
          </div>
        </div>
      </div>

      {/* ==========================
          CONTEÚDO
      ========================== */}

      {eventsCount ===
      0 ? (
        <div className="px-6 py-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <History className="size-5" />
          </div>

          <h3 className="mt-4 font-semibold">
            Nenhum evento registrado
          </h3>

          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
            Os acontecimentos registrados para este caso aparecerão aqui em ordem cronológica.
          </p>
        </div>
      ) : (
        <div className="p-5 sm:p-6">
          <div className="relative">
            {/* LINHA VERTICAL */}

            <div className="absolute bottom-3 left-[19px] top-3 w-px bg-border" />

            <div className="space-y-5">
              {caseData.events.map(
                (
                  event,
                ) => (
                  <article
                    key={
                      event.id
                    }
                    className="relative grid grid-cols-[40px_minmax(0,1fr)] gap-4"
                  >
                    {/* MARCADOR */}

                    <div className="relative z-10 flex size-10 items-center justify-center rounded-xl border bg-background shadow-sm">
                      <div className="size-2.5 rounded-full bg-primary" />
                    </div>

                    {/* EVENTO */}

                    <div className="min-w-0 rounded-2xl border bg-background px-4 py-4 transition hover:bg-muted/20 hover:shadow-sm sm:px-5">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
                        <div className="flex min-w-0 items-start gap-2.5">
                          <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

                          <h3 className="break-words font-semibold leading-5">
                            {
                              event.title
                            }
                          </h3>
                        </div>

                        <time className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <Clock3 className="size-3.5" />

                          {
                            formatDateTime(
                              event.date,
                            )
                          }
                        </time>
                      </div>

                      {event.content ? (
                        <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-muted-foreground">
                          {
                            event.content
                          }
                        </p>
                      ) : (
                        <p className="mt-3 text-xs text-muted-foreground/70">
                          Evento sem observações adicionais.
                        </p>
                      )}
                    </div>
                  </article>
                ),
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}