import {
  Calendar,
  FileText,
  Home,
  Landmark,
  LayoutDashboard,
  ListTodo,
  Settings,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

export const navigationItems = [
  {
    title: "Central",
    href: "/central",
    icon: Home,
  },
  {
    title: "Trabalho",
    href: "/trabalho",
    icon: LayoutDashboard,
  },
  {
    title: "Casos",
    href: "/casos",
    icon: Landmark,
  },
  {
  title: "Tarefas",
  href: "/tarefas",
  icon: ListTodo,
},
  {
    title: "Pessoas",
    href: "/pessoas",
    icon: Users,
  },
  {
    title: "Financeiro",
    href: "/financeiro",
    icon: Wallet,
  },
  {
    title: "Agenda",
    href: "/agenda",
    icon: Calendar,
  },
  {
    title: "Documentos",
    href: "/documentos",
    icon: FileText,
  },
  {
    title: "IA",
    href: "/ia",
    icon: Sparkles,
  },
  {
    title: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
];