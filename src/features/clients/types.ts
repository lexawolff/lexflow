import { Prisma } from "@prisma/client";

export const clientDashboardInclude =
  Prisma.validator<Prisma.ClientDefaultArgs>()({
    include: {
      cases: {
        select: {
          id: true,
          title: true,
          practiceArea: true,
          status: true,
          number: true,
          administrativeNumber: true,
          nextDeadline: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },

      tasks: {
        where: {
          status: {
            notIn: ["CONCLUIDA", "CANCELADA"],
          },
          dueDate: {
            gte: new Date(),
          },
        },
        orderBy: {
          dueDate: "asc",
        },
        take: 5,
      },

      documents: {
        orderBy: {
          createdAt: "desc",
        },
      },

      receivables: {
        orderBy: {
          createdAt: "desc",
        },
      },

      events: {
        orderBy: {
          date: "desc",
        },
      },
    },
  });

export type ClientDetails =
  Prisma.ClientGetPayload<typeof clientDashboardInclude>;