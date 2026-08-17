"use client";

import {
  useState,
} from "react";

import {
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { CreatePayableForm } from "./create-payable-form";

export function CreatePayableDialog() {
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

            Nova conta
          </Button>
        }
      />

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Nova conta a pagar
          </DialogTitle>
        </DialogHeader>

        <CreatePayableForm
          onCancel={() =>
            setOpen(false)
          }
          onSuccess={() =>
            setOpen(false)
          }
        />
      </DialogContent>
    </Dialog>
  );
}