"use client";

type FormFieldProps = {
  label: string;
  name: string;
  type?: React.HTMLInputTypeAttribute;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string | number;
  mask?: (value: string) => string;
  onBlur?: (value: string) => void | Promise<void>;
};

export function FormField({
  label,
  name,
  type = "text",
  required,
  placeholder,
  defaultValue,
  mask,
  onBlur,
}: FormFieldProps ) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="text-sm font-medium"
      >
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        onChange={(e) => {
          if (mask) {
            e.currentTarget.value = mask(e.currentTarget.value);
          }
        }}
        onBlur={(e) => onBlur?.(e.currentTarget.value)}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-primary"
      />
    </div>
  );
}