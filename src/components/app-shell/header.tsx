import { Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-6">
      <div className="relative w-full max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="border-border bg-muted pl-9"
          placeholder="Pesquisar pessoa, caso, processo, NB, documento..."
        />
      </div>

      <div className="ml-4 flex items-center gap-2">
        <Button className="bg-primary text-primary-foreground hover:bg-primary-light" size="sm">
          + Capturar
        </Button>

        <Button variant="ghost" size="icon" className="text-primary">
          <Bell className="h-4 w-4" />
        </Button>

        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground">
            LR
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}