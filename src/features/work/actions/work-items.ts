"use server";

import {
  WorkItemStatus,
  WorkPlanningPeriod,
} from "@prisma/client";

import {
  revalidatePath,
} from "next/cache";

import {
  prisma,
} from "@/lib/prisma";

import {
  requireWorkspacePermission,
} from "@/lib/permissions";

function getRequiredString(
  formData: FormData,
  field: string,
) {
  const value =
    formData.get(field);

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    throw new Error(
      "Preencha os campos obrigatórios.",
    );
  }

  return value.trim();
}

function getOptionalString(
  formData: FormData,
  field: string,
) {
  const value =
    formData.get(field);

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  return value.trim();
}

function getPeriod(
  formData: FormData,
) {
  const value =
    formData.get("period");

  if (
    value ===
      WorkPlanningPeriod.ESTA_SEMANA ||
    value ===
      WorkPlanningPeriod.ESTE_MES ||
    value ===
      WorkPlanningPeriod.DEPOIS
  ) {
    return value;
  }

  return WorkPlanningPeriod.ESTA_SEMANA;
}

function getOptionalDate(
  formData: FormData,
  field: string,
) {
  const value =
    getOptionalString(
      formData,
      field,
    );

  if (!value) {
    return null;
  }

  const date =
    new Date(
      `${value}T12:00:00`,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      "Data inválida.",
    );
  }

  return date;
}

function getAutomaticPosition(
  items: {
    dueDate: Date | null;
  }[],
  dueDate: Date | null,
) {
  if (!dueDate) {
    return items.length;
  }

  const dueTime =
    dueDate.getTime();

  const index =
    items.findIndex(
      (item) =>
        !item.dueDate ||
        item.dueDate.getTime() >
          dueTime,
    );

  return index === -1
    ? items.length
    : index;
}

async function resolveRelations(
  workspaceId: string,
  clientId: string | null,
  caseId: string | null,
) {
  let finalClientId =
    clientId;

  if (clientId) {
    const client =
      await prisma.client.findFirst({
        where: {
          id:
            clientId,

          workspaceId,
        },

        select: {
          id:
            true,
        },
      });

    if (!client) {
      throw new Error(
        "Cliente inválido.",
      );
    }
  }

  if (caseId) {
    const caseRecord =
      await prisma.case.findFirst({
        where: {
          id:
            caseId,

          workspaceId,
        },

        select: {
          id:
            true,

          clientId:
            true,
        },
      });

    if (!caseRecord) {
      throw new Error(
        "Caso inválido.",
      );
    }

    if (
      clientId &&
      caseRecord.clientId !==
        clientId
    ) {
      throw new Error(
        "O caso selecionado não pertence ao cliente informado.",
      );
    }

    finalClientId =
      caseRecord.clientId;
  }

  return {
    clientId:
      finalClientId,

    caseId,
  };
}

export async function createWorkItemAction(
  formData: FormData,
) {
  const {
    workspace,
    membership,
  } =
    await requireWorkspacePermission(
      "WORK_CREATE",
    );

  const title =
    getRequiredString(
      formData,
      "title",
    );

  const description =
    getOptionalString(
      formData,
      "description",
    );

  const clientId =
    getOptionalString(
      formData,
      "clientId",
    );

  const caseId =
    getOptionalString(
      formData,
      "caseId",
    );

  const period =
    getPeriod(
      formData,
    );

  const dueDate =
    getOptionalDate(
      formData,
      "dueDate",
    );

  const relations =
    await resolveRelations(
      workspace.id,
      clientId,
      caseId,
    );

  await prisma.$transaction(
    async (tx) => {
      const currentItems =
        await tx.workItem.findMany({
          where: {
            workspaceId:
              workspace.id,

            assignedToMembershipId:
              membership.id,

            period,

            status: {
              not:
                WorkItemStatus.CONCLUIDA,
            },
          },

          select: {
            dueDate:
              true,
          },

          orderBy: [
            {
              position:
                "asc",
            },

            {
              createdAt:
                "asc",
            },
          ],
        });

      const position =
        getAutomaticPosition(
          currentItems,
          dueDate,
        );

      await tx.workItem.updateMany({
        where: {
          workspaceId:
            workspace.id,

          assignedToMembershipId:
            membership.id,

          period,

          status: {
            not:
              WorkItemStatus.CONCLUIDA,
          },

          position: {
            gte:
              position,
          },
        },

        data: {
          position: {
            increment:
              1,
          },
        },
      });

      await tx.workItem.create({
        data: {
          workspaceId:
            workspace.id,

          assignedToMembershipId:
            membership.id,

          clientId:
            relations.clientId,

          caseId:
            relations.caseId,

          title,
          description,
          period,
          dueDate,
          position,
        },
      });
    },
  );

  revalidatePath(
    "/trabalho",
  );
}

export async function updateWorkItemAction(
  formData: FormData,
) {
  const {
    workspace,
    membership,
  } =
    await requireWorkspacePermission(
      "WORK_EDIT",
    );

  const id =
    getRequiredString(
      formData,
      "id",
    );

  const currentItem =
    await prisma.workItem.findFirst({
      where: {
        id,

        workspaceId:
          workspace.id,

        assignedToMembershipId:
          membership.id,

        status: {
          not:
            WorkItemStatus.CONCLUIDA,
        },
      },

      select: {
        id:
          true,

        period:
          true,

        position:
          true,

        dueDate:
          true,
      },
    });

  if (!currentItem) {
    throw new Error(
      "Trabalho não encontrado.",
    );
  }

  const title =
    getRequiredString(
      formData,
      "title",
    );

  const description =
    getOptionalString(
      formData,
      "description",
    );

  const clientId =
    getOptionalString(
      formData,
      "clientId",
    );

  const caseId =
    getOptionalString(
      formData,
      "caseId",
    );

  const period =
    getPeriod(
      formData,
    );

  const dueDate =
    getOptionalDate(
      formData,
      "dueDate",
    );

  const relations =
    await resolveRelations(
      workspace.id,
      clientId,
      caseId,
    );

  const oldDueTime =
    currentItem.dueDate
      ?.getTime() ??
    null;

  const newDueTime =
    dueDate?.getTime() ??
    null;

  const needsReposition =
    currentItem.period !==
      period ||
    oldDueTime !==
      newDueTime;

  if (!needsReposition) {
    await prisma.workItem.update({
      where: {
        id:
          currentItem.id,
      },

      data: {
        title,
        description,

        clientId:
          relations.clientId,

        caseId:
          relations.caseId,

        dueDate,
      },
    });

    revalidatePath(
      "/trabalho",
    );

    return;
  }

  await prisma.$transaction(
    async (tx) => {
      const targetItems =
        await tx.workItem.findMany({
          where: {
            workspaceId:
              workspace.id,

            assignedToMembershipId:
              membership.id,

            period,

            status: {
              not:
                WorkItemStatus.CONCLUIDA,
            },

            id: {
              not:
                currentItem.id,
            },
          },

          select: {
            dueDate:
              true,
          },

          orderBy: [
            {
              position:
                "asc",
            },

            {
              createdAt:
                "asc",
            },
          ],
        });

      const targetPosition =
        getAutomaticPosition(
          targetItems,
          dueDate,
        );

      await tx.workItem.updateMany({
        where: {
          workspaceId:
            workspace.id,

          assignedToMembershipId:
            membership.id,

          period:
            currentItem.period,

          status: {
            not:
              WorkItemStatus.CONCLUIDA,
          },

          id: {
            not:
              currentItem.id,
          },

          position: {
            gt:
              currentItem.position,
          },
        },

        data: {
          position: {
            decrement:
              1,
          },
        },
      });

      await tx.workItem.updateMany({
        where: {
          workspaceId:
            workspace.id,

          assignedToMembershipId:
            membership.id,

          period,

          status: {
            not:
              WorkItemStatus.CONCLUIDA,
          },

          id: {
            not:
              currentItem.id,
          },

          position: {
            gte:
              targetPosition,
          },
        },

        data: {
          position: {
            increment:
              1,
          },
        },
      });

      await tx.workItem.update({
        where: {
          id:
            currentItem.id,
        },

        data: {
          title,
          description,

          clientId:
            relations.clientId,

          caseId:
            relations.caseId,

          dueDate,
          period,

          position:
            targetPosition,
        },
      });
    },
  );

  revalidatePath(
    "/trabalho",
  );
}

export async function deleteWorkItemAction(
  formData: FormData,
) {
  const {
    workspace,
    membership,
  } =
    await requireWorkspacePermission(
      "WORK_DELETE",
    );

  const id =
    getRequiredString(
      formData,
      "id",
    );

  const item =
    await prisma.workItem.findFirst({
      where: {
        id,

        workspaceId:
          workspace.id,

        assignedToMembershipId:
          membership.id,

        status: {
          not:
            WorkItemStatus.CONCLUIDA,
        },
      },

      select: {
        id:
          true,

        period:
          true,

        position:
          true,
      },
    });

  if (!item) {
    throw new Error(
      "Trabalho não encontrado.",
    );
  }

  await prisma.$transaction(
    async (tx) => {
      const deleted =
        await tx.workItem.deleteMany({
          where: {
            id:
              item.id,

            workspaceId:
              workspace.id,

            assignedToMembershipId:
              membership.id,

            status: {
              not:
                WorkItemStatus.CONCLUIDA,
            },
          },
        });

      if (
        deleted.count !== 1
      ) {
        throw new Error(
          "Não foi possível remover o trabalho.",
        );
      }

      await tx.workItem.updateMany({
        where: {
          workspaceId:
            workspace.id,

          assignedToMembershipId:
            membership.id,

          period:
            item.period,

          status: {
            not:
              WorkItemStatus.CONCLUIDA,
          },

          position: {
            gt:
              item.position,
          },
        },

        data: {
          position: {
            decrement:
              1,
          },
        },
      });
    },
  );

  revalidatePath(
    "/trabalho",
  );
}

export async function startWorkItemAction(
  formData: FormData,
) {
  const {
    workspace,
    membership,
  } =
    await requireWorkspacePermission(
      "WORK_EDIT",
    );

  const id =
    getRequiredString(
      formData,
      "id",
    );

  const result =
    await prisma.workItem.updateMany({
      where: {
        id,

        workspaceId:
          workspace.id,

        assignedToMembershipId:
          membership.id,

        status:
          WorkItemStatus.PENDENTE,
      },

      data: {
        status:
          WorkItemStatus.EM_ANDAMENTO,
      },
    });

  if (
    result.count === 0
  ) {
    throw new Error(
      "Trabalho não encontrado.",
    );
  }

  revalidatePath(
    "/trabalho",
  );
}

export async function completeWorkItemAction(
  formData: FormData,
) {
  const {
    workspace,
    membership,
  } =
    await requireWorkspacePermission(
      "WORK_EDIT",
    );

  const id =
    getRequiredString(
      formData,
      "id",
    );

  const result =
    await prisma.workItem.updateMany({
      where: {
        id,

        workspaceId:
          workspace.id,

        assignedToMembershipId:
          membership.id,

        status: {
          not:
            WorkItemStatus.CONCLUIDA,
        },
      },

      data: {
        status:
          WorkItemStatus.CONCLUIDA,

        completedAt:
          new Date(),
      },
    });

  if (
    result.count === 0
  ) {
    throw new Error(
      "Trabalho não encontrado.",
    );
  }

  revalidatePath(
    "/trabalho",
  );
}

export async function reopenWorkItemAction(
  formData: FormData,
) {
  const {
    workspace,
    membership,
  } =
    await requireWorkspacePermission(
      "WORK_EDIT",
    );

  const id =
    getRequiredString(
      formData,
      "id",
    );

  const item =
    await prisma.workItem.findFirst({
      where: {
        id,

        workspaceId:
          workspace.id,

        assignedToMembershipId:
          membership.id,

        status:
          WorkItemStatus.CONCLUIDA,
      },

      select: {
        id:
          true,

        period:
          true,

        dueDate:
          true,
      },
    });

  if (!item) {
    throw new Error(
      "Trabalho não encontrado.",
    );
  }

  await prisma.$transaction(
    async (tx) => {
      const currentItems =
        await tx.workItem.findMany({
          where: {
            workspaceId:
              workspace.id,

            assignedToMembershipId:
              membership.id,

            period:
              item.period,

            status: {
              not:
                WorkItemStatus.CONCLUIDA,
            },
          },

          select: {
            dueDate:
              true,
          },

          orderBy: [
            {
              position:
                "asc",
            },

            {
              createdAt:
                "asc",
            },
          ],
        });

      const position =
        getAutomaticPosition(
          currentItems,
          item.dueDate,
        );

      await tx.workItem.updateMany({
        where: {
          workspaceId:
            workspace.id,

          assignedToMembershipId:
            membership.id,

          period:
            item.period,

          status: {
            not:
              WorkItemStatus.CONCLUIDA,
          },

          position: {
            gte:
              position,
          },
        },

        data: {
          position: {
            increment:
              1,
          },
        },
      });

      await tx.workItem.update({
        where: {
          id:
            item.id,
        },

        data: {
          status:
            WorkItemStatus.PENDENTE,

          completedAt:
            null,

          position,
        },
      });
    },
  );

  revalidatePath(
    "/trabalho",
  );
}

export async function moveWorkItemToTopAction(
  formData: FormData,
) {
  const {
    workspace,
    membership,
  } =
    await requireWorkspacePermission(
      "WORK_EDIT",
    );

  const id =
    getRequiredString(
      formData,
      "id",
    );

  const item =
    await prisma.workItem.findFirst({
      where: {
        id,

        workspaceId:
          workspace.id,

        assignedToMembershipId:
          membership.id,

        status: {
          not:
            WorkItemStatus.CONCLUIDA,
        },
      },

      select: {
        id:
          true,

        period:
          true,
      },
    });

  if (!item) {
    throw new Error(
      "Trabalho não encontrado.",
    );
  }

  const items =
    await prisma.workItem.findMany({
      where: {
        workspaceId:
          workspace.id,

        assignedToMembershipId:
          membership.id,

        period:
          item.period,

        status: {
          not:
            WorkItemStatus.CONCLUIDA,
        },
      },

      select: {
        id:
          true,

        position:
          true,

        createdAt:
          true,
      },

      orderBy: [
        {
          position:
            "asc",
        },

        {
          createdAt:
            "asc",
        },
      ],
    });

  const orderedItems = [
    ...items.filter(
      (current) =>
        current.id ===
        item.id,
    ),

    ...items.filter(
      (current) =>
        current.id !==
        item.id,
    ),
  ];

  const operations =
    orderedItems
      .filter(
        (
          current,
          index,
        ) =>
          current.position !==
          index,
      )
      .map(
        (
          current,
          index,
        ) =>
          prisma.workItem.update({
            where: {
              id:
                current.id,
            },

            data: {
              position:
                index,
            },
          }),
      );

  if (
    operations.length >
    0
  ) {
    await prisma.$transaction(
      operations,
    );
  }

  revalidatePath(
    "/trabalho",
  );
}

type WorkQueueOrderInput = Record<
  WorkPlanningPeriod,
  string[]
>;

export async function saveWorkQueueOrderAction(
  input: WorkQueueOrderInput,
) {
  const {
    workspace,
    membership,
  } =
    await requireWorkspacePermission(
      "WORK_EDIT",
    );

  const periods: WorkPlanningPeriod[] =
    [
      WorkPlanningPeriod.ESTA_SEMANA,
      WorkPlanningPeriod.ESTE_MES,
      WorkPlanningPeriod.DEPOIS,
    ];

  for (
    const period of periods
  ) {
    const ids =
      input[period];

    if (
      !Array.isArray(ids) ||
      ids.some(
        (id) =>
          typeof id !==
            "string" ||
          !id.trim(),
      )
    ) {
      throw new Error(
        "Ordem de trabalho inválida.",
      );
    }
  }

  const desiredItems =
    periods.flatMap(
      (period) =>
        input[
          period
        ].map(
          (
            id,
            position,
          ) => ({
            id,
            period,
            position,
          }),
        ),
    );

  const desiredIds =
    desiredItems.map(
      (item) =>
        item.id,
    );

  if (
    new Set(
      desiredIds,
    ).size !==
    desiredIds.length
  ) {
    throw new Error(
      "A fila contém itens duplicados.",
    );
  }

  const currentItems =
    await prisma.workItem.findMany({
      where: {
        workspaceId:
          workspace.id,

        assignedToMembershipId:
          membership.id,

        status: {
          not:
            WorkItemStatus.CONCLUIDA,
        },
      },

      select: {
        id:
          true,

        period:
          true,

        position:
          true,
      },
    });

  if (
    currentItems.length !==
    desiredItems.length
  ) {
    throw new Error(
      "A fila foi alterada. Atualize a página e tente novamente.",
    );
  }

  const currentById =
    new Map(
      currentItems.map(
        (item) => [
          item.id,
          item,
        ],
      ),
    );

  for (
    const desired of
    desiredItems
  ) {
    if (
      !currentById.has(
        desired.id,
      )
    ) {
      throw new Error(
        "A fila contém um trabalho inválido.",
      );
    }
  }

  const operations =
    desiredItems
      .filter(
        (desired) => {
          const current =
            currentById.get(
              desired.id,
            );

          if (!current) {
            return false;
          }

          return (
            current.period !==
              desired.period ||
            current.position !==
              desired.position
          );
        },
      )
      .map(
        (desired) =>
          prisma.workItem.update({
            where: {
              id:
                desired.id,
            },

            data: {
              period:
                desired.period,

              position:
                desired.position,
            },
          }),
      );

  if (
    operations.length >
    0
  ) {
    await prisma.$transaction(
      operations,
    );
  }

  revalidatePath(
    "/trabalho",
  );
}