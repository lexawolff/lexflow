import Link from "next/link";

import { ClientDetails } from "@/features/clients/types";
import { formatDate } from "@/lib/format/date";

import { CaseStatusBadge } from "./case-status-badge";
import { PracticeAreaBadge } from "./practice-area-badge";

type ClientCasesListProps = {
  clientId: string;
  cases: ClientDetails["cases"];
};

export function ClientCasesList({
  clientId,
  cases,
}: ClientCasesListProps) {
  if (cases.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center">
        <p className="text-sm text-muted-foreground">
          Este cliente ainda não possui demandas cadastradas.
        </p>

        <Link
          href={`/clientes/${clientId}/casos/novo`}
          className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Nova Demanda
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cases.map((item) => (
        <Link
          key={item.id}
          href={`/clientes/${clientId}/casos/${item.id}`}
          className="block rounded-xl border bg-card p-5 transition hover:border-primary hover:shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-3">
              <div className="space-y-1">
                <h3 className="font-semibold">
                  {item.title}
                </h3>

                <PracticeAreaBadge area={item.practiceArea} />
              </div>

              <div className="space-y-1">
                {item.number && (
                  <p className="text-sm">
                    Processo: {item.number}
                  </p>
                )}

                {!item.number && item.administrativeNumber && (
                  <p className="text-sm">
                    NB: {item.administrativeNumber}
                  </p>
                )}

                {item.nextDeadline && (
                  <p className="text-sm text-muted-foreground">
                    Próximo prazo: {formatDate(item.nextDeadline)}
                  </p>
                )}
              </div>
            </div>

            <div className="shrink-0">
              <CaseStatusBadge status={item.status} />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}