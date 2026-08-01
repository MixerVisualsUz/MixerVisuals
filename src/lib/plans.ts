import type { Plan } from './types';

export const PLANS: Plan[] = [
  { code: '30days', name: '30 kun', price: 60000, duration_days: 30, active: true },
  { code: '90days', name: '90 kun', price: 160000, duration_days: 90, active: true },
  { code: '180days', name: '180 kun', price: 280000, duration_days: 180, active: true },
];

export function formatPrice(price: number): string {
  return price.toLocaleString('uz-UZ') + ' so‘m';
}

export function planByCode(code: string): Plan | undefined {
  return PLANS.find((p) => p.code === code);
}
