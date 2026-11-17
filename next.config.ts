import type { NextConfig } from "next";

/*
 * Uploads de documentos vão direto do navegador para o Supabase Storage
 * (src/features/documents/services/upload-file.ts), sem passar pelo
 * servidor. Por isso os limites padrão do Next para Server Actions
 * (1 MB) e do middleware continuam adequados.
 */
const nextConfig: NextConfig = {};

export default nextConfig;
