"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
    caseSchema,
    type CaseFormValues,
} from "../schemas/case-schema";

import { getCaseFormDefaultValues } from "../utils/get-case-form-default-values";

import { createCase } from "../actions/create-case";
import { updateCase } from "../actions/update-case";

import { TextField } from "@/components/forms/text-field";
import { TextareaField } from "@/components/forms/textarea-field";
import { SelectField } from "@/components/forms/select-field";

import {
    ADMINISTRATIVE_STATUS_OPTIONS,
    CASE_ORIGIN_OPTIONS,
    CASE_STATUS_OPTIONS,
    PRACTICE_AREA_OPTIONS,
} from "../constants";

type CaseFormProps = {
    clientId: string;

    case?: {
        id: string;

        title: string;
        practiceArea: string;

        subject: string | null;
        benefitType: string | null;

        origin: string;
        administrativeStatus: string;

        number: string | null;
        administrativeNumber: string | null;
        administrativeProcess: string | null;

        court: string | null;
        courtUnit: string | null;
        judge: string | null;
        city: string | null;
        state: string | null;

        opposingParty: string | null;

        claimValue: number | null;

        status: string;

        administrativeRequestDate: Date | null;
        distributionDate: Date | null;
        nextDeadline: Date | null;

        notes: string | null;
    };
};

export function CaseForm({
    clientId,
    case: caseData,
}: CaseFormProps) {
    const form = useForm<CaseFormValues>({
        resolver: zodResolver(caseSchema),
        defaultValues: getCaseFormDefaultValues(caseData),
    });

    const action = caseData
        ? updateCase.bind(null, caseData.id)
        : createCase.bind(null, clientId);

    const { control } = form;

    return (
        <form action={action} className="space-y-8">

            {/* Identificação */}

            <section className="space-y-4">
                <h2 className="text-lg font-semibold">
                    📋 Identificação
                </h2>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                    <TextField
                        control={control}
                        name="title"
                        label="Título da demanda"
                    />

                    <SelectField
                        control={control}
                        name="practiceArea"
                        label="Área"
                        options={PRACTICE_AREA_OPTIONS}
                    />

                    <TextField
                        control={control}
                        name="benefitType"
                        label="Tipo da demanda"
                    />

                    <TextField
                        control={control}
                        name="subject"
                        label="Objeto"
                    />

                </div>
            </section>

            {/* Origem */}

            <section className="space-y-4">
                <h2 className="text-lg font-semibold">
                    ⚖️ Origem
                </h2>

                <div className="grid gap-4 md:grid-cols-3">

                    <SelectField
                        control={control}
                        name="origin"
                        label="Origem"
                        options={CASE_ORIGIN_OPTIONS}
                    />

                    <SelectField
                        control={control}
                        name="administrativeStatus"
                        label="Situação Administrativa"
                        options={ADMINISTRATIVE_STATUS_OPTIONS}
                    />

                    <SelectField
                        control={control}
                        name="status"
                        label="Status"
                        options={CASE_STATUS_OPTIONS}
                    />

                </div>
            </section>

            {/* Numeração */}

            <section className="space-y-4">
                <h2 className="text-lg font-semibold">
                    🔢 Numeração
                </h2>

                <div className="grid gap-4 md:grid-cols-3">

                    <TextField
                        control={control}
                        name="number"
                        label="Processo Judicial"
                    />

                    <TextField
                        control={control}
                        name="administrativeNumber"
                        label="NB"
                    />

                    <TextField
                        control={control}
                        name="administrativeProcess"
                        label="Processo Administrativo"
                    />

                </div>
            </section>

            {/* Órgão Julgador */}

            <section className="space-y-4">
                <h2 className="text-lg font-semibold">
                    🏛️ Órgão Julgador
                </h2>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

                    <TextField
                        control={control}
                        name="court"
                        label="Tribunal"
                    />

                    <TextField
                        control={control}
                        name="courtUnit"
                        label="Vara"
                    />

                    <TextField
                        control={control}
                        name="judge"
                        label="Juiz"
                    />

                    <TextField
                        control={control}
                        name="city"
                        label="Cidade"
                    />

                    <TextField
                        control={control}
                        name="state"
                        label="UF"
                    />

                </div>
            </section>
            {/* Partes */}

            <section className="space-y-4">
                <h2 className="text-lg font-semibold">
                    👥 Partes
                </h2>

                <div className="grid gap-4 md:grid-cols-2">
                    <TextField
                        control={control}
                        name="opposingParty"
                        label="Parte Contrária"
                    />
                </div>
            </section>
            {/* Financeiro */}

            <section className="space-y-4">
                <h2 className="text-lg font-semibold">
                    💰 Financeiro
                </h2>

                <div className="grid gap-4 md:grid-cols-2">
                    <TextField
                        control={control}
                        name="claimValue"
                        label="Valor da Causa"
                        type="number"
                    />
                </div>
            </section>
            {/* Datas */}

            <section className="space-y-4">
                <h2 className="text-lg font-semibold">
                    📅 Datas
                </h2>

                <div className="grid gap-4 md:grid-cols-3">

                    <TextField
                        control={control}
                        name="administrativeRequestDate"
                        label="DER"
                        type="date"
                    />

                    <TextField
                        control={control}
                        name="distributionDate"
                        label="Distribuição"
                        type="date"
                    />

                    <TextField
                        control={control}
                        name="nextDeadline"
                        label="Próximo Prazo"
                        type="date"
                    />

                </div>
            </section>
            <TextareaField
                control={control}
                name="notes"
                label="Observações"
            />
            <button
                type="submit"
                className="rounded-lg bg-primary px-6 py-3 text-white"
            >
                {caseData ? "Salvar Alterações" : "Salvar Demanda"}
            </button>
        </form>
    );
}