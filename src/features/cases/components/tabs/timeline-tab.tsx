import { formatDateTime } from "@/lib/format/date";

import type { CaseDetails } from "../../types";

type Props = {
  caseData: CaseDetails;
};

export function TimelineTab({ caseData }: Props) {
  if (caseData.events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhum evento registrado nesta demanda.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <h2 className="mb-6 text-lg font-semibold">
        Histórico da Demanda
      </h2>

      <div className="relative space-y-8">
        <div className="absolute bottom-2 left-[7px] top-2 w-px bg-border" />

        {caseData.events.map((event) => (
          <div
            key={event.id}
            className="relative grid grid-cols-[16px_1fr] gap-4"
          >
            <div className="relative z-10 mt-1 h-4 w-4 rounded-full border-4 border-background bg-primary" />

            <div className="min-w-0 rounded-xl border bg-background p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <h3 className="font-medium">
                  {event.title}
                </h3>

                <time className="shrink-0 text-sm text-muted-foreground">
                  {formatDateTime(event.date)}
                </time>
              </div>

              {event.content && (
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                  {event.content}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}