import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type TimelineDateProps = {
  date: Date | string;
};

export function TimelineDate({
  date,
}: TimelineDateProps) {
  const value =
    date instanceof Date ? date : new Date(date);

  return (
    <time
      dateTime={value.toISOString()}
      className="mt-3 block text-xs text-muted-foreground"
    >
      {format(value, "dd/MM/yyyy 'às' HH:mm", {
        locale: ptBR,
      })}
    </time>
  );
}