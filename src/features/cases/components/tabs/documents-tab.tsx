import Link from "next/link";

import { formatDate } from "@/lib/format/date";

import type { CaseDetails } from "../../types";

type Props = {
  caseData: CaseDetails;
};

export function DocumentsTab({
  caseData,
}: Props) {
  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Documentos
        </h2>

        <button
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Enviar Documento
        </button>
      </div>

      {caseData.documents.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhum documento foi anexado.
          </p>
        </div>
      ) : (
        <div className="space-y-3">

          {caseData.documents.map((document) => (
            <div
              key={document.id}
              className="flex items-center justify-between rounded-xl border bg-card p-4"
            >
              <div className="space-y-1">
                <p className="font-medium">
                  {document.name}
                </p>

                <div className="flex gap-3 text-sm text-muted-foreground">

                  <span>
                    {document.category ?? "Sem categoria"}
                  </span>

                  <span>
                    {formatDate(document.createdAt)}
                  </span>

                </div>
              </div>

              <Link
                href={document.fileUrl}
                target="_blank"
                className="text-sm font-medium text-primary hover:underline"
              >
                Abrir
              </Link>
            </div>
          ))}

        </div>
      )}
    </div>
  );
}