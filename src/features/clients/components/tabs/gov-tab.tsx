"use client";

import { usePathname } from "next/navigation";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

import {
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  revealGovPassword,
} from "../../actions/reveal-gov-password";

type GovTabProps = {
  clientId:
    string;

  govLogin:
    string | null;

  hasGovPassword:
    boolean;
};

export function GovTab({
  clientId,
  govLogin,
  hasGovPassword,
}: GovTabProps) {
  const [password, setPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<"login" | "password" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLElement | null>(null);
  const mountedRef = useRef(false);
  const generationRef = useRef(0);
  const busyRef = useRef(false);
  const deadlineRef = useRef(0);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();
  const visible = password !== null;

  const clearSensitive = useCallback(() => {
    generationRef.current += 1;
    busyRef.current = false;
    deadlineRef.current = 0;
    if (clearTimerRef.current !== null) clearTimeout(clearTimerRef.current);
    if (copiedTimerRef.current !== null) clearTimeout(copiedTimerRef.current);
    clearTimerRef.current = null;
    copiedTimerRef.current = null;
    setPassword(null);
    setLoading(false);
    setCopied(null);
    setError(null);
  }, []);

  const isActive = useCallback(() => {
    const panel = rootRef.current?.closest('[role="tabpanel"]');
    return mountedRef.current && document.visibilityState === "visible" &&
      document.hasFocus() && (!panel ||
        (!panel.hasAttribute("hidden") && panel.getAttribute("data-state") !== "inactive"));
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    clearSensitive();
    const onVisibility = () => {
      if (document.visibilityState !== "visible") clearSensitive();
    };
    // Algumas implementações de abas ocultam o painel sem desmontá-lo.
    const panel = rootRef.current?.closest('[role="tabpanel"]');
    const observer = new MutationObserver(() => {
      if (!isActive()) clearSensitive();
    });
    if (panel) observer.observe(panel, {
      attributes: true, attributeFilter: ["hidden", "data-state"],
    });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", clearSensitive);
    window.addEventListener("pagehide", clearSensitive);
    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
      busyRef.current = false;
      deadlineRef.current = 0;
      if (clearTimerRef.current !== null) clearTimeout(clearTimerRef.current);
      if (copiedTimerRef.current !== null) clearTimeout(copiedTimerRef.current);
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", clearSensitive);
      window.removeEventListener("pagehide", clearSensitive);
    };
  }, [clientId, hasGovPassword, pathname, clearSensitive, isActive]);

  function showCopied(type: "login" | "password") {
    if (copiedTimerRef.current !== null) clearTimeout(copiedTimerRef.current);
    setCopied(type);
    copiedTimerRef.current = setTimeout(() => setCopied(null), 1500);
  }

  async function handlePassword(mode: "reveal" | "copy") {
    if (mode === "reveal" && visible) {
      clearSensitive();
      return;
    }
    if (!hasGovPassword || busyRef.current || !isActive()) return;
    clearSensitive();
    const generation = generationRef.current;
    busyRef.current = true;
    setLoading(true);
    deadlineRef.current = Date.now() + 30_000;
    clearTimerRef.current = setTimeout(clearSensitive, 30_000);
    const stillCurrent = () => generation === generationRef.current &&
      isActive() && Date.now() < deadlineRef.current;
    let value: string | null = null;
    try {
      // Revalida permissão e escritório inclusive para copiar uma senha visível.
      value = await revealGovPassword(clientId);
      if (!stillCurrent()) return;
      if (value === null || value === "") {
        setError("Não há senha cadastrada para este cliente.");
        return;
      }
      if (mode === "copy") {
        if (!navigator.clipboard?.writeText) throw new Error("Clipboard indisponível");
        await navigator.clipboard.writeText(value);
        if (stillCurrent()) showCopied("password");
      } else {
        setPassword(value);
        // O prazo de exibição começa quando a resposta chega.
        if (clearTimerRef.current !== null) clearTimeout(clearTimerRef.current);
        deadlineRef.current = Date.now() + 30_000;
        clearTimerRef.current = setTimeout(clearSensitive, 30_000);
      }
    } catch {
      if (stillCurrent()) {
        setError(mode === "copy"
          ? "Não foi possível copiar a senha. Verifique sua sessão e a permissão de cópia do navegador."
          : "Não foi possível revelar a senha. Verifique sua sessão e tente novamente.");
      }
    } finally {
      value = null;
      if (generation === generationRef.current && mountedRef.current) {
        busyRef.current = false;
        setLoading(false);
      }
    }
  }

  async function copyLogin() {
    if (!govLogin || !isActive()) return;
    const generation = generationRef.current;
    setError(null);
    try {
      await navigator.clipboard.writeText(govLogin);
      if (generation === generationRef.current && isActive()) showCopied("login");
    } catch {
      if (generation === generationRef.current && isActive()) {
        setError("Não foi possível copiar o login. Verifique a permissão de cópia do navegador.");
      }
    }
  }

  return (
    <section ref={rootRef} className="overflow-hidden rounded-2xl border border-amber-200 bg-card shadow-sm dark:border-amber-900">
      {/* ==========================
          CABEÇALHO
      ========================== */}

      <div className="border-b border-amber-200 bg-amber-50/40 px-5 py-4 dark:border-amber-900 dark:bg-amber-950/10 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
            <KeyRound className="size-5" />
          </div>

          <div className="min-w-0">
            <h2 className="font-semibold">
              Acesso Gov.br
            </h2>

            <p className="mt-0.5 text-sm text-muted-foreground">
              Credenciais cadastradas para acesso aos serviços digitais do cliente.
            </p>
          </div>
        </div>
      </div>

      {/* ==========================
          AVISO DE SEGURANÇA
      ========================== */}

      <div className="border-b px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/20">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-300" />

          <div>
            <p className="text-sm font-medium text-amber-950 dark:text-amber-100">
              Credenciais protegidas
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-900/80 dark:text-amber-200/80">
              A senha revelada é ocultada após 30 segundos ou ao sair desta área.
              Utilize estas informações apenas quando necessárias para o atendimento.
            </p>
          </div>
        </div>
      </div>

      {/* ==========================
          CREDENCIAIS
      ========================== */}

      <div className="space-y-6 p-5 sm:p-6">
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <div className="grid gap-4 md:grid-cols-2">
          {/* ==========================
              LOGIN
          ========================== */}

          <div className="rounded-2xl border bg-background p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <UserRound className="size-4" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Login
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Usuário utilizado no Gov.br
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div className="min-w-0 flex-1 rounded-xl border bg-muted/30 px-3.5 py-2.5">
                <p
                  className={
                    govLogin
                      ? "break-all text-sm font-medium"
                      : "text-sm text-muted-foreground"
                  }
                >
                  {govLogin ||
                    "Não informado"}
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={
                  !govLogin
                }
                onClick={copyLogin}
                aria-label="Copiar login"
                title="Copiar login"
              >
                {copied ===
                "login" ? (
                  <Check className="size-4 text-emerald-600" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>

            {copied ===
            "login" ? (
              <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Login copiado.
              </p>
            ) : null}
          </div>

          {/* ==========================
              SENHA
          ========================== */}

          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/20 p-4 dark:border-amber-900/80 dark:bg-amber-950/10 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                <LockKeyhole className="size-4" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Senha
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Informação protegida
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div className="min-w-0 flex-1 rounded-xl border bg-background px-3.5 py-2.5">
                <p
                  className={
                    hasGovPassword
                      ? "break-all font-mono text-sm font-medium"
                      : "text-sm text-muted-foreground"
                  }
                >
                  {!hasGovPassword
                    ? "Não informada"
                    : loading
                      ? "Carregando..."
                      : visible
                        ? password ||
                          "Não informada"
                        : "••••••••••••"}
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={
                  !hasGovPassword ||
                  loading
                }
                onClick={
                  () => handlePassword("reveal")
                }
                aria-label={
                  visible
                    ? "Ocultar senha"
                    : "Mostrar senha"
                }
                title={
                  visible
                    ? "Ocultar senha"
                    : "Mostrar senha"
                }
              >
                {visible ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!hasGovPassword || loading}
                onClick={() => handlePassword("copy")}
                aria-label="Copiar senha"
                title="Copiar senha"
              >
                {copied ===
                "password" ? (
                  <Check className="size-4 text-emerald-600" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>

            {copied ===
            "password" ? (
              <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Senha copiada.
              </p>
            ) : null}
          </div>
        </div>

        {/* ==========================
            ACESSO EXTERNO
        ========================== */}

        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">
              Serviços previdenciários
            </p>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Acesse o portal Meu INSS em uma nova aba.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              window.open(
                "https://meu.inss.gov.br/",
                "_blank",
                "noopener,noreferrer",
              )
            }
            className="shrink-0"
          >
            <ExternalLink className="mr-2 size-4" />

            Abrir Meu INSS
          </Button>
        </div>
      </div>
    </section>
  );
}
