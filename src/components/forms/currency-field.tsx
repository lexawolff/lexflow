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

function parseCurrency(value: string): number {
  const numbers = value.replace(/\D/g, "");

  if (!numbers) {
    return 0;
  }

  return Number(numbers) / 100;
}

function formatCurrency(value: unknown): string {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return "";
  }

  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

type CurrencyFieldProps<
  TFieldValues extends FieldValues,
> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder?: string;
  disabled?: boolean;
};

export function CurrencyField<
  TFieldValues extends FieldValues,
>({
  control,
  name,
  label,
  placeholder,
  disabled = false,
}: CurrencyFieldProps<TFieldValues>) {
  const { field, fieldState } = useController({
    control,
    name,
  });

  const numericValue = Number(field.value ?? 0);

  return (
    <FormItem>
      <FormLabel htmlFor={`${name}-display`}>
        {label}
      </FormLabel>

      <FormControl>
        <>
          <input
            id={`${name}-display`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder={placeholder}
            disabled={disabled}
            value={
              numericValue > 0
                ? formatCurrency(numericValue)
                : ""
            }
            onBlur={field.onBlur}
            onChange={(event) => {
              field.onChange(
                parseCurrency(event.target.value),
              );
            }}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          />

          <input
            type="hidden"
            name={field.name}
            value={
              Number.isFinite(numericValue)
                ? String(numericValue)
                : "0"
            }
          />
        </>
      </FormControl>

      <FormMessage
        message={fieldState.error?.message}
      />
    </FormItem>
  );
}