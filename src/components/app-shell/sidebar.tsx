import {
  navigationItems,
} from "@/components/navigation/navigation-items";

import {
  Separator,
} from "@/components/ui/separator";

import {
  getCurrentWorkspaceAccess,
  hasPermission,
} from "@/lib/permissions";

import {
  NavigationItemLink,
} from "@/components/navigation/navigation-item-link";

export async function Sidebar() {
  const {
    workspace,
    membership,
  } =
    await getCurrentWorkspaceAccess();

  const visibleItems =
    navigationItems.filter(
      (item) =>
        !item.permission ||
        hasPermission(
          membership.role,
          item.permission,
        ),
    );

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 bg-gradient-to-b from-sidebar-from to-sidebar-to px-4 py-5 text-sidebar-foreground lg:flex lg:flex-col">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          LexFlow
        </h1>

        <p className="text-xs tracking-[0.2em] text-sidebar-muted">
          ADVOCACIA
        </p>
      </div>
      
      <Separator className="my-5 bg-white/15" />

      <nav className="space-y-1">
        {visibleItems.map(
          (item) => (
            <NavigationItemLink
              key={
                item.href
              }
              href={
                item.href
              }
              variant="desktop"
            />
          ),
        )}
      </nav>

      <div className="mt-auto rounded-xl border border-white/15 bg-white/10 p-3">
        <p className="truncate text-sm font-medium">
          {
            workspace.name
          }
        </p>

        <p className="text-xs text-sidebar-muted">
          Workspace atual
        </p>
      </div>
    </aside>
  );
}