import { AppShell } from "@/components/app-shell/app-shell";
import { LFStatCard } from "@/components/lf/LFStatCard";
import { Card, CardContent } from "@/components/ui/card";
import { CreatePersonDialog } from "@/features/people/components/create-person-dialog";
import { getDefaultWorkspace } from "@/lib/workspace";
import { prisma } from "@/lib/prisma";
import { Briefcase, FolderOpen, Users } from "lucide-react";

export default async function PessoasPage() {
  const workspace = await getDefaultWorkspace();

  const people = await prisma.client.findMany({
    where: {
      workspaceId: workspace.id,
    },
    include: {
      cases: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalPeople = people.length;

  const totalWithCases = people.filter(
    (person) => person.cases.length > 0
  ).length;

  const totalThisMonth = people.filter((person) => {
    const now = new Date();

    return (
      person.createdAt.getMonth() === now.getMonth() &&
      person.createdAt.getFullYear() === now.getFullYear()
    );
  }).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pessoas</h1>
            <p className="mt-1 text-muted-foreground">
              Cadastre clientes, contatos e pessoas vinculadas ao escritório.
            </p>
          </div>

          <CreatePersonDialog />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <LFStatCard title="Pessoas" value={totalPeople} icon={Users} />
          <LFStatCard
            title="Com casos"
            value={totalWithCases}
            icon={Briefcase}
          />
          <LFStatCard
            title="Novas este mês"
            value={totalThisMonth}
            icon={FolderOpen}
          />
        </div>

        {people.length === 0 ? (
          <Card>
            <CardContent className="flex h-56 flex-col items-center justify-center text-center">
              <h2 className="text-lg font-semibold">
                Nenhuma pessoa cadastrada
              </h2>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Comece cadastrando sua primeira pessoa. Ela poderá ser vinculada
                a atendimentos, casos, documentos e financeiro.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {people.map((person) => (
              <Card key={person.id} className="shadow-none transition hover:bg-muted/40">
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <h2 className="font-semibold">{person.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {person.cpf || "CPF não informado"} •{" "}
                      {person.whatsapp ||
                        person.phone ||
                        "Telefone não informado"}
                    </p>
                  </div>

                  <div className="text-right text-sm text-muted-foreground">
                    <p>{person.city || "Cidade não informada"}</p>
                    <p>{person.cases.length} caso(s)</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}