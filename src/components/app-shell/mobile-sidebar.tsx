import {
  MobileSidebarClient,
} from "@/components/app-shell/mobile-sidebar-client";

import {
  navigationItems,
} from "@/components/navigation/navigation-items";

import {
  getCurrentWorkspaceAccess,
  hasPermission,
} from "@/lib/permissions";

export async function MobileSidebar() {
  const {
    workspace,
    membership,
  } =
    await getCurrentWorkspaceAccess();

  const visibleHrefs =
    navigationItems
      .filter(
        (item) =>
          !item.permission ||
          hasPermission(
            membership.role,
            item.permission,
          ),
      )
      .map(
        (item) =>
          item.href,
      );

  return (
    <MobileSidebarClient
      visibleHrefs={
        visibleHrefs
      }
      workspaceName={
        workspace.name
      }
    />
  );
}