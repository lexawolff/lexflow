"use client";

import {
  Control,
  FieldPath,
  FieldValues,
  UseFormSetValue,
} from "react-hook-form";

import { TextField } from "./text-field";
import { maskCEP } from "@/lib/masks";
import { fetchAddressByCep } from "@/lib/via-cep";

type CepFieldProps<T extends FieldValues> = {
  control: Control<T>;
  setValue: UseFormSetValue<T>;
};

export function CepField<T extends FieldValues>({
  control,
  setValue,
}: CepFieldProps<T>) {
  async function handleCep(value: string) {
    const cep = value.replace(/\D/g, "");

    if (cep.length !== 8) return;

    const address = await fetchAddressByCep(cep);

    if (!address) return;

    setValue("address" as FieldPath<T>, address.logradouro as any);
    setValue("neighborhood" as FieldPath<T>, address.bairro as any);
    setValue("city" as FieldPath<T>, address.localidade as any);
    setValue("state" as FieldPath<T>, address.uf as any);
  }

  return (
    <TextField
      control={control}
      name={"cep" as FieldPath<T>}
      label="CEP"
      transform={(value) => {
        const masked = maskCEP(value);

        handleCep(masked);

        return masked;
      }}
    />
  );
}