import type { Document } from "@prisma/client";
import { formatFileSize } from "@/lib/utils/format-file-size";
import { DocumentActions } from "./document-actions";
import { getDocumentIcon } from "../utils/get-document-icon";
import { Badge } from "@/components/ui/badge";
import { formatDocumentCategory } from "../utils/format-document-category";
import { formatDate } from "@/lib/utils/format-date";

type DocumentListProps = {
  documents: Document[];
};

export function DocumentList({
  documents,
}: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
        Nenhum documento cadastrado.
      </div>
    );
  }

  return (
    <div className="divide-y rounded-lg border">
      {documents.map((document) => {
        const Icon = getDocumentIcon(document.fileType ?? "");

        return (
          <div
            key={document.id}
            className="flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-muted-foreground" />

              <div>
                <p className="font-medium">
                  {document.originalName}
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary">
                    {formatDocumentCategory(document.category ?? "")}
                  </Badge>

                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(document.size)}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    {formatDate(document.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <DocumentActions documentId={document.id} />
          </div>
        );
      })}
    </div>
  );
}