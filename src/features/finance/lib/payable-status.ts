import { FinancialStatus } from "@prisma/client";

export function getDateKey(
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

export function getTodayDateKeyInSaoPaulo(): string {
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
    throw new Error(
      "Não foi possível determinar a data atual.",
    );
  }

  return `${year}-${month}-${day}`;
}

export function getOpenPayableStatus(
  dueDate: Date,
): FinancialStatus {
  if (
    getDateKey(dueDate) <
    getTodayDateKeyInSaoPaulo()
  ) {
    return FinancialStatus.ATRASADO;
  }

  return FinancialStatus.PENDENTE;
}

export function getPayableStatusAfterEdit({
  currentStatus,
  dueDate,
}: {
  currentStatus:
    FinancialStatus;

  dueDate: Date;
}): FinancialStatus {
  /*
   * Uma simples edição não deve
   * alterar estados definitivos.
   */
  if (
    currentStatus ===
      FinancialStatus.PAGO ||
    currentStatus ===
      FinancialStatus.CANCELADO
  ) {
    return currentStatus;
  }

  return getOpenPayableStatus(
    dueDate,
  );
}