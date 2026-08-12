export function splitAmount(
  totalAmount: number,
  installments: number
): number[] {
  const totalInCents = Math.round(totalAmount * 100);

  const installmentValue = Math.floor(
    totalInCents / installments
  );

  const remainder = totalInCents % installments;

  return Array.from({ length: installments }, (_, index) => {
    const value =
      installmentValue + (index === installments - 1 ? remainder : 0);

    return value / 100;
  });
}