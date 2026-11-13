import Link from "next/link";

import {
  CalendarPlus,
  FilePlus2,
  Pencil,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  CreateAgendaTaskDialog,
} from "@/features/agenda/components/create-agenda-task-dialog";

import type {
  AgendaClientOption,
} from "@/features/agenda/types/agenda";

import type {
  ClientDetails,
} from "../../types";

import {
  formatDate,
} from "@/lib/format/date";

type OverviewTabProps = {
  client:
    ClientDetails;

  canCreateAgenda:
    boolean;

  canCreateCase:
    boolean;

  canEditClient:
    boolean;

  canViewFinance:
    boolean;
};

const TIME_ZONE =
  "America/Sao_Paulo";

function getTodayKey(): string {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        TIME_ZONE,

      year:
        "numeric",

      month:
        "2-digit",

      day:
        "2-digit",
    },
  ).format(
    new Date(),
  );
}

function Field({
  label,
  value,
}: {
  label:
    string;

  value?:
    string |
    number |
    null;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium">
        {value ||
          "-"}
      </p>
    </div>
  );
}

export function OverviewTab({
  client,
  canCreateAgenda,
  canCreateCase,
  canEditClient,
  canViewFinance,
}: OverviewTabProps) {
  const todayKey =
    getTodayKey();

  const agendaClients:
    AgendaClientOption[] =
    [
      {
        id:
          client.id,

        name:
          client.name,

        cases:
          client.cases.map(
            (
              clientCase,
            ) => ({
              id:
                clientCase.id,

              title:
                clientCase.title,

              number:
                clientCase.number,
            }),
          ),
      },
    ];

  const hasQuickActions =
    canCreateAgenda ||
    canCreateCase ||
    canEditClient;

  return (
    <div className="space-y-6">
      {hasQuickActions ? (
        <Card className="border-blue-200 bg-blue-50/30 dark:border-blue-900 dark:bg-blue-950/10">
          <CardHeader>
            <div>
              <CardTitle>
                Ações rápidas
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Cadastre informações e compromissos diretamente para este cliente.
              </p>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex flex-wrap gap-3">
              {canCreateAgenda ? (
                <CreateAgendaTaskDialog
                  clients={
                    agendaClients
                  }
                  todayKey={
                    todayKey
                  }
                  initialClientId={
                    client.id
                  }
                  lockClient
                  triggerLabel="Novo compromisso"
                />
              ) : null}

              {canCreateCase ? (
                <Link
                  href={`/clientes/${client.id}/casos/novo`}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium transition hover:bg-muted"
                >
                  <FilePlus2 className="size-4" />

                  Novo caso
                </Link>
              ) : null}

              {canEditClient ? (
                <Link
                  href={`/clientes/${client.id}/editar`}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium transition hover:bg-muted"
                >
                  <Pencil className="size-4" />

                  Editar cliente
                </Link>
              ) : null}
            </div>

            {canCreateAgenda ? (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-200/70 bg-background/60 px-3 py-2.5 text-xs text-muted-foreground dark:border-blue-900">
                <CalendarPlus className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />

                <p>
                  Ao criar um compromisso por aqui, o cliente já fica definido. Você pode vinculá-lo a um dos casos deste cliente ou deixá-lo como compromisso geral.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>
            Dados pessoais
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Field
            label="Nome"
            value={
              client.name
            }
          />

          <Field
            label="CPF"
            value={
              client.cpf
            }
          />

          <Field
            label="RG"
            value={
              client.rg
            }
          />

          <Field
            label="Nascimento"
            value={
              client.birthDate
                ? formatDate(
                    client.birthDate,
                  )
                : "-"
            }
          />

          <Field
            label="Nome da mãe"
            value={
              client.motherName
            }
          />

          <Field
            label="Nome do pai"
            value={
              client.fatherName
            }
          />

          <Field
            label="Gênero"
            value={
              client.gender
            }
          />

          <Field
            label="Estado civil"
            value={
              client.maritalStatus
            }
          />

          <Field
            label="Nacionalidade"
            value={
              client.nationality
            }
          />

          <Field
            label="Escolaridade"
            value={
              client.education
            }
          />

          <Field
            label="Profissão"
            value={
              client.profession
            }
          />

          {canViewFinance ? (
            <Field
              label="Renda"
              value={
                client.income !=
                null
                  ? Number(
                      client.income,
                    ).toLocaleString(
                      "pt-BR",
                      {
                        style:
                          "currency",

                        currency:
                          "BRL",
                      },
                    )
                  : "-"
              }
            />
          ) : null}

          <Field
            label="PIS"
            value={
              client.pis
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Contato
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-5 md:grid-cols-3">
          <Field
            label="Telefone"
            value={
              client.phone
            }
          />

          <Field
            label="WhatsApp"
            value={
              client.whatsapp
            }
          />

          <Field
            label="E-mail"
            value={
              client.email
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Endereço
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Field
            label="CEP"
            value={
              client.cep
            }
          />

          <Field
            label="Endereço"
            value={
              client.address
            }
          />

          <Field
            label="Número"
            value={
              client.addressNumber
            }
          />

          <Field
            label="Complemento"
            value={
              client.complement
            }
          />

          <Field
            label="Bairro"
            value={
              client.neighborhood
            }
          />

          <Field
            label="Cidade"
            value={
              client.city
            }
          />

          <Field
            label="Estado"
            value={
              client.state
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Observações
          </CardTitle>
        </CardHeader>

        <CardContent>
          <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
            {client.notes ||
              "Nenhuma observação cadastrada."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}