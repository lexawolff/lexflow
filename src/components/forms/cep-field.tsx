"use client";

import {
  Control,
  FieldPath,
  FieldPathValue,
  FieldValues,
  UseFormSetValue,
} from "react-hook-form";

import {
  TextField,
} from "./text-field";

import {
  maskCEP,
} from "@/lib/masks";

import {
  fetchAddressByCep,
} from "@/lib/via-cep";

type CepFieldProps<
  T extends FieldValues,
> = {
  control: Control<T>;
  setValue: UseFormSetValue<T>;
};

export function CepField<
  T extends FieldValues,
>({
  control,
  setValue,
}: CepFieldProps<T>) {
  function setStringField(
    field: FieldPath<T>,
    value: string,
  ) {
    setValue(
      field,
      value as FieldPathValue<
        T,
        FieldPath<T>
      >,
    );
  }

  async function handleCep(
    value: string,
  ) {
    const cep =
      value.replace(
        /\D/g,
        "",
      );

    if (
      cep.length !== 8
    ) {
      return;
    }

    const address =
      await fetchAddressByCep(
        cep,
      );

    if (!address) {
      return;
    }

    setStringField(
      "address" as FieldPath<T>,
      address.logradouro ?? "",
    );

    setStringField(
      "neighborhood" as FieldPath<T>,
      address.bairro ?? "",
    );

    setStringField(
      "city" as FieldPath<T>,
      address.localidade ?? "",
    );

    setStringField(
      "state" as FieldPath<T>,
      address.uf ?? "",
    );
  }

  return (
    <TextField
      control={
        control
      }
      name={
        "cep" as FieldPath<T>
      }
      label="CEP"
      transform={(
        value,
      ) => {
        const masked =
          maskCEP(
            value,
          );

        void handleCep(
          masked,
        );

        return masked;
      }}
    />
  );
}