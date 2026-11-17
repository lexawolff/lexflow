/*
 * Fuso do escritório. Em produção o servidor roda em UTC; sem fixar o
 * fuso, horários renderizados no servidor apareceriam 3 horas adiantados
 * e datas perto da meia-noite cairiam no dia seguinte.
 */
export const OFFICE_TIME_ZONE = "America/Sao_Paulo";

/*
 * Momentos (criado em, enviado em, histórico): horário de São Paulo.
 */
const ptBR = new Intl.DateTimeFormat("pt-BR", {
  timeZone: OFFICE_TIME_ZONE,
});

const ptBRDateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: OFFICE_TIME_ZONE,
});

/*
 * Datas sem horário (nascimento, DER, distribuição, vencimento) são
 * gravadas como dia do calendário em UTC, à 00:00 ou às 12:00.
 * Formatando em UTC, as duas convenções mostram o dia correto em
 * qualquer servidor.
 */
const ptBRDateOnly = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
});

export function formatDate(
  value: Date | string | null | undefined
) {
  if (!value) {
    return "—";
  }

  return ptBR.format(new Date(value));
}

export function formatDateOnly(
  value: Date | string | null | undefined
) {
  if (!value) {
    return "—";
  }

  return ptBRDateOnly.format(new Date(value));
}

export function formatDateTime(
  value: Date | string | null | undefined
) {
  if (!value) {
    return "—";
  }

  return ptBRDateTime.format(new Date(value));
}

export function formatInputDate(
  value: Date | string | null | undefined
) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().split("T")[0];
}

export function formatMonthYear(
  value: Date | string | null | undefined
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    month: "2-digit",
    year: "numeric",
    timeZone: OFFICE_TIME_ZONE,
  }).format(new Date(value));
}

export function isPastDate(
  value: Date | string | null | undefined
) {
  if (!value) {
    return false;
  }

  return new Date(value) < new Date();
}

export function isToday(
  value: Date | string | null | undefined
) {
  if (!value) {
    return false;
  }

  return formatDate(value) === formatDate(new Date());
}
