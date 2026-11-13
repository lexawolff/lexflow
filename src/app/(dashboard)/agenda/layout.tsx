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

export default async function AgendaLayout({
  children,
}: Props) {
  await requireWorkspacePagePermission(
    "AGENDA_VIEW",
  );

  return children;
}