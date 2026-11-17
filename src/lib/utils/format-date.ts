import { OFFICE_TIME_ZONE } from "@/lib/format/date";

// Data de um momento (ex.: envio do documento) no horário de São Paulo.
export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: OFFICE_TIME_ZONE,
  }).format(new Date(date));
}
