"use client";

import { useState, useTransition } from "react";
import {
  Download,
  Eye,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";

import { deleteDocument } from "../actions/delete-document";
import { getDocumentDownloadUrl } from "../actions/get-document-download-url";

type DocumentActionsProps = {
  documentId: string;
};

export function DocumentActions({
  documentId,
}: DocumentActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function handleView() {
    startTransition(async () => {
      const result = await getDocumentDownloadUrl(documentId);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      window.open(
        result.data,
        "_blank",
        "noopener,noreferrer"
      );
    });
  }

  function handleDownload() {
    startTransition(async () => {
      const result = await getDocumentDownloadUrl(documentId);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      const link = document.createElement("a");
      link.href = result.data;
      link.download = "";
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteDocument(documentId);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setOpen(false);
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={isPending}
          className={cn(
            buttonVariants({
              variant: "ghost",
              size: "icon",
            })
          )}
        >
          <MoreVertical className="h-4 w-4" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={handleView}
            disabled={isPending}
          >
            <Eye className="mr-2 h-4 w-4" />
            Visualizar
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleDownload}
            disabled={isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setOpen(true)}
            disabled={isPending}
            variant="destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={open}
        onOpenChange={setOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir documento
            </AlertDialogTitle>

            <AlertDialogDescription>
              Tem certeza que deseja excluir este documento?
              <br />
              Esta ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              Cancelar
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}