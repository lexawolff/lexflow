/*
 * Caixa de aceite dos documentos legais. O servidor exige o aceite e
 * registra versão e data (User.termsVersion / termsAcceptedAt).
 */
export function AcceptTermsField() {
  const linkClass = "font-medium text-primary underline underline-offset-2";

  return (
    <div className="flex items-start gap-3 rounded-xl border bg-muted/20 p-3 text-sm">
      <input
        id="acceptTerms"
        name="acceptTerms"
        type="checkbox"
        required
        className="mt-0.5 size-4 shrink-0 accent-primary"
      />

      <label
        htmlFor="acceptTerms"
        className="leading-relaxed text-muted-foreground"
      >
        Li e aceito os{" "}
        <a
          href="/termos"
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          Termos de Uso
        </a>
        , incluindo o Anexo de Tratamento de Dados, e a{" "}
        <a
          href="/privacidade"
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          Política de Privacidade
        </a>
        .
      </label>
    </div>
  );
}
