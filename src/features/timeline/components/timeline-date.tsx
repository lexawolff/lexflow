import { OFFICE_TIME_ZONE } from "@/lib/format/date";

type TimelineDateProps = {
  date: Date | string;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: OFFICE_TIME_ZONE,
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: OFFICE_TIME_ZONE,
});

/*
 * Renderizado no servidor (UTC): o horário é formatado explicitamente
 * em São Paulo para não aparecer 3 horas adiantado.
 */
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
      {dateFormatter.format(value)} às {timeFormatter.format(value)}
    </time>
  );
}
