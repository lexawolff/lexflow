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

type TextFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  disabled?: boolean;
  autoComplete?: string;
  transform?: (value: string) => string;
};

export function TextField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  placeholder,
  disabled = false,
  autoComplete,
  transform,
}: TextFieldProps<TFieldValues>) {
  const { field, fieldState } = useController({
    control,
    name,
  });

  return (
    <FormItem>
      <FormLabel htmlFor={name}>{label}</FormLabel>

      <FormControl>
        <input
          {...field}
          id={name}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          value={field.value ?? ""}
          onChange={(e) => {
            field.onChange(
              transform
                ? transform(e.target.value)
                : e.target.value
            );
          }}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </FormControl>

      <FormMessage message={fieldState.error?.message} />
    </FormItem>
  );
}