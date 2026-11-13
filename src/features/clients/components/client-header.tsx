import Link from "next/link";

import {
  Briefcase,
  CreditCard,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import {
  AddToWorkQueue,
} from "@/features/work/components/add-to-work-queue";

import type {
  ClientDetails,
} from "../types";

import {
  DeleteClientButton,
} from "./delete-client-button";

type ClientHeaderProps = {
  client:
    ClientDetails;

  canCreateCase:
    boolean;

  canCreateWork:
    boolean;

  canEditClient:
    boolean;

  canDeleteClient:
    boolean;
};

export function ClientHeader({
  client,
  canCreateCase,
  canCreateWork,
  canEditClient,
  canDeleteClient,
}: ClientHeaderProps) {
  const whatsappNumber =
    (
      client.whatsapp ||
      client.phone ||
      ""
    ).replace(
      /\D/g,
      "",
    );

  const workCases =
    client.cases.map(
      (caseItem) => ({
        id:
          caseItem.id,

        title:
          caseItem.title,

        number:
          caseItem.number ??
          caseItem.administrativeNumber ??
          null,
      }),
    );

  return (
    <div className="rounded-2xl border bg-card p-8 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              {client.name
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <h1 className="text-3xl font-bold">
                {client.name}
              </h1>

              <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />

                  {client.cpf ||
                    "-"}
                </div>

                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />

                  {client.profession ||
                    "-"}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />

              {client.whatsapp ||
                client.phone ||
                "-"}
            </div>

            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />

              {client.email ||
                "-"}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {canCreateCase ? (
            <Link
              href={`/clientes/${client.id}/casos/novo`}
            >
              <Button>
                <Plus className="mr-2 h-4 w-4" />

                Novo caso
              </Button>
            </Link>
          ) : null}

          {canCreateWork ? (
            <AddToWorkQueue
              clientId={
                client.id
              }
              clientName={
                client.name
              }
              cases={
                workCases
              }
            />
          ) : null}

          {canEditClient ? (
            <Link
              href={`/clientes/${client.id}/editar`}
            >
              <Button variant="outline">
                <Pencil className="mr-2 h-4 w-4" />

                Editar
              </Button>
            </Link>
          ) : null}

          <a
            href={
              whatsappNumber
                ? `https://wa.me/55${whatsappNumber}`
                : undefined
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              disabled={
                !whatsappNumber
              }
            >
              <MessageCircle className="mr-2 h-4 w-4" />

              WhatsApp
            </Button>
          </a>

          {canDeleteClient ? (
            <DeleteClientButton
              clientId={
                client.id
              }
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}