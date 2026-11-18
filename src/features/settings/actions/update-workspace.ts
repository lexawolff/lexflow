"use server";

import {
  isValidCnpj,
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

export type UpdateWorkspaceResult =
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

  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
}

function optionalText(
  value: string,
) {
  return value.length > 0
    ? value
    : null;
}

function onlyDigits(
  value: string,
) {
  return value.replace(
    /\D/g,
    "",
  );
}

function normalizeWebsite(
  value: string,
) {
  if (!value) {
    return null;
  }

  const candidate =
    /^https?:\/\//i.test(
      value,
    )
      ? value
      : `https://${value}`;

  try {
    const url =
      new URL(
        candidate,
      );

    if (
      url.protocol !==
        "http:" &&
      url.protocol !==
        "https:"
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export async function updateWorkspaceAction(
  formData: FormData,
): Promise<UpdateWorkspaceResult> {
  const {
    workspace,
  } =
    await requireWorkspacePermission(
      "OFFICE_MANAGE",
    );

  const name =
    readText(
      formData,
      "name",
    );

  const legalName =
    readText(
      formData,
      "legalName",
    );

  const cnpjRaw =
    readText(
      formData,
      "cnpj",
    );

  const oabRegistration =
    readText(
      formData,
      "oabRegistration",
    );

  const oabState =
    readText(
      formData,
      "oabState",
    ).toUpperCase();

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

  const whatsappRaw =
    readText(
      formData,
      "whatsapp",
    );

  const websiteRaw =
    readText(
      formData,
      "website",
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

  if (
    name.length < 2
  ) {
    return {
      success: false,

      error:
        "Informe o nome do escritório.",
    };
  }

  if (
    name.length > 120
  ) {
    return {
      success: false,

      error:
        "O nome do escritório é muito longo.",
    };
  }

  const cnpj =
    normalizeTaxId(
      cnpjRaw,
    );

  if (
    cnpj &&
    !isValidCnpj(
      cnpj,
    )
  ) {
    return {
      success: false,

      error:
        "Informe um CNPJ válido.",
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
        "Informe um e-mail válido.",
    };
  }

  const phone =
    onlyDigits(
      phoneRaw,
    );

  if (
    phone &&
    ![
      10,
      11,
    ].includes(
      phone.length,
    )
  ) {
    return {
      success: false,

      error:
        "Informe um telefone válido.",
    };
  }

  const whatsapp =
    onlyDigits(
      whatsappRaw,
    );

  if (
    whatsapp &&
    ![
      10,
      11,
    ].includes(
      whatsapp.length,
    )
  ) {
    return {
      success: false,

      error:
        "Informe um WhatsApp válido.",
    };
  }

  const cep =
    onlyDigits(
      cepRaw,
    );

  if (
    cep &&
    cep.length !== 8
  ) {
    return {
      success: false,

      error:
        "Informe um CEP válido com 8 dígitos.",
    };
  }

  if (
    state &&
    state.length !== 2
  ) {
    return {
      success: false,

      error:
        "A UF do endereço deve possuir 2 letras.",
    };
  }

  if (
    oabState &&
    oabState.length !== 2
  ) {
    return {
      success: false,

      error:
        "A UF do registro na OAB deve possuir 2 letras.",
    };
  }

  const website =
    normalizeWebsite(
      websiteRaw,
    );

  if (
    websiteRaw &&
    !website
  ) {
    return {
      success: false,

      error:
        "Informe um endereço de site válido.",
    };
  }

  try {
    await prisma.workspace.update({
      where: {
        id:
          workspace.id,
      },

      data: {
        name,

        legalName:
          optionalText(
            legalName,
          ),

        cnpj:
          cnpj ||
          null,

        oabRegistration:
          optionalText(
            oabRegistration,
          ),

        oabState:
          optionalText(
            oabState,
          ),

        email:
          optionalText(
            email,
          ),

        phone:
          phone ||
          null,

        whatsapp:
          whatsapp ||
          null,

        website,

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
      "/configuracoes/escritorio",
    );

    revalidatePath(
      "/dashboard",
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "Erro ao atualizar escritório:",
      error,
    );

    return {
      success: false,

      error:
        "Não foi possível salvar os dados do escritório.",
    };
  }
}