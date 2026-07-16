import { Header } from "./header";
import { Sidebar } from "./sidebar";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Sidebar />

      <div className="flex min-h-screen flex-1 flex-col lg:ml-64">
        <Header />

        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}