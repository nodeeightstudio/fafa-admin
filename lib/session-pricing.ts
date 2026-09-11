export const COUNSELLOR_TIER_LABELS: Record<number, string> = {
  0: "Institution Support Staff",
  1: "Lay counselor / trained mentor",
  2: "Licensed counselor",
  3: "Specialist / senior counselor",
};

export interface SessionPricingRow {
  tier: number;
  label: string;
  amount_ghs: number;
  updated_at?: string;
  updated_by?: string | null;
}

export function formatGhs(amountGhs: number | null | undefined): string {
  if (amountGhs == null || Number.isNaN(amountGhs)) return "—";
  return `GH₵ ${amountGhs.toLocaleString()}`;
}

export function pesewasToGhs(amountPesewas: number | null | undefined): number {
  if (amountPesewas == null) return 0;
  return amountPesewas / 100;
}
