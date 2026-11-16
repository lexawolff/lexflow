"use server";

import { recordGovAudit } from "@/lib/security/audit";

import {
  redirect,
} from "next/navigation";

import {
  hasPermission,
  requireWorkspacePermission,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

import {
  Vault,
} from "@/lib/security/vault";

import {
  clientSchema,
} from "../schemas/client-schema";

export async function createClient(
  formData:
    FormData,
) {
  const {
    workspace,
    membership,
  } =
    await requireWorkspacePermission(
      "CLIENT_CREATE",
    );

  const canWriteFinance =
    hasPermission(
      membership.role,
      "FINANCE_WRITE",
    );

  const canManageGov =
    hasPermission(
      membership.role,
      "GOV_MANAGE",
    );

  const parsed =
    clientSchema.safeParse({
      name:
        formData.get(
          "name",
        ),

      cpf:
        formData.get(
          "cpf",
        ),

      rg:
        formData.get(
          "rg",
        ),

      birthDate:
        formData.get(
          "birthDate",
        ) ||
        undefined,

      motherName:
        formData.get(
          "motherName",
        ),

      fatherName:
        formData.get(
          "fatherName",
        ),

      gender:
        formData.get(
          "gender",
        ),

      maritalStatus:
        formData.get(
          "maritalStatus",
        ),

      nationality:
        formData.get(
          "nationality",
        ),

      education:
        formData.get(
          "education",
        ),

      profession:
        formData.get(
          "profession",
        ),

      income:
        formData.get(
          "income",
        ) ||
        undefined,

      phone:
        formData.get(
          "phone",
        ),

      whatsapp:
        formData.get(
          "whatsapp",
        ),

      email:
        formData.get(
          "email",
        ),

      cep:
        formData.get(
          "cep",
        ),

      address:
        formData.get(
          "address",
        ),

      addressNumber:
        formData.get(
          "addressNumber",
        ),

      complement:
        formData.get(
          "complement",
        ),

      neighborhood:
        formData.get(
          "neighborhood",
        ),

      city:
        formData.get(
          "city",
        ),

      state:
        formData.get(
          "state",
        ),

      pis:
        formData.get(
          "pis",
        ),

      govLogin: canManageGov ? (formData.get("govLogin") ?? undefined) : undefined,

      govPassword: canManageGov ? (formData.get("govPassword") ?? undefined) : undefined,

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

  const existingClient =
    parsed.data.cpf
      ? await prisma.client.findFirst({
          where: {
            workspaceId:
              workspace.id,

            cpf:
              parsed.data.cpf,
          },

          select: {
            id:
              true,
          },
        })
      : null;

  if (existingClient) {
    throw new Error(
      "Já existe um cliente cadastrado com este CPF.",
    );
  }

  const {
    birthDate,
    income,
    govLogin,
    govPassword,
    ...clientData
  } =
    parsed.data;

  const client = await prisma.$transaction(async (tx) => {
    const savedClient = await tx.client.create({
      data: {
        workspaceId:
          workspace.id,

        ...clientData,

        birthDate:
          birthDate
            ? new Date(
                birthDate,
              )
            : null,

        /*
         * Mesmo que um usuário
         * tente adulterar o request,
         * estes campos são ignorados
         * sem a permissão adequada.
         */
        income:
          canWriteFinance
            ? income ??
              null
            : null,

        govLogin:
          canManageGov
            ? govLogin ||
              null
            : null,

        govPasswordEncrypted:
          canManageGov &&
          govPassword
            ? Vault.encrypt(
                govPassword,
              )
            : null,
      },
    });

    if (canManageGov && (govLogin || govPassword)) {
      await recordGovAudit(tx, {
        workspaceId: workspace.id,
        actorUserId: membership.userId,
        clientId: savedClient.id,
        action: "GOV_CREDENTIAL_CREATED",
      });
    }
    return savedClient;
  });

  redirect(
    `/clientes/${client.id}`,
  );
}
