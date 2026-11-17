"use server";

import {
  ActionError,
} from "@/lib/actions/action-error";

import {
  runAction,
} from "@/lib/actions/run-action";

import {
  redirect,
} from "next/navigation";

import {
  requireWorkspacePermission,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

async function deleteClientImpl(
  clientId: string,
) {
  const {
    workspace,
  } =
    await requireWorkspacePermission(
      "CLIENT_DELETE",
    );

  const client =
    await prisma.client.findFirst({
      where: {
        id:
          clientId,

        workspaceId:
          workspace.id,
      },

      include: {
        cases: {
          select: {
            id:
              true,
          },
        },

        documents: {
          select: {
            id:
              true,
          },
        },

        tasks: {
          select: {
            id:
              true,
          },
        },

        receivables: {
          select: {
            id:
              true,
          },
        },

        events: {
          select: {
            id:
              true,
          },
        },
      },
    });

  if (!client) {
    throw new ActionError(
      "Cliente não encontrado.",
    );
  }

  const hasDependencies =
    client.cases.length > 0 ||
    client.documents.length > 0 ||
    client.tasks.length > 0 ||
    client.receivables.length > 0 ||
    client.events.length > 0;

  if (hasDependencies) {
    throw new ActionError(
      "Não é possível excluir este cliente porque existem registros vinculados a ele.",
    );
  }

  await prisma.client.delete({
    where: {
      id:
        client.id,
    },
  });

  redirect(
    "/clientes",
  );
}

export async function deleteClient(
  ...args: Parameters<typeof deleteClientImpl>
) {
  return runAction(
    () =>
      deleteClientImpl(
        ...args,
      ),
  );
}
