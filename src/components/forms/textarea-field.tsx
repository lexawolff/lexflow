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

type TextareaFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder?: string;
  rows?: number;
};

export function TextareaField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  rows = 4,
}: TextareaFieldProps<TFieldValues>) {
  const { field, fieldState } = useController({
    control,
    name,
  });

  return (
    <FormItem>
      <FormLabel htmlFor={name}>{label}</FormLabel>

      <FormControl>
        <textarea
          {...field}
          id={name}
          rows={rows}
          placeholder={placeholder}
          value={field.value ?? ""}
          className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </FormControl>

      <FormMessage message={fieldState.error?.message} />
    </FormItem>
  );
}