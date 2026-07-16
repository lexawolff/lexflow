import Link from "next/link";
import {
  Pencil,
  Plus,
  MessageCircle,
  ShieldCheck,
  Phone,
  Mail,
  Briefcase,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ClientDetails } from "../types";
import { DeleteClientButton } from "./delete-client-button";

type ClientHeaderProps = {
  client: ClientDetails;
};

export function ClientHeader({ client }: ClientHeaderProps) {
  return (
    <div className="rounded-2xl border bg-card p-8 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                {client.name}
              </h1>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  {client.cpf || "-"}
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  {client.profession || "-"}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {client.whatsapp || client.phone || "-"}
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {client.email || "-"}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={`/nova-demanda?clientId=${client.id}`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Demanda
            </Button>
          </Link>
          <Link href={`/clientes/${client.id}/editar`}>
            <Button variant="outline">
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
          <a
            href={`https://wa.me/55${(client.whatsapp || client.phone || "")
              .replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              disabled={!client.whatsapp && !client.phone}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              WhatsApp
            </Button>
          </a>
          <DeleteClientButton clientId={client.id} />
        </div>
      </div>
    </div>
  );
}