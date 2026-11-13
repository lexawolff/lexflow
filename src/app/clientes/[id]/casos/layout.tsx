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

export default async function ClientCasesLayout({
  children,
}: Props) {
  await requireWorkspacePagePermission(
    "CASE_VIEW",
  );

  return children;
}