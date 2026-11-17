/*
 * Regras de upload compartilhadas entre
 * o navegador (aviso imediato) e o
 * servidor (validação definitiva).
 *
 * O arquivo vai direto do navegador para o
 * Supabase Storage. O mesmo limite (15 MB)
 * deve estar configurado no bucket
 * "documents" (file_size_limit), que o
 * aplica no próprio upload.
 */
export const MAX_DOCUMENT_SIZE_MB = 15;

export const MAX_DOCUMENT_SIZE_BYTES =
  MAX_DOCUMENT_SIZE_MB * 1024 * 1024;

/*
 * Lista de permissões por extensão.
 * Bloqueia HTML, SVG, scripts e
 * executáveis no Storage.
 */
export const ALLOWED_DOCUMENT_EXTENSIONS = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
  "doc",
  "docx",
  "odt",
  "xls",
  "xlsx",
  "txt",
] as const;

export const DOCUMENT_INPUT_ACCEPT =
  ALLOWED_DOCUMENT_EXTENSIONS.map(
    (extension) => `.${extension}`,
  ).join(",");

export const DOCUMENT_UPLOAD_HINT =
  `PDF, imagens (JPG, PNG, WEBP, HEIC), Word, Excel ou TXT — até ${MAX_DOCUMENT_SIZE_MB} MB.`;

export function getFileExtension(
  fileName: string,
): string | null {
  const lastDot =
    fileName.lastIndexOf(".");

  if (
    lastDot <= 0 ||
    lastDot === fileName.length - 1
  ) {
    return null;
  }

  return fileName
    .slice(lastDot + 1)
    .toLowerCase();
}

export function isAllowedDocumentFile(
  fileName: string,
): boolean {
  const extension =
    getFileExtension(fileName);

  return (
    extension !== null &&
    (
      ALLOWED_DOCUMENT_EXTENSIONS as readonly string[]
    ).includes(extension)
  );
}

/*
 * Retorna a mensagem de erro, ou null
 * se o arquivo puder ser enviado.
 */
export function validateDocumentFile(file: {
  name: string;
  size: number;
}): string | null {
  if (file.size <= 0) {
    return "Selecione um arquivo.";
  }

  if (
    !isAllowedDocumentFile(
      file.name,
    )
  ) {
    return "Tipo de arquivo não permitido. Envie PDF, imagem (JPG, PNG, WEBP, HEIC), Word, Excel ou TXT.";
  }

  if (
    file.size >
    MAX_DOCUMENT_SIZE_BYTES
  ) {
    return `O arquivo tem ${(file.size / 1024 / 1024).toFixed(1)} MB. O limite é ${MAX_DOCUMENT_SIZE_MB} MB.`;
  }

  return null;
}
