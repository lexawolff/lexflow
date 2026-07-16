"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";
import { deleteClient } from "../actions/delete-client";

type DeleteClientButtonProps = {
  clientId: string;
};

export function DeleteClientButton({
  clientId,
}: DeleteClientButtonProps) {
  return (
    <AlertDialog>
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
          <AlertDialogCancel>
            Cancelar
          </AlertDialogCancel>

          <form action={deleteClient.bind(null, clientId)}>
            <Button
              type="submit"
              variant="destructive"
            >
              Excluir Cliente
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}