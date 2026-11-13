"use client";

import {
  useState,
} from "react";

import {
  Menu,
} from "lucide-react";

import {
  NavigationItemLink,
} from "@/components/navigation/navigation-item-link";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type MobileSidebarClientProps = {
  visibleHrefs: string[];
  workspaceName: string;
};

export function MobileSidebarClient({
  visibleHrefs,
  workspaceName,
}: MobileSidebarClientProps) {
  const [
    open,
    setOpen,
  ] =
    useState(false);

  return (
    <div className="lg:hidden">
      <Sheet
        open={
          open
        }
        onOpenChange={
          setOpen
        }
      >
        <SheetTrigger
          aria-label="Abrir menu de navegação"
          className="inline-flex size-9 items-center justify-center rounded-md text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Menu className="size-5" />
        </SheetTrigger>

        <SheetContent
          side="left"
          className="w-[85vw] max-w-80 gap-0 p-0 sm:max-w-80"
        >
          <SheetHeader className="border-b px-5 py-5">
            <SheetTitle className="text-xl font-bold tracking-tight">
              LexFlow
            </SheetTitle>

            <SheetDescription className="text-xs uppercase tracking-[0.2em]">
              Advocacia
            </SheetDescription>
          </SheetHeader>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
  {visibleHrefs.map(
    (href) => (
      <NavigationItemLink
        key={
          href
        }
        href={
          href
        }
        variant="mobile"
        onNavigate={() =>
          setOpen(
            false,
          )
        }
      />
    ),
  )}
</nav>

          <SheetFooter className="border-t p-4">
            <div className="rounded-xl bg-muted/60 p-3">
              <p className="truncate text-sm font-medium">
                {
                  workspaceName
                }
              </p>

              <p className="mt-0.5 text-xs text-muted-foreground">
                Workspace atual
              </p>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}