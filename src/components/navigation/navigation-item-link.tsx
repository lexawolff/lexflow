"use client";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

import {
  navigationItems,
} from "@/components/navigation/navigation-items";

import {
  cn,
} from "@/lib/utils";

type NavigationItemLinkProps = {
  href: string;
  variant:
    | "desktop"
    | "mobile";
  onNavigate?: () => void;
};

function isNestedCasePath(
  pathname: string,
) {
  return /^\/clientes\/[^/]+\/casos(?:\/|$)/.test(
    pathname,
  );
}

function isItemActive({
  pathname,
  href,
}: {
  pathname: string;
  href: string;
}) {
  /*
   * Os detalhes dos casos ficam dentro
   * da rota do cliente:
   *
   * /clientes/[id]/casos/[caseId]
   *
   * Nessa situação queremos destacar
   * "Casos", e não "Clientes".
   */
  if (
    href ===
    "/casos"
  ) {
    return (
      pathname ===
        "/casos" ||
      pathname.startsWith(
        "/casos/",
      ) ||
      isNestedCasePath(
        pathname,
      )
    );
  }

  if (
    href ===
    "/clientes"
  ) {
    if (
      isNestedCasePath(
        pathname,
      )
    ) {
      return false;
    }

    return (
      pathname ===
        "/clientes" ||
      pathname.startsWith(
        "/clientes/",
      )
    );
  }

  return (
    pathname ===
      href ||
    pathname.startsWith(
      `${href}/`,
    )
  );
}

export function NavigationItemLink({
  href,
  variant,
  onNavigate,
}: NavigationItemLinkProps) {
  const pathname =
    usePathname();

  const item =
    navigationItems.find(
      (currentItem) =>
        currentItem.href ===
        href,
    );

  if (!item) {
    return null;
  }

  const active =
    isItemActive({
      pathname,
      href,
    });

  const Icon =
    item.icon;

  return (
    <Link
      href={
        item.href
      }
      onClick={
        onNavigate
      }
      aria-current={
        active
          ? "page"
          : undefined
      }
      className={cn(
        "relative flex w-full items-center gap-3 rounded-xl text-sm font-medium transition",
        variant ===
          "desktop"
          ? "px-3 py-2"
          : "px-3 py-2.5",

        variant ===
          "desktop" &&
          active &&
          "bg-white/15 text-white",

        variant ===
          "desktop" &&
          !active &&
          "text-sidebar-muted hover:bg-white/10 hover:text-white",

        variant ===
          "mobile" &&
          active &&
          "bg-primary/10 text-primary",

        variant ===
          "mobile" &&
          !active &&
          "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {variant ===
        "desktop" &&
      active ? (
        <span className="absolute -left-1 top-2 bottom-2 w-0.5 rounded-full bg-white" />
      ) : null}

      <Icon className="size-4 shrink-0" />

      <span>
        {
          item.title
        }
      </span>
    </Link>
  );
}