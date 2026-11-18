"use server";

import {
  isValidTaxId,
  normalizeTaxId,
} from "@/lib/br-documents";

import {
  revalidatePath,
} from "next/cache";

import {
  requireWorkspacePermission,
} from "@/lib/permissions";

import {
  prisma,
} from "@/lib/prisma";

export type UpdateBillingProfileResult =
  | {
      success: true;
    }
  | {
      success: false;
      error: string;
    };

function readText(
  formData: FormData,
  key: string,
) {
  const value =
    formData.get(
      key,
    );

  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function optionalText(
  value: string,
) {
  return value
    ? value
    : null;
}

function digits(
  value: string,
) {
  return value.replace(
    /\D/g,
    "",
  );
}

export async function updateBillingProfileAction(
  formData: FormData,
): Promise<UpdateBillingProfileResult> {
  const {
    workspace,
  } =
    await requireWorkspacePermission(
      "BILLING_MANAGE",
    );

  const name =
    readText(
      formData,
      "name",
    );

  const taxIdRaw =
    readText(
      formData,
      "taxId",
    );

  const email =
    readText(
      formData,
      "email",
    );

  const phoneRaw =
    readText(
      formData,
      "phone",
    );

  const cepRaw =
    readText(
      formData,
      "cep",
    );

  const address =
    readText(
      formData,
      "address",
    );

  const addressNumber =
    readText(
      formData,
      "addressNumber",
    );

  const complement =
    readText(
      formData,
      "complement",
    );

  const neighborhood =
    readText(
      formData,
      "neighborhood",
    );

  const city =
    readText(
      formData,
      "city",
    );

  const state =
    readText(
      formData,
      "state",
    ).toUpperCase();

  const taxId =
    normalizeTaxId(
      taxIdRaw,
    );

  if (
    taxId &&
    !isValidTaxId(
      taxId,
    )
  ) {
    return {
      success: false,

      error:
        "Informe um CPF ou CNPJ válido.",
    };
  }

  if (
    email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email,
    )
  ) {
    return {
      success: false,

      error:
        "Informe um e-mail de cobrança válido.",
    };
  }

  const phone =
    digits(
      phoneRaw,
    );

  if (
    phone &&
    phone.length !== 10 &&
    phone.length !== 11
  ) {
    return {
      success: false,

      error:
        "Informe um telefone válido.",
    };
  }

  const cep =
    digits(
      cepRaw,
    );

  if (
    cep &&
    cep.length !== 8
  ) {
    return {
      success: false,

      error:
        "Informe um CEP válido.",
    };
  }

  if (
    state &&
    state.length !== 2
  ) {
    return {
      success: false,

      error:
        "A UF deve possuir 2 letras.",
    };
  }

  try {
    await prisma.billingProfile.upsert({
      where: {
        workspaceId:
          workspace.id,
      },

      create: {
        workspaceId:
          workspace.id,

        name:
          optionalText(
            name,
          ),

        taxId:
          taxId ||
          null,

        email:
          optionalText(
            email,
          ),

        phone:
          phone ||
          null,

        cep:
          cep ||
          null,

        address:
          optionalText(
            address,
          ),

        addressNumber:
          optionalText(
            addressNumber,
          ),

        complement:
          optionalText(
            complement,
          ),

        neighborhood:
          optionalText(
            neighborhood,
          ),

        city:
          optionalText(
            city,
          ),

        state:
          optionalText(
            state,
          ),
      },

      update: {
        name:
          optionalText(
            name,
          ),

        taxId:
          taxId ||
          null,

        email:
          optionalText(
            email,
          ),

        phone:
          phone ||
          null,

        cep:
          cep ||
          null,

        address:
          optionalText(
            address,
          ),

        addressNumber:
          optionalText(
            addressNumber,
          ),

        complement:
          optionalText(
            complement,
          ),

        neighborhood:
          optionalText(
            neighborhood,
          ),

        city:
          optionalText(
            city,
          ),

        state:
          optionalText(
            state,
          ),
      },
    });

    revalidatePath(
      "/configuracoes",
    );

    revalidatePath(
      "/configuracoes/assinatura",
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "Erro ao atualizar dados de cobrança:",
      error,
    );

    return {
      success: false,

      error:
        "Não foi possível salvar os dados de cobrança.",
    };
  }
}