"use client";

import { ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
} as const;

type FormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title: string;
  description?: string;

  size?: keyof typeof sizes;

  className?: string;

  children: ReactNode;
};

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  size = "md",
  className,
  children,
}: FormDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />

        <Dialog.Popup
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border bg-background shadow-xl",
            sizes[size],
            className
          )}
        >
          <div className="flex items-start justify-between border-b px-6 py-5">
            <div>
              <Dialog.Title className="text-lg font-semibold">
                {title}
              </Dialog.Title>

              {description && (
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  {description}
                </Dialog.Description>
              )}
            </div>

            <Dialog.Close className="rounded-md p-2 transition hover:bg-muted">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div className="p-6">{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}