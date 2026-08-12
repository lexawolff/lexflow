"use client";

import {
  type Control,
  type FieldPath,
  type FieldValues,
  useController,
} from "react-hook-form";

import { FormItem } from "./form-item";
import { FormMessage } from "./form-message";

type CheckboxFieldProps<
  TFieldValues extends FieldValues,
> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  description?: string;
  disabled?: boolean;
};

export function CheckboxField<
  TFieldValues extends FieldValues,
>({
  control,
  name,
  label,
  description,
  disabled = false,
}: CheckboxFieldProps<TFieldValues>) {
  const { field, fieldState } = useController({
    control,
    name,
  });

  const checked = Boolean(field.value);

  return (
    <FormItem>
      <div className="flex items-start gap-3 rounded-lg border border-input p-3">
        <input
          id={`${name}-checkbox`}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onBlur={field.onBlur}
          onChange={(event) => {
            field.onChange(event.target.checked);
          }}
          className="mt-0.5 h-4 w-4 cursor-pointer rounded border-input accent-primary disabled:cursor-not-allowed"
        />

        <label
          htmlFor={`${name}-checkbox`}
          className="cursor-pointer space-y-1"
        >
          <span className="block text-sm font-medium">
            {label}
          </span>

          {description ? (
            <span className="block text-xs text-muted-foreground">
              {description}
            </span>
          ) : null}
        </label>

        <input
          type="hidden"
          name={field.name}
          value={String(checked)}
        />
      </div>

      <FormMessage
        message={fieldState.error?.message}
      />
    </FormItem>
  );
}