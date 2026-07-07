"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getDefaultWorkspace } from "@/lib/workspace";
import { personSchema } from "../schemas/person-schema";

export async function createPerson(formData: FormData) {
  const workspace = await getDefaultWorkspace();

  const rawData = {
    name: formData.get("name"),
    cpf: formData.get("cpf"),
    phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp"),
    email: formData.get("email"),
    city: formData.get("city"),
    state: formData.get("state"),
    profession: formData.get("profession"),
    notes: formData.get("notes"),
  };

  const parsed = personSchema.safeParse(rawData);

  if (!parsed.success) {
    throw new Error("Dados inválidos");
  }

  await prisma.client.create({
    data: {
      workspaceId: workspace.id,
      name: parsed.data.name,
      cpf: parsed.data.cpf || null,
      phone: parsed.data.phone || null,
      whatsapp: parsed.data.whatsapp || null,
      email: parsed.data.email || null,
      city: parsed.data.city || null,
      state: parsed.data.state || null,
      profession: parsed.data.profession || null,
      notes: parsed.data.notes || null,
    },
  });

  revalidatePath("/pessoas");
}