"use server";

import {
  FinancialStatus,
} from "@prisma/client";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getDefaultWorkspace } from "@/lib/workspace";

import { createPayableSchema } from "../schemas/create-payable-schema";

function getDateKey(
  date: Date,
): string {
  const year =
    date.getUTCFullYear();

  const month =
    String(
      date.getUTCMonth() + 1,
    ).padStart(2, "0");

  const day =
    String(
      date.getUTCDate(),
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayDateKey(): string {
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

function getInitialStatus(
  dueDate: Date,
): FinancialStatus {
  if (
    getDateKey(dueDate) <
    getTodayDateKey()
  ) {
    return FinancialStatus.ATRASADO;
  }

  return FinancialStatus.PENDENTE;
}

export async function createPayable(
  formData: FormData,
) {
  const workspace =
    await getDefaultWorkspace();

  const parsed =
    createPayableSchema.safeParse({
      description:
        formData.get(
          "description",
        ),

      category:
        formData.get(
          "category",
        ),

      amount:
        formData.get(
          "amount",
        ),

      dueDate:
        formData.get(
          "dueDate",
        ),

      notes:
        formData.get(
          "notes",
        ),
    });

  if (!parsed.success) {
    console.error(
      parsed.error.flatten(),
    );

    throw new Error(
      parsed.error.issues[0]
        ?.message ??
        "Dados inválidos.",
    );
  }

  const data =
    parsed.data;

  const status =
    getInitialStatus(
      data.dueDate,
    );

  await prisma.payable.create({
    data: {
      workspaceId:
        workspace.id,

      description:
        data.description,

      category:
        data.category,

      amount:
        data.amount,

      dueDate:
        data.dueDate,

      status,

      notes:
        data.notes,
    },
  });

  revalidatePath(
    "/financeiro",
  );

  return {
    success: true,
  };
}