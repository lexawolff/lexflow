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

export default async function FinanceiroLayout({
  children,
}: Props) {
  await requireWorkspacePagePermission(
    "FINANCE_VIEW",
  );

  return children;
}