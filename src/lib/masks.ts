export function onlyNumbers(value: string) {
  return value.replace(/\D/g, "");
}

export function maskCPF(value: string) {
  value = onlyNumbers(value).slice(0, 11);

  return value
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function maskCEP(value: string) {
  value = onlyNumbers(value).slice(0, 8);

  return value.replace(/^(\d{5})(\d)/, "$1-$2");
}

export function maskPhone(value: string) {
  value = onlyNumbers(value).slice(0, 11);

  if (value.length <= 10) {
    return value.replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return value.replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function maskPIS(value: string) {
  value = onlyNumbers(value).slice(0, 11);

  return value.replace(
    /^(\d{3})(\d{5})(\d{2})(\d)/,
    "$1.$2.$3-$4"
  );
}