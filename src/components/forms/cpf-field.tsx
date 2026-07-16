"use client";

import {
  Control,
  FieldPath,
  FieldValues,
} from "react-hook-form";

import { TextField } from "./text-field";
import { maskCPF } from "@/lib/masks";

type CpfFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
};

export function CpfField<T extends FieldValues>({
  control,
  name,
  label = "CPF",
}: CpfFieldProps<T>) {
  return (
    <TextField
      control={control}
      name={name}
      label={label}
      autoComplete="off"
      transform={maskCPF}
    />
  );
}