import { AppShell } from "@/components/app-shell/app-shell";
import { ClientForm } from "@/features/clients/components/client-form";

export default function NovoClientePage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Novo Cliente</h1>
          <p className="mt-2 text-muted-foreground">
            Cadastre um novo cliente no sistema.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <ClientForm />
        </div>
      </div>
    </AppShell>
  );
}