"use client";

import {
  useEffect,
} from "react";

import Link from "next/link";

import {
  House,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";

import {
  Button,
  buttonVariants,
} from "@/components/ui/button";

type ErrorPageProps = {
  error: Error & {
    digest?: string;
  };

  reset: () => void;
};

/*
 * Captura erros de qualquer página
 * abaixo do layout raiz. Em produção a
 * mensagem original não é exibida (o
 * Next a oculta); mostramos o código
 * (digest) para localizar o erro no log.
 */
export default function ErrorPage({
  error,
  reset,
}: ErrorPageProps) {
  useEffect(() => {
    console.error(
      error,
    );
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <TriangleAlert
            className="size-6"
            aria-hidden="true"
          />
        </div>

        <h1 className="mt-4 text-xl font-semibold">
          Algo deu errado
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Não foi possível carregar esta tela. Tente novamente; se o problema
          continuar, volte ao início e repita a operação.
        </p>

        {error.digest ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Código do erro:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">
              {error.digest}
            </code>
          </p>
        ) : null}

        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button
            type="button"
            onClick={reset}
          >
            <RotateCcw
              className="mr-2 size-4"
              aria-hidden="true"
            />
            Tentar novamente
          </Button>

          <Link
            href="/dashboard"
            className={buttonVariants({
              variant: "outline",
            })}
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
