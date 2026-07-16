import {
  Briefcase,
  FileText,
  ListTodo,
  Wallet,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { ClientDetails } from "../types";

type ClientStatsProps = {
  client: ClientDetails;
};

export function ClientStats({ client }: ClientStatsProps) {
  const receivableAmount = client.receivables.reduce(
    (total, receivable) => total + Number(receivable.totalAmount),
    0
  );

  const cards = [
    {
      title: "Casos",
      value: client.cases.length,
      subtitle: "Demandas cadastradas",
      icon: Briefcase,
    },
    {
      title: "Tarefas",
      value: client.tasks.length,
      subtitle: "Pendentes",
      icon: ListTodo,
    },
    {
      title: "Documentos",
      value: client.documents.length,
      subtitle: "Arquivos",
      icon: FileText,
    },
    {
      title: "Financeiro",
      value: receivableAmount.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
      subtitle: `${client.receivables.length} recebível(is)`,
      icon: Wallet,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card
            key={card.title}
            className="transition-all hover:shadow-md"
          >
            <CardContent className="flex items-center justify-between p-6">
              <div>
                <p className="text-sm text-muted-foreground">
                  {card.title}
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {card.value}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {card.subtitle}
                </p>
              </div>

              <div className="rounded-xl bg-primary/10 p-3">
                <Icon className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}