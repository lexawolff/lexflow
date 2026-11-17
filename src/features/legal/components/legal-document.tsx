import type {
  ReactNode,
} from "react";

import Link from "next/link";

import {
  Scale,
  TriangleAlert,
} from "lucide-react";

import {
  isLegalInfoComplete,
  LEGAL_UPDATED_AT,
  LEGAL_VERSION,
} from "../legal-info";

type LegalDocumentProps = {
  title: string;
  children: ReactNode;
};

export function LegalDocument({
  title,
  children,
}: LegalDocumentProps) {
  const complete = isLegalInfoComplete();

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10 sm:px-6">
      <article className="mx-auto w-full max-w-3xl rounded-3xl border bg-card p-6 shadow-sm sm:p-10">
        <header className="border-b pb-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <Scale className="size-4" />
            LexFlow
          </Link>

          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            {title}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Versão {LEGAL_VERSION} · Atualizado em {LEGAL_UPDATED_AT}
          </p>

          <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link
              href="/termos"
              className="font-medium text-primary hover:underline"
            >
              Termos de Uso
            </Link>

            <Link
              href="/termos#anexo-tratamento"
              className="font-medium text-primary hover:underline"
            >
              Anexo de Tratamento de Dados
            </Link>

            <Link
              href="/privacidade"
              className="font-medium text-primary hover:underline"
            >
              Política de Privacidade
            </Link>
          </nav>
        </header>

        {!complete ? (
          <div
            role="note"
            className="mt-6 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <p>
              <strong>Minuta em revisão.</strong> Os campos entre colchetes
              precisam ser preenchidos em src/features/legal/legal-info.ts e o
              texto deve ser revisado antes da publicação. Enquanto isso, o
              cadastro público não abre em produção.
            </p>
          </div>
        ) : null}

        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-foreground/90">
          {children}
        </div>
      </article>
    </main>
  );
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-6 space-y-3"
    >
      <h2 className="text-lg font-semibold text-foreground">
        {title}
      </h2>

      {children}
    </section>
  );
}

export function LegalList({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {children}
    </ul>
  );
}

/*
 * Destaca valores ainda não preenchidos (entre colchetes).
 */
export function Fill({
  value,
}: {
  value: string;
}) {
  if (!value.trim().startsWith("[")) {
    return <>{value}</>;
  }

  return (
    <mark className="rounded bg-amber-200/70 px-1 text-amber-950 dark:bg-amber-500/30 dark:text-amber-100">
      {value}
    </mark>
  );
}
