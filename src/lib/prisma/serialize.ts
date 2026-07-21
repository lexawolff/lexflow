import { Prisma } from "@prisma/client";

export function serializePrisma<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      value instanceof Prisma.Decimal
        ? value.toNumber()
        : value
    )
  );
}