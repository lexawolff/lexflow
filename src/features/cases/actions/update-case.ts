"use server";

import {
  ActionError,
} from "@/lib/actions/action-error";

import {
  runAction,
} from "@/lib/actions/run-action";

import {
  revalidatePath,
} from "next/cache";

import {
  redirect,
} from "next/navigation";

import {
  prisma,
} from "@/lib/prisma";

import {
  requireWorkspacePermission,
} from "@/lib/permissions";

import {
  CASE_STATUS_LABELS,
} from "../constants";

import {
  caseSchema,
} from "../schemas/case-schema";

import {
  createCaseEvent,
} from "../services/create-case-event";

function buildDateOnly(
  value:
    string | undefined,
): Date | null {
  if (!value) {
    return null;
  }

  const [
    year,
    month,
    day,
  ] =
    value
      .split("-")
      .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return null;
  }

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day,
      12,
    ),
  );
}

function nullableText(
  value:
    string | undefined,
): string | null {
  const normalized =
    value?.trim();

  return normalized
    ? normalized
    : null;
}

async function updateCaseImpl(
  caseId:
    string,

  formData:
    FormData,
) {
 const {
  workspace,
} =
  await requireWorkspacePermission(
    "CASE_EDIT",
  );

  const existing =
    await prisma.case.findFirst({
      where: {
        id:
          caseId,

        workspaceId:
          workspace.id,
      },

      select: {
        id:
          true,

        clientId:
          true,

        status:
          true,
      },
    });

  if (!existing) {
    throw new ActionError(
      "Caso não encontrado.",
    );
  }

  const parsed =
    caseSchema.safeParse({
      title:
        formData.get(
          "title",
        ),

      practiceArea:
        formData.get(
          "practiceArea",
        ),

      subject:
        formData.get(
          "subject",
        ),

      benefitType:
        formData.get(
          "benefitType",
        ),

      origin:
        formData.get(
          "origin",
        ),

      administrativeStatus:
        formData.get(
          "administrativeStatus",
        ),

      number:
        formData.get(
          "number",
        ),

      administrativeNumber:
        formData.get(
          "administrativeNumber",
        ),

      administrativeProcess:
        formData.get(
          "administrativeProcess",
        ),

      court:
        formData.get(
          "court",
        ),

      courtUnit:
        formData.get(
          "courtUnit",
        ),

      judge:
        formData.get(
          "judge",
        ),

      city:
        formData.get(
          "city",
        ),

      state:
        formData.get(
          "state",
        ),

      opposingParty:
        formData.get(
          "opposingParty",
        ),

      claimValue:
        formData.get(
          "claimValue",
        ) || undefined,

      status:
        formData.get(
          "status",
        ),

      administrativeRequestDate:
        formData.get(
          "administrativeRequestDate",
        ) || undefined,

      distributionDate:
        formData.get(
          "distributionDate",
        ) || undefined,

      notes:
        formData.get(
          "notes",
        ),
    });

  if (
    !parsed.success
  ) {
    console.error(
      parsed.error.flatten(),
    );

    throw new ActionError(
      parsed.error.issues[0]
        ?.message ??
        "Dados inválidos.",
    );
  }

  const data =
    parsed.data;

  await prisma.case.update({
    where: {
      id:
        existing.id,
    },

    data: {
      title:
        data.title,

      practiceArea:
        data.practiceArea,

      subject:
        nullableText(
          data.subject,
        ),

      benefitType:
        nullableText(
          data.benefitType,
        ),

      origin:
        data.origin,

      administrativeStatus:
        data.administrativeStatus,

      number:
        nullableText(
          data.number,
        ),

      administrativeNumber:
        nullableText(
          data.administrativeNumber,
        ),

      administrativeProcess:
        nullableText(
          data.administrativeProcess,
        ),

      court:
        nullableText(
          data.court,
        ),

      courtUnit:
        nullableText(
          data.courtUnit,
        ),

      judge:
        nullableText(
          data.judge,
        ),

      city:
        nullableText(
          data.city,
        ),

      state:
        nullableText(
          data.state,
        )?.toUpperCase() ??
        null,

      opposingParty:
        nullableText(
          data.opposingParty,
        ),

      claimValue:
        data.claimValue ??
        null,

      status:
        data.status,

      administrativeRequestDate:
        buildDateOnly(
          data.administrativeRequestDate,
        ),

      distributionDate:
        buildDateOnly(
          data.distributionDate,
        ),

      notes:
        nullableText(
          data.notes,
        ),
    },
  });

  /*
   * Mudança de status é
   * relevante para o histórico.
   */
  if (
    existing.status !==
    data.status
  ) {
    await createCaseEvent({
      caseId:
        existing.id,

      title:
        "Status do caso alterado",

      content:
        `Status alterado de "${CASE_STATUS_LABELS[existing.status]}" para "${CASE_STATUS_LABELS[data.status]}".`,
    });
  }

  const casePath =
    `/clientes/${existing.clientId}/casos/${existing.id}`;

  revalidatePath(
    casePath,
  );

  revalidatePath(
    `/clientes/${existing.clientId}`,
  );

  revalidatePath(
    "/casos",
  );

  revalidatePath(
    "/dashboard",
  );

  redirect(
    casePath,
  );
}

export async function updateCase(
  ...args: Parameters<typeof updateCaseImpl>
) {
  return runAction(
    () =>
      updateCaseImpl(
        ...args,
      ),
  );
}
