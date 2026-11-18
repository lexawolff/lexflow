import type {
  ReactNode,
} from "react";

import {
  Scale,
} from "lucide-react";

type AuthSplitLayoutProps = {
  headline: string;
  description: string;
  // Conteúdo extra do painel escuro (só aparece em telas grandes).
  panelContent?: ReactNode;
  panelFooter?: ReactNode;
  contentClassName?: string;
  children: ReactNode;
};

/*
 * Moldura em duas colunas das telas de entrada (login e cadastro).
 * O painel fica fixo enquanto um formulário mais longo rola.
 */
export function AuthSplitLayout({
  headline,
  description,
  panelContent,
  panelFooter = "LexFlow",
  contentClassName = "max-w-md",
  children,
}: AuthSplitLayoutProps) {
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-2">
      <section className="hidden bg-slate-950 p-12 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-white/10">
            <Scale className="size-6" />
          </div>

          <div>
            <p className="text-xl font-semibold">
              LexFlow
            </p>

            <p className="text-sm text-slate-400">
              Gestão Jurídica
            </p>
          </div>
        </div>

        <div className="max-w-xl">
          <p className="text-4xl font-semibold leading-tight">
            {headline}
          </p>

          <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-400">
            {description}
          </p>

          {panelContent}
        </div>

        <div className="text-xs text-slate-500">
          {panelFooter}
        </div>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className={`w-full ${contentClassName}`}>
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Scale className="size-5" />
              </div>

              <div>
                <p className="text-xl font-semibold">
                  LexFlow
                </p>

                <p className="text-xs text-muted-foreground">
                  Gestão Jurídica
                </p>
              </div>
            </div>
          </div>

          {children}
        </div>
      </section>
    </main>
  );
}
