export interface Profile {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  hwid: string | null;
  subscription_plan: string | null;
  subscription_expires: string | null;
  blocked: boolean;
  referral_code: string;
  referred_by: string | null;
  created_at: string;
}

export interface Plan {
  code: string;
  name: string;
  price: number;
  duration_days: number;
  active: boolean;
}

export interface LicenseKey {
  id: string;
  code: string;
  plan_code: string;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  plan_code: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  receipt_path: string | null;
  promo_code: string | null;
  created_at: string;
}

export interface Promocode {
  id: string;
  code: string;
  discount_percent: number;
  max_uses: number;
  used_count: number;
  active: boolean;
  created_at: string;
}

export type Route =
  | { name: 'landing' }
  | { name: 'dashboard'; view: 'panel' | 'pricing' | 'payment' | 'referral' | 'ecosystem'; planCode?: string }
  | { name: 'admin' }
  | { name: 'documents' };
