"use client";

import {
  Control,
  FieldPath,
  FieldValues,
} from "react-hook-form";

import { TextField } from "./text-field";

function maskCurrency(value: string) {
  const numbers = value.replace(/\D/g, "");

  const amount = Number(numbers) / 100;

  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

type CurrencyFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
};

export function CurrencyField<T extends FieldValues>({
  control,
  name,
  label,
}: CurrencyFieldProps<T>) {
  return (
    <TextField
      control={control}
      name={name}
      label={label}
      autoComplete="off"
      transform={maskCurrency}
    />
  );
}