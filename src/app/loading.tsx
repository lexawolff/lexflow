import {
  LoaderCircle,
} from "lucide-react";

/*
 * Exibido enquanto a próxima página
 * carrega no servidor, para o usuário
 * não ficar sem resposta ao clicar.
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted-foreground"
    >
      <LoaderCircle
        className="size-8 animate-spin"
        aria-hidden="true"
      />

      <span className="text-sm">
        Carregando…
      </span>
    </div>
  );
}
