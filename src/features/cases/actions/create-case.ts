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
  requireWorkspacePermission,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

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
      .map(
        Number,
      );

  if (
    !year ||
    !month ||
    !day
  ) {
    return null;
  }

  /*
   * Meio-dia UTC evita alteração
   * indevida da data no Brasil.
   */
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

async function createCaseImpl(
  clientId: string,
  formData: FormData,
) {
  const {
    workspace,
  } =
    await requireWorkspacePermission(
      "CASE_CREATE",
    );

  /*
   * O clientId vem da rota,
   * mas ainda assim precisa
   * ser validado no servidor.
   */
  const client =
    await prisma.client.findFirst({
      where: {
        id:
          clientId,

        workspaceId:
          workspace.id,
      },

      select: {
        id: true,
      },
    });

  if (!client) {
    throw new ActionError(
      "Cliente não encontrado neste escritório.",
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
        ) ||
        undefined,

      status:
        formData.get(
          "status",
        ),

      administrativeRequestDate:
        formData.get(
          "administrativeRequestDate",
        ) ||
        undefined,

      distributionDate:
        formData.get(
          "distributionDate",
        ) ||
        undefined,

      notes:
        formData.get(
          "notes",
        ),
    });

  if (!parsed.success) {
    console.error(
      parsed.error.flatten(),
    );

    throw new ActionError(
      parsed.error.issues[0]
        ?.message ??
        "Revise os campos obrigatórios do caso.",
    );
  }

  const data =
    parsed.data;

  const createdCase =
    await prisma.case.create({
      data: {
        workspaceId:
          workspace.id,

        clientId:
          client.id,

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

  await createCaseEvent({
    caseId:
      createdCase.id,

    title:
      "Caso cadastrado",

    content:
      "O caso foi cadastrada no sistema.",
  });

  revalidatePath(
    `/clientes/${clientId}`,
  );

  revalidatePath(
    "/casos",
  );

  revalidatePath(
    "/dashboard",
  );

  redirect(
    `/clientes/${clientId}/casos/${createdCase.id}`,
  );
}

export async function createCase(
  ...args: Parameters<typeof createCaseImpl>
) {
  return runAction(
    () =>
      createCaseImpl(
        ...args,
      ),
  );
}
