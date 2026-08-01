import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/types';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileError: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signUp: (username: string, email: string, password: string, referredBy?: string) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string) => {
    setProfileError(null);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();
    if (error) {
      console.error('Profile load error:', error.message);
      setProfileError('Yuklash xatoligi: ' + error.message);
      return;
    }
    if (data) {
      setProfile(data as Profile);
      return;
    }

    // Self-heal: profil qatori yo'q (eski ro'yxatdan o'tganlar uchun) — avtomatik yaratamiz
    // 1) Birinchi urinish: ensure_profile RPC (RLS'dan himoyalangan, barcha holatlarda ishlaydi)
    const rpcRes = await supabase.rpc('ensure_profile');
    if (!rpcRes.error && rpcRes.data && !rpcRes.data.error) {
      setProfile(rpcRes.data as Profile);
      return;
    }
    // 2) Ikkinchi urinish: to'g'ridan-to'g'ri insert
    const { data: userRes } = await supabase.auth.getUser();
    const u = userRes?.user;
    if (!u) return;
    const baseName = (u.user_metadata?.username as string) || u.email?.split('@')[0] || 'user';
    let username = baseName;
    let insertRes = await supabase
      .from('profiles')
      .insert({ id: uid, username, email: u.email || '', role: 'user', referral_code: username, blocked: false })
      .select()
      .single();
    if (insertRes.error) {
      username = `${baseName}-${Math.random().toString(36).slice(2, 6)}`;
      insertRes = await supabase
        .from('profiles')
        .insert({ id: uid, username, email: u.email || '', role: 'user', referral_code: username, blocked: false })
        .select()
        .single();
    }
    if (insertRes.error) {
      console.error('Profile create error:', insertRes.error.message);
      console.error('RPC error:', rpcRes.error?.message || JSON.stringify(rpcRes.data));
      setProfileError('Profil yaratish xatoligi: ' + insertRes.error.message);
      return;
    }
    setProfile(insertRes.data as Profile);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) {
        loadProfile(data.session.user.id).finally(() => mounted && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        (async () => {
          await loadProfile(newSession.user.id);
        })();
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, message: translateError(error.message) };
    return { success: true, message: 'Tizimga muvaffaqiyatli kirildi' };
  }, []);

  const signUp = useCallback(async (username: string, email: string, password: string, referredBy?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username, referred_by: referredBy || '' } },
    });
    if (error) return { success: false, message: translateError(error.message) };
    if (!data.user) return { success: false, message: 'Ro‘yxatdan o‘tish amalga oshmadi' };
    return { success: true, message: 'Ro‘yxatdan o‘tish muvaffaqiyatli. Tizimga kiring.' };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setProfileError(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user.id) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  return (
    <AuthContext.Provider value={{ session, profile, loading, profileError, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function translateError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login')) return 'Email yoki parol noto‘g‘ri';
  if (m.includes('already registered') || m.includes('user already')) return 'Bu email allaqachon ro‘yxatdan o‘tgan';
  if (m.includes('not confirmed')) return 'Email tasdiqlanmagan. Emailingizdagi havolani bosing';
  if (m.includes('password') && (m.includes('weak') || m.includes('too short'))) return 'Parol juda oddiy (kamida 6 ta belgi)';
  if (m.includes('invalid') && m.includes('email')) return 'Email noto‘g‘ri formatda';
  if (m.includes('rate limit')) return 'Juda ko‘p urinish. Birozdan keyin urinib ko‘ring';
  if (m.includes('invalid_credentials')) return 'Email yoki parol noto‘g‘ri';
  if (m.includes('captcha')) return 'Tekshiruvdan o‘tmadi. Qaytadan urinib ko‘ring';
  return 'Xatolik: ' + msg;
}
