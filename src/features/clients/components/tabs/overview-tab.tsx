import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientDetails } from "../../types";

type OverviewTabProps = {
  client: ClientDetails;
};

function Field({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-sm">
        {value || "-"}
      </p>
    </div>
  );
}

export function OverviewTab({ client }: OverviewTabProps) {
  return (
    <div className="space-y-6">

      {/* Dados pessoais */}

      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

          <Field label="Nome" value={client.name} />

          <Field label="CPF" value={client.cpf} />

          <Field label="RG" value={client.rg} />

          <Field
            label="Nascimento"
            value={
              client.birthDate
                ? client.birthDate.toLocaleDateString("pt-BR")
                : "-"
            }
          />

          <Field label="Nome da mãe" value={client.motherName} />

          <Field label="Nome do pai" value={client.fatherName} />

          <Field label="Sexo" value={client.gender} />

          <Field label="Estado civil" value={client.maritalStatus} />

          <Field label="Nacionalidade" value={client.nationality} />

          <Field label="Escolaridade" value={client.education} />

          <Field label="Profissão" value={client.profession} />

          <Field
            label="Renda"
            value={
              client.income
                ? Number(client.income).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })
                : "-"
            }
          />

          <Field label="PIS" value={client.pis} />

        </CardContent>
      </Card>

      {/* Contato */}

      <Card>
        <CardHeader>
          <CardTitle>Contato</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-5 md:grid-cols-3">

          <Field label="Telefone" value={client.phone} />

          <Field label="WhatsApp" value={client.whatsapp} />

          <Field label="E-mail" value={client.email} />

        </CardContent>
      </Card>

      {/* Endereço */}

      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-5 md:grid-cols-3">

          <Field label="CEP" value={client.cep} />

          <Field label="Endereço" value={client.address} />

          <Field label="Número" value={client.addressNumber} />

          <Field label="Complemento" value={client.complement} />

          <Field label="Bairro" value={client.neighborhood} />

          <Field label="Cidade" value={client.city} />

          <Field label="Estado" value={client.state} />

        </CardContent>
      </Card>

      {/* Observações */}

      <Card>
        <CardHeader>
          <CardTitle>Observações</CardTitle>
        </CardHeader>

        <CardContent>

          <p className="text-sm leading-7 text-muted-foreground">
            {client.notes || "Nenhuma observação cadastrada."}
          </p>

        </CardContent>
      </Card>

    </div>
  );
}