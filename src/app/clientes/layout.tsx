import type {
  ReactNode,
} from "react";

import {
  requireWorkspacePagePermission,
} from "@/lib/permissions";

type Props = {
  children:
    ReactNode;
};

export default async function ClientesLayout({
  children,
}: Props) {
  await requireWorkspacePagePermission(
    "CLIENT_VIEW",
  );

  return children;
}