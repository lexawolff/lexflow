/*
 * Regras de valores das RPVs e precatórios. Sem dependências de servidor:
 * usado também nas telas.
 */

export const RPV_LINKED_RECEIVABLE_MESSAGE =
  "Este recebimento foi gerado por uma RPV ou precatório. Altere valor, tipo, caso, pagamento ou exclusão pela tela de RPVs e precatórios.";

export function roundMoney(
  value: number,
): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

type ContractualFeeInput = {
  grossAmount: number;
  contractualFeeRate: number | null;
  contractualFeeValue: number | null;
};

// O valor digitado prevalece; sem ele, os honorários vêm do percentual.
export function getRpvContractualFee({
  grossAmount,
  contractualFeeRate,
  contractualFeeValue,
}: ContractualFeeInput): number {
  if (contractualFeeValue !== null) {
    return roundMoney(contractualFeeValue);
  }

  if (contractualFeeRate !== null) {
    return roundMoney(grossAmount * (contractualFeeRate / 100));
  }

  return 0;
}

/*
 * Requisições antigas gravavam também o valor calculado pelo percentual.
 * Quando ele é igual ao cálculo, veio do percentual e não foi digitado.
 */
export function isContractualFeeFromRate({
  grossAmount,
  contractualFeeRate,
  contractualFeeValue,
}: ContractualFeeInput): boolean {
  return (
    contractualFeeRate !== null &&
    contractualFeeValue !== null &&
    roundMoney(grossAmount * (contractualFeeRate / 100)) ===
      roundMoney(contractualFeeValue)
  );
}
