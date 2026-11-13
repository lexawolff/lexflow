"use client";

import {
  useState,
} from "react";

import {
  Landmark,
  Plus,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import type {
  OfficeRpvCaseOption,
} from "../types/office-rpv";

import {
  CreateRpvForm,
} from "./create-rpv-form";

type Props = {
  cases:
    OfficeRpvCaseOption[];
};

export function CreateRpvDialog({
  cases,
}: Props) {
  const [
    open,
    setOpen,
  ] =
    useState(false);

  return (
    <Dialog
      open={
        open
      }
      onOpenChange={
        setOpen
      }
    >
      <DialogTrigger
        render={
          <Button>
            <Plus className="mr-2 size-4" />

            Nova requisição
          </Button>
        }
      />

      <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-3xl">
        <div className="border-b bg-violet-50/50 px-6 py-5 dark:bg-violet-950/15">
          <DialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300">
                <Landmark className="size-5" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-violet-700 dark:text-violet-300">
                  Crédito judicial
                </p>

                <DialogTitle>
                  Nova RPV ou precatório
                </DialogTitle>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Cadastre a requisição,
                  acompanhe sua tramitação e
                  controle os honorários
                  vinculados ao crédito.
                </p>
              </div>
            </div>
          </DialogHeader>
        </div>

        <CreateRpvForm
          cases={
            cases
          }
          onCancel={() =>
            setOpen(
              false,
            )
          }
          onSuccess={() =>
            setOpen(
              false,
            )
          }
        />
      </DialogContent>
    </Dialog>
  );
}