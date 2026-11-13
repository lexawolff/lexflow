"use client";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

import {
  ArrowDownToLine,
  ArrowRightLeft,
  ArrowUpFromLine,
  Banknote,
  LayoutDashboard,
} from "lucide-react";

const items = [
  {
    title:
      "Visão geral",

    href:
      "/financeiro",

    icon:
      LayoutDashboard,
  },

  {
    title:
      "Recebimentos",

    href:
      "/financeiro/recebimentos",

    icon:
      ArrowDownToLine,
  },

  {
    title:
      "Contas a pagar",

    href:
      "/financeiro/contas-a-pagar",

    icon:
      ArrowUpFromLine,
  },

  {
    title:
      "Fluxo de caixa",

    href:
      "/financeiro/fluxo-de-caixa",

    icon:
      ArrowRightLeft,
  },

  {
    title:
      "RPVs e Precatórios",

    href:
      "/financeiro/rpvs-e-precatorios",

    icon:
      Banknote,
  },
];

export function FinanceNavigation() {
  const pathname =
    usePathname();

  return (
    <div className="overflow-x-auto">
      <nav
        className="flex min-w-max gap-1.5"
        aria-label="Navegação financeira"
      >
        {items.map(
          (
            item,
          ) => {
            const Icon =
              item.icon;

            const isActive =
              item.href ===
              "/financeiro"
                ? pathname ===
                  "/financeiro"
                : pathname ===
                    item.href ||
                  pathname.startsWith(
                    `${item.href}/`,
                  );

            return (
              <Link
                key={
                  item.href
                }
                href={
                  item.href
                }
                aria-current={
                  isActive
                    ? "page"
                    : undefined
                }
                className={`inline-flex h-9 items-center gap-2 rounded-xl px-3.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
                }`}
              >
                <Icon
                  className={`size-4 ${
                    isActive
                      ? getActiveIconClass(
                          item.href,
                        )
                      : ""
                  }`}
                />

                {
                  item.title
                }
              </Link>
            );
          },
        )}
      </nav>
    </div>
  );
}

function getActiveIconClass(
  href:
    string,
): string {
  switch (
    href
  ) {
    case "/financeiro/recebimentos":
      return "text-emerald-600 dark:text-emerald-400";

    case "/financeiro/contas-a-pagar":
      return "text-rose-600 dark:text-rose-400";

    case "/financeiro/fluxo-de-caixa":
      return "text-blue-600 dark:text-blue-400";

    case "/financeiro/rpvs-e-precatorios":
      return "text-violet-600 dark:text-violet-400";

    default:
      return "text-primary";
  }
}