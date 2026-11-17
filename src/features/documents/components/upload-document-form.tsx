"use client";

import { FormEvent, useRef, useTransition } from "react";
import { toast } from "sonner";

import { uploadDocument } from "../actions/upload-document";
import { DOCUMENT_CATEGORY_OPTIONS } from "../document-category";
import {
  DOCUMENT_INPUT_ACCEPT,
  DOCUMENT_UPLOAD_HINT,
  validateDocumentFile,
} from "../document-upload-rules";

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

    /*
     * Validamos antes de enviar para não
     * transferir um arquivo que o servidor
     * vai recusar (o servidor valida de novo).
     */
    const file = formData.get("file");

    if (file instanceof File) {
      const fileError = validateDocumentFile(file);

      if (fileError) {
        toast.error(fileError);
        return;
      }
    }

    startTransition(async () => {
      let result: Awaited<ReturnType<typeof uploadDocument>>;

      try {
        result = await uploadDocument(formData);
      } catch (error) {
        console.error(error);

        toast.error(
          "Não foi possível enviar o documento. Verifique sua conexão e tente novamente."
        );

        return;
      }

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
          accept={DOCUMENT_INPUT_ACCEPT}
          aria-describedby="file-hint"
          required
        />

        <p
          id="file-hint"
          className="text-xs text-muted-foreground"
        >
          {DOCUMENT_UPLOAD_HINT}
        </p>
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