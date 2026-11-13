import {
  prisma,
} from "@/lib/prisma";

import {
  serializePrisma,
} from "@/lib/prisma/serialize";

import {
  getDefaultWorkspace,
} from "@/lib/workspace";

import {
  clientDashboardBaseSelect,
  clientDocumentSelect,
  clientTaskSelect,
  type RawClientDetails,
} from "../types";

type GetClientDashboardAccess = {
  canViewAgenda?:
    boolean;

  canViewDocuments?:
    boolean;

  canViewFinance?:
    boolean;

  canViewGov?:
    boolean;
};

/*
 * Mantemos true como padrão
 * temporariamente porque outras
 * telas antigas ainda chamam
 * getClientDashboard(id).
 *
 * Na ficha principal passaremos
 * explicitamente as permissões.
 *
 * Depois migraremos as demais telas
 * e poderemos remover esse fallback.
 */
const DEFAULT_ACCESS = {
  canViewAgenda:
    true,

  canViewDocuments:
    true,

  canViewFinance:
    true,

  canViewGov:
    true,
};

export async function getClientDashboard(
  id:
    string,

  access:
    GetClientDashboardAccess = {},
) {
  const workspace =
    await getDefaultWorkspace();

  const permissions = {
    ...DEFAULT_ACCESS,
    ...access,
  };

  /*
   * Primeiro buscamos somente
   * os dados básicos do cliente.
   *
   * Nenhuma informação financeira
   * ou credencial Gov.br entra aqui.
   */
  const client =
    await prisma.client.findFirst({
      where: {
        id,

        workspaceId:
          workspace.id,
      },

      select:
        clientDashboardBaseSelect,
    });

  if (!client) {
    return null;
  }

  /*
   * ==========================
   * AGENDA
   * ==========================
   */
  let tasks:
    RawClientDetails["tasks"] =
    [];

  if (
    permissions.canViewAgenda
  ) {
    tasks =
      await prisma.task.findMany({
        where: {
          workspaceId:
            workspace.id,

          clientId:
            client.id,

          status: {
            notIn: [
              "CONCLUIDA",
              "CANCELADA",
            ],
          },
        },

        select:
          clientTaskSelect,

        orderBy: [
          {
            dueDate:
              "asc",
          },

          {
            startsAt:
              "asc",
          },
        ],

        take:
          20,
      });
  }

  /*
   * ==========================
   * DOCUMENTOS
   * ==========================
   */
  let documents:
    RawClientDetails["documents"] =
    [];

  if (
    permissions.canViewDocuments
  ) {
    documents =
      await prisma.document.findMany({
        where: {
          workspaceId:
            workspace.id,

          clientId:
            client.id,
        },

        select:
          clientDocumentSelect,

        orderBy: {
          createdAt:
            "desc",
        },
      });
  }

  /*
   * ==========================
   * FINANCEIRO
   * ==========================
   */
  let receivables:
    RawClientDetails["receivables"] =
    [];

  let income:
    RawClientDetails["income"] =
    null;

  if (
    permissions.canViewFinance
  ) {
    receivables =
      await prisma.receivable.findMany({
        where: {
          workspaceId:
            workspace.id,

          clientId:
            client.id,
        },

        orderBy: {
          createdAt:
            "desc",
        },
      });

    const financialData =
      await prisma.client.findFirst({
        where: {
          id:
            client.id,

          workspaceId:
            workspace.id,
        },

        select: {
          income:
            true,
        },
      });

    income =
      financialData?.income ??
      null;
  }

  /*
   * ==========================
   * GOV.BR
   * ==========================
   *
   * A senha criptografada nunca é
   * enviada ao componente.
   *
   * Usamos somente um booleano
   * dizendo se existe uma senha.
   */
  let govLogin:
    string | null =
    null;

  let hasGovPassword =
    false;

  if (
    permissions.canViewGov
  ) {
    const govData =
      await prisma.client.findFirst({
        where: {
          id:
            client.id,

          workspaceId:
            workspace.id,
        },

        select: {
          govLogin:
            true,

          govPasswordEncrypted:
            true,
        },
      });

    govLogin =
      govData?.govLogin ??
      null;

    hasGovPassword =
      Boolean(
        govData?.govPasswordEncrypted,
      );
  }

  const result:
    RawClientDetails = {
    ...client,

    income,

    govLogin,

    hasGovPassword,

    tasks,

    documents,

    receivables,
  };

  return serializePrisma(
    result,
  );
}