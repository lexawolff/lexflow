"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  Control,
  FieldPath,
  FieldValues,
} from "react-hook-form";

import { TextField } from "./text-field";

type PasswordFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
};

export function PasswordField<T extends FieldValues>({
  control,
  name,
  label,
}: PasswordFieldProps<T>) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <TextField
        control={control}
        name={name}
        label={label}
        type={show ? "text" : "password"}
      />

      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-[38px] text-muted-foreground hover:text-foreground"
      >
        {show ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}