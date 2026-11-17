"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { notifyActionFailure } from "@/lib/actions/action-feedback";
import { deleteClient } from "../actions/delete-client";

type DeleteClientButtonProps = {
  clientId: string;
};

export function DeleteClientButton({
  clientId,
}: DeleteClientButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      /*
       * Em caso de sucesso a action
       * redireciona para /clientes.
       *
       * Se o cliente tiver vínculos,
       * a action devolve a falha e
       * mostramos o motivo sem derrubar
       * a página.
       */
      const result = await deleteClient(clientId);

      if (notifyActionFailure(result)) {
        setOpen(false);
      }
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isPending) {
          setOpen(nextOpen);
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          Excluir
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Excluir cliente?
          </AlertDialogTitle>

          <AlertDialogDescription>
            Esta ação é permanente.
            Caso existam casos, documentos, tarefas, eventos ou registros
            financeiros vinculados, a exclusão será bloqueada.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            Cancelar
          </AlertDialogCancel>

          <Button
            type="button"
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
          >
            {isPending ? "Excluindo…" : "Excluir Cliente"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
