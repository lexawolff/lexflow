import type { FinancialStatus } from "@prisma/client";

export type SerializableDate =
  | Date
  | string
  | null
  | undefined;

export function toDateInputValue(
  value: SerializableDate,
): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    const isoDateMatch = value.match(
      /^(\d{4})-(\d{2})-(\d{2})/,
    );

    if (isoDateMatch) {
      return `${isoDateMatch[1]}-${isoDateMatch[2]}-${isoDateMatch[3]}`;
    }

    const parsedDate = new Date(value);

    if (
      Number.isNaN(parsedDate.getTime())
    ) {
      return "";
    }

    return dateToUTCKey(parsedDate);
  }

  if (
    Number.isNaN(value.getTime())
  ) {
    return "";
  }

  return dateToUTCKey(value);
}

export function formatReceivableDate(
  value: SerializableDate,
): string {
  const dateKey =
    toDateInputValue(value);

  if (!dateKey) {
    return "Sem vencimento";
  }

  const [year, month, day] =
    dateKey.split("-");

  return `${day}/${month}/${year}`;
}

export function getEffectiveFinancialStatus(
  status: FinancialStatus,
  dueDate: SerializableDate,
): FinancialStatus {
  /*
   * Status definitivos ou especiais
   * não devem ser alterados apenas
   * pela passagem do tempo.
   */
  if (
    status === "PAGO" ||
    status === "CANCELADO" ||
    status === "PARCIAL" ||
    status === "ATRASADO"
  ) {
    return status;
  }

  if (!dueDate) {
    return status;
  }

  const dueDateKey =
    toDateInputValue(dueDate);

  if (!dueDateKey) {
    return status;
  }

  const todayKey =
    getTodayInSaoPaulo();

  if (dueDateKey < todayKey) {
    return "ATRASADO";
  }

  return status;
}

export function getDateTimestamp(
  value: SerializableDate,
): number | null {
  if (!value) {
    return null;
  }

  const dateKey =
    toDateInputValue(value);

  if (!dateKey) {
    return null;
  }

  const [year, month, day] =
    dateKey.split("-").map(Number);

  return Date.UTC(
    year,
    month - 1,
    day,
    12,
  );
}

function dateToUTCKey(
  date: Date,
): string {
  const year =
    date.getUTCFullYear();

  const month = String(
    date.getUTCMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getUTCDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayInSaoPaulo(): string {
  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "America/Sao_Paulo",

        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      },
    );

  const parts =
    formatter.formatToParts(
      new Date(),
    );

  const year =
    parts.find(
      (part) =>
        part.type === "year",
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type === "month",
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type === "day",
    )?.value;

  if (
    !year ||
    !month ||
    !day
  ) {
    return dateToUTCKey(
      new Date(),
    );
  }

  return `${year}-${month}-${day}`;
}