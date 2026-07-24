"use client";

import { FormEvent, useRef, useTransition } from "react";
import { toast } from "sonner";

import { uploadDocument } from "../actions/upload-document";
import { DOCUMENT_CATEGORY_OPTIONS } from "../document-category";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type UploadDocumentFormProps = {
  clientId: string;

  onSuccess?: () => void;
};

export function UploadDocumentForm({
  clientId,
  onSuccess,
}: UploadDocumentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await uploadDocument(formData);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(
        result.message ?? "Documento enviado com sucesso."
      );

      formRef.current?.reset();

      onSuccess?.();
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <input
        type="hidden"
        name="clientId"
        value={clientId}
      />

      <div className="space-y-2">
        <label
          htmlFor="category"
          className="text-sm font-medium"
        >
          Categoria
        </label>

        <select
          id="category"
          name="category"
          required
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">
            Selecione uma categoria
          </option>

          {DOCUMENT_CATEGORY_OPTIONS.map((category) => (
            <option
              key={category.value}
              value={category.value}
            >
              {category.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="file"
          className="text-sm font-medium"
        >
          Arquivo
        </label>

        <Input
          id="file"
          name="file"
          type="file"
          required
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isPending}
        >
          {isPending ? "Enviando..." : "Enviar documento"}
        </Button>
      </div>
    </form>
  );
}