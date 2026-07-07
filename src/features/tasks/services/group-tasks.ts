import { Prisma, TaskStatus } from "@prisma/client";

export type TaskWithRelations = Prisma.TaskGetPayload<{
  include: {
    client: true;
    case: true;
  };
}>;

export function groupTasks(tasks: TaskWithRelations[]) {
  const now = new Date();

  now.setHours(0, 0, 0, 0);

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  return {
    overdue: tasks.filter((task) => {
      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);

      return (
        due < now &&
        task.status !== TaskStatus.CONCLUIDA
      );
    }),

    today: tasks.filter((task) => {
      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);

      return (
        due.getTime() === now.getTime() &&
        task.status !== TaskStatus.CONCLUIDA
      );
    }),

    tomorrow: tasks.filter((task) => {
      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);

      return (
        due.getTime() === tomorrow.getTime() &&
        task.status !== TaskStatus.CONCLUIDA
      );
    }),

    future: tasks.filter((task) => {
      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);

      return (
        due > tomorrow &&
        task.status !== TaskStatus.CONCLUIDA
      );
    }),

    completed: tasks.filter(
      (task) => task.status === TaskStatus.CONCLUIDA
    ),
  };
}