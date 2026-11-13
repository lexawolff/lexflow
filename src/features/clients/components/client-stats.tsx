import {
  Briefcase,
  FileText,
  ListTodo,
  Wallet,
} from "lucide-react";

import type {
  LucideIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import type {
  ClientDetails,
} from "../types";

type ClientStatsProps = {
  client:
    ClientDetails;

  canViewAgenda:
    boolean;

  canViewDocuments:
    boolean;

  canViewFinance:
    boolean;
};

type DateLike =
  Date | string;

type StatCard = {
  title:
    string;

  value:
    number | string;

  subtitle:
    string;

  icon:
    LucideIcon;

  cardClass:
    string;

  iconClass:
    string;
};

const TIME_ZONE =
  "America/Sao_Paulo";

function getTodayKey(): string {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        TIME_ZONE,

      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit",
    },
  ).format(
    new Date(),
  );
}

function getDateKey(
  value:
    DateLike,
): string {
  if (
    typeof value ===
    "string"
  ) {
    return value.slice(
      0,
      10,
    );
  }

  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        TIME_ZONE,

      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit",
    },
  ).format(
    value,
  );
}

export function ClientStats({
  client,
  canViewAgenda,
  canViewDocuments,
  canViewFinance,
}: ClientStatsProps) {
  const activeCases =
    client.cases.filter(
      (clientCase) =>
        clientCase.status !==
        "ENCERRADO",
    ).length;

  const cards:
    StatCard[] = [
      {
        title:
          "Casos ativos",

        value:
          activeCases,

        subtitle:
          `${client.cases.length} caso(s) cadastrada(s)`,

        icon:
          Briefcase,

        cardClass:
          "border-slate-200 dark:border-slate-800",

        iconClass:
          "bg-muted text-foreground",
      },
    ];

  if (
    canViewAgenda
  ) {
    const todayKey =
      getTodayKey();

    const overdueTasks =
      client.tasks.filter(
        (task) =>
          getDateKey(
            task.dueDate,
          ) <
          todayKey,
      ).length;

    cards.push({
      title:
        overdueTasks > 0
          ? "Pendências"
          : "Tarefas ativas",

      value:
        client.tasks.length,

      subtitle:
        overdueTasks > 0
          ? `${overdueTasks} vencida(s) exigindo atenção`
          : "Nenhuma tarefa vencida",

      icon:
        ListTodo,

      cardClass:
        overdueTasks > 0
          ? "border-rose-200 bg-rose-50/30 dark:border-rose-900 dark:bg-rose-950/10"
          : "border-amber-200 bg-amber-50/30 dark:border-amber-900 dark:bg-amber-950/10",

      iconClass:
        overdueTasks > 0
          ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
          : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    });
  }

  if (
    canViewDocuments
  ) {
    cards.push({
      title:
        "Documentos",

      value:
        client.documents.length,

      subtitle:
        "Arquivos cadastrados",

      icon:
        FileText,

      cardClass:
        "border-slate-200 dark:border-slate-800",

      iconClass:
        "bg-muted text-muted-foreground",
    });
  }

  if (
    canViewFinance
  ) {
    const receivableAmount =
      client.receivables.reduce(
        (
          total,
          receivable,
        ) =>
          total +
          Number(
            receivable.totalAmount,
          ),
        0,
      );

    cards.push({
      title:
        "Financeiro",

      value:
        receivableAmount.toLocaleString(
          "pt-BR",
          {
            style:
              "currency",

            currency:
              "BRL",
          },
        ),

      subtitle:
        `${client.receivables.length} recebível(is) cadastrado(s)`,

      icon:
        Wallet,

      cardClass:
        "border-emerald-200 bg-emerald-50/30 dark:border-emerald-900 dark:bg-emerald-950/10",

      iconClass:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map(
        (card) => {
          const Icon =
            card.icon;

          return (
            <Card
              key={
                card.title
              }
              className={`transition-all hover:shadow-md ${card.cardClass}`}
            >
              <CardContent className="flex items-center justify-between p-6">
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">
                    {
                      card.title
                    }
                  </p>

                  <p className="mt-2 break-words text-3xl font-bold">
                    {
                      card.value
                    }
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {
                      card.subtitle
                    }
                  </p>
                </div>

                <div
                  className={`ml-4 shrink-0 rounded-xl p-3 ${card.iconClass}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          );
        },
      )}
    </div>
  );
}