"use client";

import Link from "next/link";

import {
  ChevronDown,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserMenuProps = {
  name: string;
};

function getInitials(
  name: string,
) {
  const parts =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

export function UserMenu({
  name,
}: UserMenuProps) {
  const initials =
    getInitials(
      name,
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="hidden max-w-40 text-left sm:block">
          <p className="truncate text-sm font-medium">
            {name}
          </p>

          <p className="text-xs text-muted-foreground">
            Minha conta
          </p>
        </div>

        <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56"
      >
        <div className="px-2 py-2">
          <p className="truncate text-sm font-medium">
            {name}
          </p>

          <p className="text-xs text-muted-foreground">
            Conta do LexFlow
          </p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <Link
            href="/configuracoes/perfil"
            className="flex w-full items-center gap-2"
          >
            <UserRound className="size-4" />
            Meu perfil
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Link
            href="/configuracoes/preferencias"
            className="flex w-full items-center gap-2"
          >
            <SlidersHorizontal className="size-4" />
            Preferências
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}