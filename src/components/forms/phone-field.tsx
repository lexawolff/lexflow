"use client";

import {
  Control,
  FieldPath,
  FieldValues,
} from "react-hook-form";

import { TextField } from "./text-field";
import { maskPhone } from "@/lib/masks";

type PhoneFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
};

export function PhoneField<T extends FieldValues>({
  control,
  name,
  label,
}: PhoneFieldProps<T>) {
  return (
    <TextField
      control={control}
      name={name}
      label={label}
      autoComplete="off"
      transform={maskPhone}
    />
  );
}