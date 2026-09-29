const MULTIPLIER_TABLE: Record<number, number> = {
  1: 1,
  2: 1.5,
  3: 1.875,
  4: 2.125,
};

export function contributionMultiplier(peopleCount: number): number {
  const n = Math.max(1, Math.floor(peopleCount));
  if (n in MULTIPLIER_TABLE) return MULTIPLIER_TABLE[n];
  return MULTIPLIER_TABLE[4] + 0.05 * (n - 4);
}

export function calculateContributionValue(
  minValue: number,
  peopleCount: number,
) {
  return Math.round(minValue * contributionMultiplier(peopleCount) * 100) / 100;
}

// Limite de parcelas no cartão oferecido no link de pagamento do Asaas,
// conforme o valor da contribuição.
export function maxInstallmentsFor(value: number): number {
  if (value <= 300) return 3;
  if (value < 800) return 6;
  return 10;
}

// Presente que já atingiu a meta não aceita novas contribuições. Compara em
// centavos porque raisedAmount é uma soma de floats.
export function isFullyFunded(gift: { value: number; raisedAmount: number }) {
  return (
    gift.value > 0 &&
    Math.round(gift.raisedAmount * 100) >= Math.round(gift.value * 100)
  );
}
