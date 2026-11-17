import Link from "next/link";

import {
  House,
  SearchX,
} from "lucide-react";

import {
  buttonVariants,
} from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <SearchX
            className="size-6"
            aria-hidden="true"
          />
        </div>

        <h1 className="mt-4 text-xl font-semibold">
          Página não encontrada
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          O endereço pode estar incorreto ou o registro foi removido.
        </p>

        <div className="mt-6 flex justify-center">
          <Link
            href="/dashboard"
            className={buttonVariants()}
          >
            <House
              className="mr-2 size-4"
              aria-hidden="true"
            />
            Ir para o início
          </Link>
        </div>
      </div>
    </main>
  );
}
