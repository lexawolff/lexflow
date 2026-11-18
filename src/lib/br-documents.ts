/*
 * Validação e máscara de documentos e telefones brasileiros.
 * Sem dependências de servidor: usado também no navegador.
 */

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

// Forma gravada de CPF e CNPJ: letras maiúsculas e números, sem pontuação.
export function normalizeTaxId(value: string): string {
  return value.toUpperCase().replace(/[^0-9A-Z]/g, "");
}

function hasRepeatedDigits(value: string): boolean {
  return /^(\d)\1+$/.test(value);
}

export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);

  if (cpf.length !== 11 || hasRepeatedDigits(cpf)) {
    return false;
  }

  for (const size of [9, 10]) {
    let sum = 0;

    for (let index = 0; index < size; index += 1) {
      sum += Number(cpf[index]) * (size + 1 - index);
    }

    const digit = ((sum * 10) % 11) % 10;

    if (digit !== Number(cpf[size])) {
      return false;
    }
  }

  return true;
}

/*
 * Aceita o CNPJ numérico e o alfanumérico: 12 letras ou números seguidos de
 * 2 dígitos verificadores. Cada caractere vale seu código ASCII menos 48.
 */
export function isValidCnpj(value: string): boolean {
  const cnpj = normalizeTaxId(value);

  if (!/^[0-9A-Z]{12}\d{2}$/.test(cnpj) || hasRepeatedDigits(cnpj)) {
    return false;
  }

  for (const size of [12, 13]) {
    let sum = 0;
    let weight = size - 7;

    for (let index = 0; index < size; index += 1) {
      sum += (cnpj.charCodeAt(index) - 48) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }

    const remainder = sum % 11;
    const digit = remainder < 2 ? 0 : 11 - remainder;

    if (digit !== Number(cnpj[size])) {
      return false;
    }
  }

  return true;
}

export function isValidTaxId(value: string): boolean {
  const taxId = normalizeTaxId(value);

  return /^\d{11}$/.test(taxId)
    ? isValidCpf(taxId)
    : isValidCnpj(taxId);
}

/*
 * Identifica o titular do documento: o CPF inteiro ou, no CNPJ, os 8 primeiros
 * caracteres, que são comuns à matriz e às filiais.
 */
export function getTaxIdOwnerKey(value: string): string {
  const taxId = normalizeTaxId(value);

  return taxId.length === 11
    ? `cpf:${taxId}`
    : `cnpj:${taxId.slice(0, 8)}`;
}

export function maskCnpj(value: string): string {
  return normalizeTaxId(value)
    .slice(0, 14)
    .replace(/^(.{2})(.)/, "$1.$2")
    .replace(/^(.{2})\.(.{3})(.)/, "$1.$2.$3")
    .replace(/^(.{2})\.(.{3})\.(.{3})(.)/, "$1.$2.$3/$4")
    .replace(/\/(.{4})(.)/, "/$1-$2");
}

export function maskTaxId(value: string): string {
  const taxId = normalizeTaxId(value).slice(0, 14);

  if (taxId.length > 11 || /[A-Z]/.test(taxId)) {
    return maskCnpj(taxId);
  }

  return taxId
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

// DDD + número: 10 dígitos (fixo) ou 11 (celular, começando com 9).
export function isValidBrazilPhone(value: string): boolean {
  const digits = onlyDigits(value);

  if (!/^[1-9][1-9]\d{8,9}$/.test(digits)) {
    return false;
  }

  return digits.length === 10 || digits[2] === "9";
}
