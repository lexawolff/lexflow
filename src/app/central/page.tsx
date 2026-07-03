import { AppShell } from "@/components/app-shell/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CentralPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <section>
          <p className="text-sm text-muted-foreground">
            Quinta-feira, 02 de julho
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Bom dia, Lívia.
          </h1>
          <p className="mt-2 text-muted-foreground">
            Você tem 3 prioridades hoje. Vamos começar pelo mais importante.
          </p>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Próximo trabalho</CardTitle>
                <Badge>Prioridade alta</Badge>
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-sm text-muted-foreground">
                Auxílio por incapacidade
              </p>
              <h2 className="mt-1 text-2xl font-semibold">
                Elaborar inicial da Maria
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Tempo estimado: 45 minutos • Parado há 6 dias
              </p>

              <Button className="mt-5">Começar agora</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Urgências</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <p>⚠️ Manifestação vence amanhã</p>
              <p>🟡 Benefício pode ser prorrogado em 3 dias</p>
              <p>📄 2 clientes aguardam documentos</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Fila de trabalho</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>1. Manifestação João — 25 min</p>
              <p>2. Recurso José — 1h15</p>
              <p>3. Cobrança Carlos — 10 min</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hoje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>Audiência às 14h</p>
              <p>Perícia às 16h</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financeiro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>Receber hoje: R$ 2.300</p>
              <p>Receber este mês: R$ 18.200</p>
              <p>Contas a pagar: R$ 2.150</p>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}