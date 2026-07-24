import {
  Archive,
  File,
  FileSpreadsheet,
  FileText,
  ImageIcon,
} from "lucide-react";

export function getDocumentIcon(type: string) {
  if (type.startsWith("image/")) {
    return ImageIcon;
  }

  if (type === "application/pdf") {
    return FileText;
  }

  if (
    type.includes("spreadsheet") ||
    type.includes("excel")
  ) {
    return FileSpreadsheet;
  }

  if (
    type.includes("zip") ||
    type.includes("compressed")
  ) {
    return Archive;
  }

  return File;
}   