"use client";

import {
  useRouter,
} from "next/navigation";

import {
  useState,
  useTransition,
} from "react";

import {
  AlertTriangle,
  Loader2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  cancelSubscription,
} from "../actions/cancel-subscription";

export function CancelSubscriptionButton({
  accessUntil,
}: {
  // Fim do período já pago, já formatado.
  accessUntil: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirm() {
    setError(null);

    startTransition(async () => {
      const result = await cancelSubscription();

      if (!result.success) {
        setError(result.message);
        return;
      }

      setDone(result.message ?? "Assinatura cancelada.");
      setOpen(false);
      router.refresh();
    });
  }

  if (done) {
    return (
      <p role="status" className="rounded-xl bg-muted/50 px-4 py-3 text-sm">
        {done}
      </p>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center justify-center rounded-lg border border-red-200! px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-900! dark:text-red-300 dark:hover:bg-red-950/20"
      >
        Cancelar assinatura
      </button>

      <Dialog open={open} onOpenChange={(value) => !pending && setOpen(value)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-600" aria-hidden="true" />
              Cancelar a assinatura?
            </DialogTitle>

            <DialogDescription>
              As próximas cobranças deixam de ser geradas.{" "}
              {accessUntil
                ? `Você continua usando o LexFlow normalmente até ${accessUntil}; depois disso, o escritório fica só para consulta.`
                : "Depois disso, o escritório fica só para consulta."}{" "}
              Para voltar, é só assinar de novo.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/20 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={pending}
              className="inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm font-medium transition hover:bg-muted disabled:opacity-60"
            >
              Manter assinatura
            </button>

            <button
              type="button"
              onClick={confirm}
              disabled={pending}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {pending ? "Cancelando..." : "Cancelar assinatura"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
