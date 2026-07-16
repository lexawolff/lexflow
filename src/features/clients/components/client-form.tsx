"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createClient } from "../actions/create-client";
import { updateClient } from "../actions/update-client";

import { clientSchema, type ClientFormValues, } from "../schemas/client-schema";

import { getClientFormDefaultValues } from "../utils/get-client-form-default-values";

import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { SelectField } from "@/components/forms/select-field";
import { CpfField } from "@/components/forms/cpf-field";
import { PhoneField } from "@/components/forms/phone-field";
import { CepField } from "@/components/forms/cep-field";
import { CurrencyField } from "@/components/forms/currency-field";
import { PasswordField } from "@/components/forms/password-field";
import { SubmitButton } from "@/components/forms/submit-button";

type ClientFormProps = {
  client?: {
    id: string;

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
};

export function ClientForm({ client }: ClientFormProps) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: getClientFormDefaultValues(client),
  });

  const action = client
    ? updateClient.bind(null, client.id)
    : createClient;

  const { control, setValue, } = form;

  return (
    <form action={action} className="space-y-8">

      {/* Dados pessoais */}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">👤 Dados pessoais</h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

          <TextField
            control={control}
            name="name"
            label="Nome"
          />

          <CpfField
            control={control}
            name="cpf"
          />

          <TextField
            control={control}
            name="rg"
            label="RG"
          />

          <TextField
            control={control}
            name="birthDate"
            label="Data de nascimento"
            type="date"
          />

          <TextField
            control={control}
            name="motherName"
            label="Nome da mãe"
          />

          <TextField
            control={control}
            name="fatherName"
            label="Nome do pai"
          />

          <SelectField
            control={control}
            name="gender"
            label="Sexo"
            options={[
              {
                label: "Masculino",
                value: "Masculino",
              },
              {
                label: "Feminino",
                value: "Feminino",
              },
            ]}
          />

          <SelectField
            control={control}
            name="maritalStatus"
            label="Estado civil"
            options={[
              { label: "Solteiro(a)", value: "Solteiro(a)" },
              { label: "Casado(a)", value: "Casado(a)" },
              { label: "União Estável", value: "União Estável" },
              { label: "Divorciado(a)", value: "Divorciado(a)" },
              { label: "Viúvo(a)", value: "Viúvo(a)" },
            ]}
          />

          <TextField
            control={control}
            label="Nacionalidade"
            name="nationality"
          />

          <TextField
            control={control}
            label="Escolaridade"
            name="education"
          />

          <TextField
            control={control}
            label="Profissão"
            name="profession"
          />

          <CurrencyField
            control={control}
            label="Renda"
            name="income"
          />

          <TextField
            control={control}
            label="PIS"
            name="pis"
          />

        </div>
      </section>

      {/* Contato */}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">📞 Contato</h2>

        <div className="grid gap-4 md:grid-cols-3">

          <PhoneField
            control={control}
            name="phone"
            label="Telefone"
          />

          <PhoneField
            control={control}
            name="whatsapp"
            label="WhatsApp"
          />

          <TextField
            control={control}
            label="E-mail"
            name="email"
            type="email"
          />

        </div>
      </section>

      {/* Endereço */}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">🏠 Endereço</h2>
        <div className="grid gap-4 md:grid-cols-3">

          <CepField
            control={control}
            setValue={setValue}
          />

          <TextField
            control={control}
            label="Endereço"
            name="address"
          />

          <TextField
            control={control}
            label="Número"
            name="addressNumber"
          />

          <TextField
            control={control}
            label="Complemento"
            name="complement"
          />

          <TextField
            control={control}
            label="Bairro"
            name="neighborhood"
          />

          <TextField
            control={control}
            label="Cidade"
            name="city"
          />

          <TextField
            control={control}
            label="Estado"
            name="state"
          />

        </div>

      </section>

      {/* Gov.br */}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">🔐 Gov.br</h2>

        <div className="grid gap-4 md:grid-cols-2">

          <TextField
            control={control}
            label="Login Gov.br"
            name="govLogin"
          />

          <PasswordField
            control={control}
            name="govPassword"
            label="Senha Gov.br"
          />

        </div>
      </section>

      {/* Observações */}

      <TextareaField
        control={control}
        name="notes"
        label="Observações"
      />

      <SubmitButton>
        {client ? "Salvar Alterações" : "Salvar Cliente"}
      </SubmitButton>

    </form>
  );
}