import {
  MobileSidebar,
} from "@/components/app-shell/mobile-sidebar";

import {
  UserMenu,
} from "@/components/app-shell/user-menu";

import {
  getCurrentWorkspaceAccess,
} from "@/lib/permissions";

export async function Header() {
  const {
    user,
  } =
    await getCurrentWorkspaceAccess();

  const name =
    user.name?.trim() ||
    "Usuário";

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 sm:px-6">
      <MobileSidebar />

      <div className="ml-auto">
        <UserMenu
          name={
            name
          }
        />
      </div>
    </header>
  );
}