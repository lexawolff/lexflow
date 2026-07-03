import Link from "next/link";
import { navigationItems } from "@/components/navigation/navigation-items";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-64 shrink-0 border-r bg-background px-4 py-5 lg:flex lg:flex-col">
      <div>
        <h1 className="text-xl font-bold tracking-tight">LexFlow</h1>
        <p className="text-xs text-muted-foreground">
          Gestão jurídica inteligente
        </p>
      </div>

      <Button className="mt-6 w-full justify-start" size="sm">
        + Capturar
      </Button>

      <Separator className="my-5" />

      <nav className="space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border bg-muted/40 p-3">
        <p className="text-sm font-medium">Roza Advocacia</p>
        <p className="text-xs text-muted-foreground">Workspace atual</p>
      </div>
    </aside>
  );
}