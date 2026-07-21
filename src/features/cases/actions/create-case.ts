"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getDefaultWorkspace } from "@/lib/workspace";

import { caseSchema } from "../schemas/case-schema";
import { createCaseEvent } from "../services/create-case-event";

export async function createCase(
  clientId: string,
  formData: FormData
) {
  const workspace = await getDefaultWorkspace();

  const parsed = caseSchema.safeParse({
    title: formData.get("title"),

    practiceArea: formData.get("practiceArea"),
    subject: formData.get("subject"),
    benefitType: formData.get("benefitType"),

    origin: formData.get("origin"),
    administrativeStatus: formData.get("administrativeStatus"),

    number: formData.get("number"),
    administrativeNumber: formData.get("administrativeNumber"),
    administrativeProcess: formData.get("administrativeProcess"),

    court: formData.get("court"),
    courtUnit: formData.get("courtUnit"),
    judge: formData.get("judge"),
    city: formData.get("city"),
    state: formData.get("state"),

    opposingParty: formData.get("opposingParty"),

    claimValue: formData.get("claimValue") || undefined,

    status: formData.get("status"),

    administrativeRequestDate:
      formData.get("administrativeRequestDate") || undefined,

    distributionDate:
      formData.get("distributionDate") || undefined,

    nextDeadline:
      formData.get("nextDeadline") || undefined,

    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    console.error(parsed.error.flatten());
    throw new Error("Dados inválidos.");
  }

  const data = {
    ...parsed.data,

    administrativeRequestDate:
      parsed.data.administrativeRequestDate
        ? new Date(parsed.data.administrativeRequestDate)
        : null,

    distributionDate:
      parsed.data.distributionDate
        ? new Date(parsed.data.distributionDate)
        : null,

    nextDeadline:
      parsed.data.nextDeadline
        ? new Date(parsed.data.nextDeadline)
        : null,
  };

  const createdCase = await prisma.case.create({
    data: {
      workspaceId: workspace.id,
      clientId,
      ...data,
    },
  });
  
  await createCaseEvent({
    caseId: createdCase.id,
    title: "Demanda cadastrada",
    content: "A demanda foi cadastrada no sistema.",
  });

  redirect(`/clientes/${clientId}/casos/${createdCase.id}`);
}