import { AppShell } from "@/components/app-shell/app-shell";
import { prisma } from "@/lib/prisma";
import { getDefaultWorkspace } from "@/lib/workspace";

import { TaskCard } from "@/features/tasks/components/task-card";
import { TaskSection } from "@/features/tasks/components/task-section";
import { groupTasks } from "@/features/tasks/services/group-tasks";

export default async function TasksPage() {
  const workspace = await getDefaultWorkspace();

  const tasks = await prisma.task.findMany({
    where: {
      workspaceId: workspace.id,
    },
    include: {
      client: true,
      case: true,
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  const grouped = groupTasks(tasks);

  return (
    <AppShell>
      <div className="space-y-8">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Tarefas
            </h1>

            <p className="mt-1 text-muted-foreground">
              Tudo o que precisa ser feito no escritório.
            </p>
          </div>
        </div>

        <TaskSection
          title="Atrasadas"
          color="red"
          count={grouped.overdue.length}
        >
          {grouped.overdue.length === 0 ? (
            <p className="text-muted-foreground">
              Nenhuma tarefa atrasada.
            </p>
          ) : (
            grouped.overdue.map((task) => (
              <TaskCard
                key={task.id}
                title={task.title}
                client={task.client?.name}
                dueDate={task.dueDate.toLocaleDateString("pt-BR")}
                status={task.status}
                overdue
              />
            ))
          )}
        </TaskSection>

        <TaskSection
          title="Hoje"
          color="yellow"
          count={grouped.today.length}
        >
          {grouped.today.length === 0 ? (
            <p className="text-muted-foreground">
              Nenhuma tarefa para hoje.
            </p>
          ) : (
            grouped.today.map((task) => (
              <TaskCard
                key={task.id}
                title={task.title}
                client={task.client?.name}
                dueDate="Hoje"
                status={task.status}
              />
            ))
          )}
        </TaskSection>

        <TaskSection
          title="Amanhã"
          color="blue"
          count={grouped.tomorrow.length}
        >
          {grouped.tomorrow.length === 0 ? (
            <p className="text-muted-foreground">
              Nenhuma tarefa para amanhã.
            </p>
          ) : (
            grouped.tomorrow.map((task) => (
              <TaskCard
                key={task.id}
                title={task.title}
                client={task.client?.name}
                dueDate="Amanhã"
                status={task.status}
              />
            ))
          )}
        </TaskSection>

        <TaskSection
          title="Futuras"
          color="green"
          count={grouped.future.length}
        >
          {grouped.future.length === 0 ? (
            <p className="text-muted-foreground">
              Nenhuma tarefa futura.
            </p>
          ) : (
            grouped.future.map((task) => (
              <TaskCard
                key={task.id}
                title={task.title}
                client={task.client?.name}
                dueDate={task.dueDate.toLocaleDateString("pt-BR")}
                status={task.status}
              />
            ))
          )}
        </TaskSection>

      </div>
    </AppShell>
  );
}