"use client";

import {
  useEffect,
} from "react";

type GlobalErrorProps = {
  error: Error & {
    digest?: string;
  };

  reset: () => void;
};

/*
 * Último recurso: só aparece quando o
 * próprio layout raiz falha. Precisa
 * renderizar <html> e <body> e não pode
 * depender do CSS global, por isso usa
 * estilos inline.
 */
export default function GlobalError({
  error,
  reset,
}: GlobalErrorProps) {
  useEffect(() => {
    console.error(
      error,
    );
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f8fafc",
          color: "#0f172a",
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 420,
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: 20,
              marginBottom: 8,
            }}
          >
            O LexFlow encontrou um erro
          </h1>

          <p
            style={{
              fontSize: 14,
              color: "#475569",
              marginBottom: 24,
            }}
          >
            Recarregue a página. Se o problema continuar, tente novamente em
            alguns minutos.
          </p>

          {error.digest ? (
            <p
              style={{
                fontSize: 12,
                color: "#64748b",
                marginBottom: 24,
              }}
            >
              Código do erro: {error.digest}
            </p>
          ) : null}

          <button
            type="button"
            onClick={reset}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: "#0f172a",
              color: "#fff",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
