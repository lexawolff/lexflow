"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { revealGovPassword } from "../../actions/reveal-gov-password";

type GovTabProps = {
  clientId: string;
  govLogin: string | null;
  hasGovPassword: boolean;
};

export function GovTab({
  clientId,
  govLogin,
  hasGovPassword,
}: GovTabProps) {
  const [password, setPassword] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<"login" | "password" | null>(null);

  async function handleTogglePassword() {
    if (visible) {
      setVisible(false);
      return;
    }

    if (!password) {
      setLoading(true);

      try {
        const decryptedPassword = await revealGovPassword(clientId);
        setPassword(decryptedPassword);
      } finally {
        setLoading(false);
      }
    }

    setVisible(true);
  }

  async function copyValue(
    value: string | null,
    type: "login" | "password"
  ) {
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(type);

    window.setTimeout(() => setCopied(null), 1500);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credenciais Gov.br</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Login
            </p>

            <div className="mt-2 flex items-center gap-2">
              <p className="rounded-lg border bg-muted px-3 py-2 text-sm">
                {govLogin || "Não informado"}
              </p>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!govLogin}
                onClick={() => copyValue(govLogin, "login")}
              >
                {copied === "login" ? <Check /> : <Copy />}
              </Button>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Senha
            </p>

            <div className="mt-2 flex items-center gap-2">
              <p className="min-w-40 rounded-lg border bg-muted px-3 py-2 text-sm font-mono">
                {!hasGovPassword
                  ? "Não informada"
                  : visible
                    ? password || "Não informada"
                    : "••••••••••••"}
              </p>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!hasGovPassword || loading}
                onClick={handleTogglePassword}
              >
                {visible ? <EyeOff /> : <Eye />}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={!password}
                onClick={() => copyValue(password, "password")}
              >
                {copied === "password" ? <Check /> : <Copy />}
              </Button>
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            window.open("https://meu.inss.gov.br/", "_blank", "noopener,noreferrer")
          }
        >
          <ExternalLink className="mr-2" />
          Abrir Meu INSS
        </Button>
      </CardContent>
    </Card>
  );
}