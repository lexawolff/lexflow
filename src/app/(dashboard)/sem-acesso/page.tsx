import Link from "next/link";

import {
  ShieldX,
} from "lucide-react";

import {
  AppShell,
} from "@/components/app-shell/app-shell";

export default function SemAcessoPage() {
  return (
    <AppShell>
      <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center">
        <div className="w-full rounded-2xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <ShieldX className="size-7" />
          </div>

          <h1 className="mt-5 text-2xl font-bold">
            Acesso não permitido
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Seu perfil não possui permissão para acessar esta área ou executar esta operação.
          </p>

          <Link
            href="/dashboard"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Voltar ao painel
          </Link>
        </div>
      </div>
    </AppShell>
  );
}