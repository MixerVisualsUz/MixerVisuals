import type { Plan } from './types';

export const PLANS: Plan[] = [
  { code: '30days', name: '30 kun', price: 60000, duration_days: 30, active: true },
  { code: '90days', name: '90 kun', price: 160000, duration_days: 90, active: true },
  { code: '180days', name: '180 kun', price: 280000, duration_days: 180, active: true },
];

let cachedPlans: Plan[] | null = null;
let cachePromise: Promise<Plan[]> | null = null;

export function loadPlans(): Promise<Plan[]> {
  if (!cachePromise) {
    cachePromise = (async () => {
      try {
        const { supabase } = await import('./supabase');
        const { data } = await supabase.from('plans').select('*').order('price', { ascending: true });
        cachedPlans = (data as Plan[]) || [];
      } catch {
        cachedPlans = [];
      }
      return cachedPlans!;
    })();
  }
  return cachePromise;
}

export function getAllPlans(): Plan[] {
  return cachedPlans && cachedPlans.length > 0 ? cachedPlans : PLANS;
}

export function formatPrice(price: number): string {
  return price.toLocaleString('uz-UZ') + ' so‘m';
}

export function planByCode(code: string): Plan | undefined {
  return getAllPlans().find((p) => p.code === code);
}
