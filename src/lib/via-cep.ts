export type ViaCepResponse = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
};

export async function fetchAddressByCep(cep: string) {
  const cleanCep = cep.replace(/\D/g, "");

  if (cleanCep.length !== 8) {
    return null;
  }

  const response = await fetch(
    `https://viacep.com.br/ws/${cleanCep}/json/`
  );

  if (!response.ok) {
    return null;
  }

  const data: ViaCepResponse = await response.json();

  if (data.erro) {
    return null;
  }

  return data;
}