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
    <div className="overflow-x-auto border-b">
      <nav
        className="flex min-w-max gap-1"
        aria-label="Navegação financeira"
      >
        {items.map(
          (item) => {
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
                className={`relative inline-flex h-11 items-center gap-2 px-4 text-sm font-medium transition ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-4" />

                {
                  item.title
                }

                {isActive ? (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />
                ) : null}
              </Link>
            );
          },
        )}
      </nav>
    </div>
  );
}