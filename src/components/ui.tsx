import { useState, type ReactNode, type ButtonHTMLAttributes } from 'react';
import { Check, Copy } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'blue';
  size?: 'sm' | 'md' | 'lg';
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none';
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  };
  const variants = {
    primary:
      'text-black bg-gradient-to-r from-[#ffffff] to-[#ffffff] hover:scale-[1.02] shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] font-semibold',
    secondary:
      'text-gray-200 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#ffffff]/30',
    ghost: 'text-zinc-400 hover:text-[#ffffff]',
    blue: 'text-white bg-gradient-to-r from-[#229ED9] to-[#1a8bc4] hover:scale-[1.02] shadow-[0_0_30px_rgba(34,158,217,0.3)]',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className = '', glow = false }: { children: ReactNode; className?: string; glow?: boolean }) {
  return (
    <div
      className={`rounded-2xl bg-black/50 border border-[#ffffff]/15 backdrop-blur-xl transition-all duration-300 hover:border-[#ffffff]/30 hover:scale-[1.01] ${
        glow ? 'shadow-[0_0_50px_rgba(255,255,255,0.08)]' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({ children, color = 'gold' }: { children: ReactNode; color?: 'gold' | 'red' | 'yellow' | 'blue' | 'gray' | 'green' }) {
  const colors = {
    gold: 'bg-[#ffffff]/15 text-[#ffffff] border border-[#ffffff]/25',
    red: 'bg-red-500/15 text-red-400 border border-red-500/20',
    yellow: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    blue: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    gray: 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/20',
    green: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Input({
  label,
  error,
  className = '',
  ...props
}: { label?: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="w-full">
      {label && <label className="block text-sm text-gray-300 mb-2 font-medium">{label}</label>}
      <input
        className={`w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-100 placeholder:text-zinc-500 outline-none transition-all focus:border-[#ffffff]/50 focus:bg-white/[0.07] focus:ring-2 focus:ring-[#ffffff]/10 ${
          error ? 'border-red-500/40' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-[#ffffff] hover:bg-white/5 transition-colors"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? 'Nusxalandi' : label || 'Nusxalash'}
    </button>
  );
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 shrink-0 ${
        checked
          ? 'bg-gradient-to-r from-[#ffffff] to-[#ffffff] shadow-[0_0_15px_rgba(255,255,255,0.4)]'
          : 'bg-white/10 border border-white/10'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full ${checked ? 'bg-black' : 'bg-white'} shadow-md transition-transform duration-300 ${
          checked ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
