"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { Vault } from "@/lib/security/vault";
import { getDefaultWorkspace } from "@/lib/workspace";

import { clientSchema } from "../schemas/client-schema";

export async function createClient(formData: FormData) {
  const workspace = await getDefaultWorkspace();

  const parsed = clientSchema.safeParse({
    // Dados pessoais
    name: formData.get("name"),
    cpf: formData.get("cpf"),
    rg: formData.get("rg"),
    birthDate: formData.get("birthDate") || undefined,

    motherName: formData.get("motherName"),
    fatherName: formData.get("fatherName"),

    gender: formData.get("gender"),
    maritalStatus: formData.get("maritalStatus"),

    nationality: formData.get("nationality"),
    education: formData.get("education"),

    profession: formData.get("profession"),
    income: formData.get("income") || undefined,

    // Contato
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email"),

    // Endereço
    cep: formData.get("cep"),
    address: formData.get("address"),
    addressNumber: formData.get("addressNumber"),
    complement: formData.get("complement"),
    neighborhood: formData.get("neighborhood"),
    city: formData.get("city"),
    state: formData.get("state"),

    // Previdenciário
    pis: formData.get("pis"),

    // Gov.br
    govLogin: formData.get("govLogin"),
    govPassword: formData.get("govPassword"),

    // Observações
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    console.error(parsed.error.flatten());

    throw new Error("Dados inválidos.");
  }

  const existingClient = parsed.data.cpf
    ? await prisma.client.findFirst({
        where: {
          workspaceId: workspace.id,
          cpf: parsed.data.cpf,
        },
      })
    : null;

  if (existingClient) {
    throw new Error("Já existe um cliente cadastrado com este CPF.");
  }

  const { govPassword, birthDate, ...clientData } = parsed.data;

  const client = await prisma.client.create({
    data: {
      workspaceId: workspace.id,

      ...clientData,

      birthDate: birthDate
        ? new Date(birthDate)
        : null,

      govPasswordEncrypted: govPassword
        ? Vault.encrypt(govPassword)
        : null,
    },
  });

  redirect(`/clientes/${client.id}`);
}