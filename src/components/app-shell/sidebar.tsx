import Link from "next/link";
import { navigationItems } from "@/components/navigation/navigation-items";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-64 shrink-0 bg-gradient-to-b from-sidebar-from to-sidebar-to px-4 py-5 text-sidebar-foreground lg:flex lg:flex-col">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">LexFlow</h1>
        <p className="text-xs tracking-[0.2em] text-sidebar-muted">
          ADVOCACIA
        </p>
      </div>

      <Button className="mt-6 w-full justify-start bg-white/10 text-white hover:bg-white/20">
        + Capturar
      </Button>

      <Separator className="my-5 bg-white/15" />

      <nav className="space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-sidebar-muted transition hover:bg-white/10 hover:text-white"
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-white/15 bg-white/10 p-3">
        <p className="text-sm font-medium">Roza Advocacia</p>
        <p className="text-xs text-sidebar-muted">Workspace atual</p>
      </div>
    </aside>
  );
}