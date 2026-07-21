const ptBR = new Intl.DateTimeFormat("pt-BR");

const ptBRDateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function formatDate(
  value: Date | string | null | undefined
) {
  if (!value) {
    return "—";
  }

  return ptBR.format(new Date(value));
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

  const date = new Date(value);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}