import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    /*
     * Upload de documentos passa por
     * Server Action. O padrão do Next é
     * 1 MB, o que bloqueava laudos e PDFs
     * escaneados.
     *
     * Mantenha acima do limite por
     * arquivo definido em
     * src/features/documents/document-upload-rules.ts
     * (15 MB), pois o envio multipart
     * acrescenta alguns bytes.
     */
    serverActions: {
      bodySizeLimit: "16mb",
    },

    /*
     * O middleware (sessão do Supabase)
     * lê o corpo das requisições até
     * 10 MB por padrão; acima disso o
     * upload chegaria truncado.
     */
    middlewareClientMaxBodySize: "16mb",
  },
};

export default nextConfig;
