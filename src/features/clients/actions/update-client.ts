"use server";

import {
  revalidatePath,
} from "next/cache";

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

export async function updateClient(
  clientId:
    string,

  formData:
    FormData,
) {
  const {
    workspace,
    membership,
  } =
    await requireWorkspacePermission(
      "CLIENT_EDIT",
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

  const client =
    await prisma.client.findFirst({
      where: {
        id:
          clientId,

        workspaceId:
          workspace.id,
      },

      select: {
        id:
          true,
      },
    });

  if (!client) {
    throw new Error(
      "Cliente não encontrado neste escritório.",
    );
  }

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

            NOT: {
              id:
                clientId,
            },
          },

          select: {
            id:
              true,
          },
        })
      : null;

  if (existingClient) {
    throw new Error(
      "Já existe outro cliente com este CPF.",
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

  /*
   * Somente dados gerais entram
   * sempre no update.
   *
   * Financeiro e Gov.br entram
   * separadamente conforme permissão.
   */
  const updateData:
    Record<
      string,
      unknown
    > = {
    ...clientData,

    birthDate:
      birthDate
        ? new Date(
            birthDate,
          )
        : null,
  };

  if (
    canWriteFinance &&
    formData.has(
      "income",
    )
  ) {
    updateData.income =
      income ??
      null;
  }

  if (canManageGov) {
    if (
      formData.has(
        "govLogin",
      )
    ) {
      updateData.govLogin =
        govLogin ||
        null;
    }

    /*
     * Senha vazia mantém a senha
     * existente.
     */
    if (govPassword) {
      updateData.govPasswordEncrypted =
        Vault.encrypt(
          govPassword,
        );
    }
  }

  await prisma.client.update({
    where: {
      id:
        client.id,
    },

    data:
      updateData,
  });

  revalidatePath(
    `/clientes/${client.id}`,
  );

  revalidatePath(
    `/clientes/${client.id}/editar`,
  );

  redirect(
    `/clientes/${client.id}`,
  );
}
