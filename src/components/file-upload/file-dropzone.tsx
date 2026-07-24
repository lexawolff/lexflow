"use client";

import { ChangeEvent, useRef } from "react";

type FileDropzoneProps = {
  value?: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  disabled?: boolean;
};

export function FileDropzone({
  value,
  onChange,
  accept,
  disabled,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    onChange(file);
  }

  function openFilePicker() {
    if (disabled) return;

    inputRef.current?.click();
  }

  return (
    <>
      <input
        ref={inputRef}
        hidden
        type="file"
        accept={accept}
        onChange={handleSelect}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={openFilePicker}
        className="
          flex
          min-h-44
          w-full
          cursor-pointer
          flex-col
          items-center
          justify-center
          rounded-xl
          border-2
          border-dashed
          border-border
          bg-muted/30
          p-6
          text-center
          transition-colors
          hover:bg-muted
        "
      >
        {value ? (
          <>
            <p className="font-medium">{value.name}</p>

            <p className="mt-2 text-sm text-muted-foreground">
              {(value.size / 1024 / 1024).toFixed(2)} MB
            </p>

            <p className="mt-4 text-sm text-primary">
              Clique para alterar o arquivo
            </p>
          </>
        ) : (
          <>
            <p className="font-medium">
              Clique para selecionar um arquivo
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              ou arraste um arquivo para esta área
            </p>

            <p className="mt-4 text-xs text-muted-foreground">
              PDF, JPG, PNG...
            </p>
          </>
        )}
      </button>
    </>
  );
}