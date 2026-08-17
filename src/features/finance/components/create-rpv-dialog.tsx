"use client";

import {
  useState,
} from "react";

import {
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
      open={open}
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

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Nova RPV ou precatório
          </DialogTitle>
        </DialogHeader>

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