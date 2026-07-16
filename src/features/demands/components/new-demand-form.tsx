"use client";

import { createDemand } from "../actions/create-demand";
import { PRACTICE_AREAS } from "../constants";

export function NewDemandForm() {
  return (
    <form action={createDemand} className="space-y-6">

      <div>
        <label className="block text-sm font-medium mb-2">
          Cliente
        </label>

        <input
          name="clientId"
          placeholder="Em breve será um autocomplete..."
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Área
        </label>

        <select
          name="practiceArea"
          className="w-full rounded-lg border p-3"
          defaultValue="PREVIDENCIARIO"
        >
          {PRACTICE_AREAS.map((area) => (
            <option key={area.value} value={area.value}>
              {area.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Tipo da demanda
        </label>

        <input
          name="subject"
          placeholder="Ex.: Auxílio por Incapacidade"
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Resumo
        </label>

        <textarea
          name="summary"
          rows={5}
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Próxima ação
        </label>

        <input
          name="nextAction"
          defaultValue="Solicitar documentos"
          className="w-full rounded-lg border p-3"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Prazo
        </label>

        <input
          type="date"
          name="dueDate"
          className="w-full rounded-lg border p-3"
        />
      </div>

      <button
        type="submit"
        className="rounded-lg bg-primary px-5 py-3 text-white font-medium hover:opacity-90"
      >
        Criar Demanda
      </button>

    </form>
  );
}