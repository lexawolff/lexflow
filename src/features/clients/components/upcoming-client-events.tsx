import { CalendarDays, Clock, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientDetails } from "../types";

import { Task } from "@prisma/client";

type UpcomingClientEventsProps = {
  tasks: Array<{
    id: string;
    title: string;
    type: string;
    startsAt: Date | null;
    dueDate: Date;
    location: string | null;
  }>;
};

export function UpcomingClientEvents({
  tasks,
}: UpcomingClientEventsProps) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Próximos compromissos</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum compromisso próximo para este cliente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximos compromissos</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {tasks.map((task) => {
          const date = task.startsAt ?? task.dueDate;

          return (
            <div
              key={task.id}
              className="rounded-xl border bg-muted/30 p-4"
            >
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-5 w-5 text-primary" />

                <div className="space-y-1">
                  <p className="font-medium">{task.title}</p>

                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {task.type.replaceAll("_", " ")}
                  </p>

                  <div className="flex flex-wrap gap-4 pt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />

                      {date.toLocaleDateString("pt-BR")}

                      {task.startsAt &&
                        ` às ${task.startsAt.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`}
                    </span>

                    {task.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {task.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}