import {
  Calendar,
  House,
  Landmark,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type {
  Permission,
} from "@/lib/permissions";

type NavigationItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
};

export const navigationItems:
  NavigationItem[] = [
    {
      title: "Painel",
      href: "/dashboard",
      icon: House,
    },
    {
      title: "Agenda",
      href: "/agenda",
      icon: Calendar,
      permission: "AGENDA_VIEW",
    },
    {
      title: "Trabalho",
      href: "/trabalho",
      icon: LayoutDashboard,
      permission: "WORK_VIEW",
    },
    {
      title: "Clientes",
      href: "/clientes",
      icon: Users,
      permission: "CLIENT_VIEW",
    },
    {
      title: "Casos",
      href: "/casos",
      icon: Landmark,
      permission: "CASE_VIEW",
    },
    {
      title: "Financeiro",
      href: "/financeiro",
      icon: Wallet,
      permission: "FINANCE_VIEW",
    },
    {
      title: "Configurações",
      href: "/configuracoes",
      icon: Settings,
    },
  ];