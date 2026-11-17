import type {
  ReactNode,
} from "react";

type AuthCardProps = {
  icon: ReactNode;
  title: string;
  description?: ReactNode;
  children: ReactNode;
};

/*
 * Moldura das telas públicas de acesso (convite, recuperação de
 * senha), no mesmo visual da configuração inicial.
 */
export function AuthCard({
  icon,
  title,
  description,
  children,
}: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-lg rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">
          {title}
        </h1>

        {description ? (
          <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {description}
          </div>
        ) : null}

        <div className="mt-8">
          {children}
        </div>
      </div>
    </main>
  );
}
