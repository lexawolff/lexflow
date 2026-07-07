import { CalendarDays, CircleAlert, CircleCheck, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TaskStatus } from "@prisma/client";

type TaskCardProps = {
  title: string;
  client?: string;
  dueDate: string;
  status: TaskStatus;
  overdue?: boolean;
};
export function TaskCard({
  title,
  client,
  dueDate,
  status,
  overdue,
}: TaskCardProps) {
  return (
    <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex items-center justify-between p-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {status === "CONCLUIDA" ? (
              <CircleCheck className="h-5 w-5 text-success" />
            ) : overdue ? (
              <CircleAlert className="h-5 w-5 text-destructive" />
            ) : (
              <CircleAlert className="h-5 w-5 text-primary" />
            )}

            <h3 className="font-semibold text-foreground">
              {title}
            </h3>
          </div>

          {client && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              {client}
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            {dueDate}
          </div>
        </div>

        <Badge
          className={
            status === "CONCLUIDA"
              ? "bg-success text-white"
              : status === "CANCELADA"
                ? "bg-slate-400 text-white"
                : status === "ATRASADA"
                  ? "bg-destructive text-white"
                  : overdue
                    ? "bg-destructive text-white"
                    : status === "EM_ANDAMENTO"
                      ? "bg-warning text-white"
                      : "bg-primary text-primary-foreground"
          }
        >
          {status === "PENDENTE" && "Pendente"}
          {status === "EM_ANDAMENTO" && "Em andamento"}
          {status === "CONCLUIDA" && "Concluída"}
          {status === "CANCELADA" && "Cancelada"}
          {status === "ATRASADA" && "Atrasada"}
        </Badge>
      </CardContent>
    </Card>
  );
}