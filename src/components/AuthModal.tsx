import { useState, useEffect, useRef } from 'react';
import { X, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavContext';
import { Button, Input, Spinner } from './ui';

const MIN_FORM_TIME = 2500;
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW = 60000;

function getAttempts(): { count: number; first: number } {
  try {
    const raw = localStorage.getItem('mv_attempts');
    if (!raw) return { count: 0, first: Date.now() };
    const data = JSON.parse(raw);
    if (Date.now() - data.first > ATTEMPT_WINDOW) return { count: 0, first: Date.now() };
    return data;
  } catch {
    return { count: 0, first: Date.now() };
  }
}

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signIn, signUp } = useAuth();
  const { navigate } = useNav();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ username: '', email: '', password: '' });
  const [honeypot, setHoneypot] = useState('');
  const openedAt = useRef(0);

  useEffect(() => {
    if (open) {
      setError('');
      setTab('login');
      openedAt.current = Date.now();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  // Himoya: honeypot + vaqt + urinishlar soni
  const antiBotCheck = (): string | null => {
    if (honeypot) return 'robot';
    if (Date.now() - openedAt.current < MIN_FORM_TIME) return 'too-fast';
    const attempts = getAttempts();
    if (attempts.count >= MAX_ATTEMPTS) return 'limited';
    return null;
  };

  const recordAttempt = () => {
    try {
      const attempts = getAttempts();
      const next = { count: attempts.count + 1, first: attempts.first };
      localStorage.setItem('mv_attempts', JSON.stringify(next));
    } catch {
      // localStorage mavjud emas — davom etamiz
    }
  };

  const submitLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      setError('Barcha maydonlarni to‘ldiring');
      return;
    }
    const check = antiBotCheck();
    if (check === 'robot') return;
    if (check === 'too-fast') { setError('Biroz kuting va qayta urinib ko‘ring'); return; }
    if (check === 'limited') { setError('Juda ko‘p urinish. Bir daqiqadan keyin qaytadan urinib ko‘ring'); return; }
    recordAttempt();
    setLoading(true);
    setError('');
    const res = await signIn(loginForm.email, loginForm.password);
    setLoading(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    onClose();
    navigate({ name: 'dashboard', view: 'panel' });
  };

  const submitRegister = async () => {
    if (!regForm.username || !regForm.email || !regForm.password) {
      setError('Barcha maydonlarni to‘ldiring');
      return;
    }
    if (regForm.password.length < 6) {
      setError('Parol kamida 6 ta belgidan iborat bo‘lishi kerak');
      return;
    }
    const check = antiBotCheck();
    if (check === 'robot') return;
    if (check === 'too-fast') { setError('Biroz kuting va qayta urinib ko‘ring'); return; }
    if (check === 'limited') { setError('Juda ko‘p urinish. Bir daqiqadan keyin qaytadan urinib ko‘ring'); return; }
    recordAttempt();
    setLoading(true);
    setError('');
    const refParam = new URLSearchParams(window.location.search).get('ref') || undefined;
    const res = await signUp(regForm.username, regForm.email, regForm.password, refParam);
    setLoading(false);
    if (!res.success) {
      setError(res.message);
      return;
    }
    setTab('login');
    setLoginForm({ email: regForm.email, password: '' });
    setError('Ro‘yxatdan o‘tish muvaffaqiyatli. Endi tizimga kiring.');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]" onClick={onClose} />
      <div className="relative w-full max-w-md animate-[scaleIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
        <div className="h-1 bg-gradient-to-r from-[#ffffff] via-[#ffffff] to-[#ffffff] rounded-t-2xl" />
        <div className="rounded-b-2xl bg-black/95 border border-[#ffffff]/15 border-t-0 p-8 shadow-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-500 hover:text-[#ffffff] transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center mb-6">
            <img src="/logo.png" alt="Mixer Visuals" className="w-14 h-14 rounded-xl mb-3" />
            <h2 className="text-xl font-bold text-white">Mixer Visuals — Kabinetga kirish</h2>
            <p className="text-sm text-zinc-500 mt-1">Hisobingizga kiring yoki yangi hisob yarating</p>
          </div>

          {/* Tabs */}
          <div className="relative flex bg-white/5 rounded-xl p-1 mb-6">
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-gradient-to-r from-[#ffffff] to-[#ffffff] shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-transform duration-300"
              style={{ transform: tab === 'login' ? 'translateX(0)' : 'translateX(calc(100% + 4px))' }}
            />
            <button
              onClick={() => { setTab('login'); setError(''); }}
              className={`relative flex-1 py-2 text-sm font-medium transition-colors ${tab === 'login' ? 'text-black font-semibold' : 'text-zinc-400'}`}
            >
              Kirish
            </button>
            <button
              onClick={() => { setTab('register'); setError(''); }}
              className={`relative flex-1 py-2 text-sm font-medium transition-colors ${tab === 'register' ? 'text-black font-semibold' : 'text-zinc-400'}`}
            >
              Ro‘yxatdan o‘tish
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 animate-[fadeIn_0.2s_ease-out]">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Honeypot — robotlar uchun yashirin maydon (odamlar ko'rmaydi) */}
          <div className="absolute left-[-9999px] top-[-9999px]" aria-hidden="true">
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {tab === 'login' ? (
            <div className="space-y-4">
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <Input
                  type="email"
                  placeholder="Email manzilingiz"
                  className="pl-11"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && submitLogin()}
                />
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <Input
                  type="password"
                  placeholder="Parol"
                  className="pl-11"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && submitLogin()}
                />
              </div>
              <Button onClick={submitLogin} disabled={loading} size="lg" className="w-full">
                {loading ? <Spinner /> : 'Tizimga kirish'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <Input
                  type="text"
                  placeholder="Foydalanuvchi nomi"
                  className="pl-11"
                  value={regForm.username}
                  onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                />
              </div>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <Input
                  type="email"
                  placeholder="Email manzilingiz"
                  className="pl-11"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                />
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <Input
                  type="password"
                  placeholder="Parol (min. 6 belgi)"
                  className="pl-11"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && submitRegister()}
                />
              </div>
              <Button onClick={submitRegister} disabled={loading} size="lg" className="w-full">
                {loading ? <Spinner /> : 'Ro‘yxatdan o‘tish'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
