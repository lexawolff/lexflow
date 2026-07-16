"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
};

export function SubmitButton({
  children,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-white disabled:opacity-70"
    >
      {pending && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}

      {pending ? "Salvando..." : children}
    </button>
  );
}