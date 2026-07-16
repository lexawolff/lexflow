import { NewDemandForm } from "@/features/demands/components/new-demand-form";

export default function NovaDemandaPage() {
  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-8 text-3xl font-bold">
        Nova Demanda
      </h1>

      <NewDemandForm />
    </main>
  );
}