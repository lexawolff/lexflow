"use client";

import {
  type Control,
  type FieldPath,
  type FieldValues,
  useController,
} from "react-hook-form";

import { FormControl } from "./form-control";
import { FormItem } from "./form-item";
import { FormLabel } from "./form-label";
import { FormMessage } from "./form-message";

type Option = {
  label: string;
  value: string;
};

type SelectFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  options: Option[];
  placeholder?: string;
};

export function SelectField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  options,
  placeholder = "Selecione...",
}: SelectFieldProps<TFieldValues>) {
  const { field, fieldState } = useController({
    control,
    name,
  });

  return (
    <FormItem>
      <FormLabel htmlFor={name}>{label}</FormLabel>

      <FormControl>
        <select
          {...field}
          id={name}
          value={field.value ?? ""}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          <option value="">{placeholder}</option>

          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
      </FormControl>

      <FormMessage message={fieldState.error?.message} />
    </FormItem>
  );
}