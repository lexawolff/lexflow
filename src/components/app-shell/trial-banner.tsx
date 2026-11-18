import Link from "next/link";

import {
  LockKeyhole,
} from "lucide-react";

import {
  getCurrentWorkspaceAccess,
} from "@/lib/permissions";

export function TrialEndedBanner() {
  return (
    <div
      role="status"
      className="flex flex-col gap-3 border-b border-amber-200! bg-amber-50 px-4 py-3 text-amber-900 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-amber-900! dark:bg-amber-950/30 dark:text-amber-200"
    >
      <div className="flex min-w-0 items-start gap-2.5 text-sm">
        <LockKeyhole
          className="mt-0.5 size-4 shrink-0"
          aria-hidden="true"
        />

        <p>
          <strong className="font-semibold">
            Seu teste grátis terminou.
          </strong>{" "}
          Seus dados continuam disponíveis só para consulta.
        </p>
      </div>

      <Link
        href="/assinar"
        className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-primary px-6 text-sm font-bold tracking-wide text-primary-foreground transition hover:bg-primary/90"
      >
        ASSINE
      </Link>
    </div>
  );
}

export async function TrialBanner() {
  const {
    readOnly,
  } =
    await getCurrentWorkspaceAccess();

  return readOnly ? <TrialEndedBanner /> : null;
}
