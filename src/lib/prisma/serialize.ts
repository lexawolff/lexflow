import { Prisma } from "@prisma/client";

export type Serialized<T> =
  T extends Date
    ? string
    : T extends Prisma.Decimal
      ? number
      : T extends readonly (infer U)[]
        ? Serialized<U>[]
        : T extends object
          ? {
              [K in keyof T]: Serialized<T[K]>;
            }
          : T;

export function serializePrisma<T>(
  data: T
): Serialized<T> {
  return JSON.parse(
    JSON.stringify(data, (_, value) =>
      value instanceof Prisma.Decimal
        ? value.toNumber()
        : value
    )
  ) as Serialized<T>;
}