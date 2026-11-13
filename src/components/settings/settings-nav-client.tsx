"use client";

import Link from "next/link";

import {
  Blocks,
  Building2,
  CreditCard,
  Settings2,
  SlidersHorizontal,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  usePathname,
} from "next/navigation";

type Props = {
  canManageOffice: boolean;
  canManageTeam: boolean;
  canManageBilling: boolean;
};

export function SettingsNavClient({
  canManageOffice,
  canManageTeam,
  canManageBilling,
}: Props) {
  const pathname =
    usePathname();

  const items = [
    {
      href:
        "/configuracoes",
      label:
        "Visão geral",
      icon:
        Settings2,
      visible:
        true,
    },
    {
      href:
        "/configuracoes/perfil",
      label:
        "Perfil e conta",
      icon:
        UserRound,
      visible:
        true,
    },
    {
      href:
        "/configuracoes/escritorio",
      label:
        "Escritório",
      icon:
        Building2,
      visible:
        canManageOffice,
    },
    {
      href:
        "/configuracoes/equipe",
      label:
        "Equipe",
      icon:
        UsersRound,
      visible:
        canManageTeam,
    },
    {
      href:
        "/configuracoes/integracoes",
      label:
        "Integrações",
      icon:
        Blocks,
      visible:
        true,
    },
    {
      href:
        "/configuracoes/preferencias",
      label:
        "Preferências",
      icon:
        SlidersHorizontal,
      visible:
        true,
    },
    {
      href:
        "/configuracoes/assinatura",
      label:
        "Assinatura",
      icon:
        CreditCard,
      visible:
        canManageBilling,
    },
  ];

  return (
    <nav
      className="flex flex-wrap gap-2"
      aria-label="Navegação das configurações"
    >
      {items
        .filter(
          (item) =>
            item.visible,
        )
        .map(
          (item) => {
            const Icon =
              item.icon;

            const active =
              item.href ===
              "/configuracoes"
                ? pathname ===
                  item.href
                : pathname.startsWith(
                    item.href,
                  );

            return (
              <Link
                key={
                  item.href
                }
                href={
                  item.href
                }
                className={[
                  "inline-flex h-10 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition",
                  active
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                ].join(
                  " ",
                )}
              >
                <Icon className="size-4" />

                {
                  item.label
                }
              </Link>
            );
          },
        )}
    </nav>
  );
}