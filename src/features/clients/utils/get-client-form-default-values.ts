import type { ClientFormValues } from "../schemas/client-schema";

type ClientFormSource = {
  name: string;
  cpf: string | null;
  rg: string | null;
  birthDate: Date | null;
  motherName: string | null;
  fatherName: string | null;
  gender: string | null;
  maritalStatus: string | null;
  nationality: string | null;
  education: string | null;
  profession: string | null;
  income: number | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  cep: string | null;
  address: string | null;
  addressNumber: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  pis: string | null;
  govLogin: string | null;
  notes: string | null;
};

export function getClientFormDefaultValues(
  client?: ClientFormSource
): ClientFormValues {
  return {
    name: client?.name ?? "",
    cpf: client?.cpf ?? "",
    rg: client?.rg ?? "",

    birthDate: client?.birthDate
      ? client.birthDate.toISOString().split("T")[0]
      : "",

    motherName: client?.motherName ?? "",
    fatherName: client?.fatherName ?? "",

    gender: client?.gender ?? "",
    maritalStatus: client?.maritalStatus ?? "",

    nationality: client?.nationality ?? "",
    education: client?.education ?? "",

    profession: client?.profession ?? "",
    income: client?.income ?? undefined,

    phone: client?.phone ?? "",
    whatsapp: client?.whatsapp ?? "",
    email: client?.email ?? "",

    cep: client?.cep ?? "",
    address: client?.address ?? "",
    addressNumber: client?.addressNumber ?? "",
    complement: client?.complement ?? "",
    neighborhood: client?.neighborhood ?? "",
    city: client?.city ?? "",
    state: client?.state ?? "",

    pis: client?.pis ?? "",

    govLogin: client?.govLogin ?? "",
    govPassword: "",

    notes: client?.notes ?? "",
  };
}