"use client";

import {
  withFailureToast,
} from "@/lib/actions/action-feedback";

import {
  reopenWorkItemAction,
} from "../actions/work-items";

type ReopenWorkItemButtonProps = {
  workItemId: string;
};

/*
 * A página /trabalho é um Server
 * Component; este botão cliente
 * permite avisar o usuário quando
 * a reabertura falha.
 */
export function ReopenWorkItemButton({
  workItemId,
}: ReopenWorkItemButtonProps) {
  return (
    <form
      action={withFailureToast(
        reopenWorkItemAction,
      )}
    >
      <input
        type="hidden"
        name="id"
        value={workItemId}
      />

      <button
        type="submit"
        className="cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted active:scale-[0.98]"
      >
        Reabrir
      </button>
    </form>
  );
}
