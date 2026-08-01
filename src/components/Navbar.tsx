import { useEffect, useState } from 'react';
import { Menu, X, LogOut, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavContext';
import { Button } from './ui';
import type { Route } from '../lib/types';

export function Navbar({ onKabinet }: { onKabinet: () => void }) {
  const { session, profile, signOut } = useAuth();
  const { navigate } = useNav();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links: { label: string; route: Route }[] = [
    { label: 'Hujjatlar', route: { name: 'documents' } },
    { label: 'Sotib olish', route: { name: 'dashboard', view: 'pricing' } },
    { label: 'Hisob', route: { name: 'dashboard', view: 'panel' } },
  ];

  const go = (l: { label: string; route: Route }) => {
    setMobileOpen(false);
    navigate(l.route);
  };

  const handleKabinet = () => {
    setMobileOpen(false);
    if (session) navigate({ name: 'dashboard', view: 'panel' });
    else onKabinet();
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/80 backdrop-blur-xl border-b border-[#ffffff]/15'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center">
        {/* Logo */}
        <div className="w-[30%] flex items-center">
          <button onClick={() => navigate({ name: 'landing' })} className="flex items-center gap-2.5 group">
            <img src="/logo.png" alt="Mixer Visuals" className="w-9 h-9 rounded-lg object-cover group-hover:scale-105 transition-transform" />
            <span className="font-bold text-lg tracking-tight">
              <span className="text-white">Mixer</span>{' '}
              <span className="gold-text">Visuals</span>
            </span>
          </button>
        </div>

        {/* Desktop links — markazda */}
        <div className="flex-1 flex items-center justify-center gap-1">
          {links.map((l) => (
            <button
              key={l.label}
              onClick={() => go(l)}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-[#ffffff] transition-colors rounded-lg hover:bg-white/5"
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="w-[30%] flex items-center justify-end gap-3">
          <div className="hidden md:flex items-center gap-3">
            {session && profile ? (
              <>
                {profile.role === 'admin' && (
                  <Button variant="secondary" size="sm" onClick={() => navigate({ name: 'admin' })}>
                    Admin
                  </Button>
                )}
                <span className="text-sm text-zinc-400 max-w-[180px] truncate">{profile.email}</span>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut size={16} /> Chiqish
                </Button>
              </>
            ) : (
              <Button onClick={handleKabinet} size="sm">
                Kirish <ArrowRight size={16} />
              </Button>
            )}
          </div>
          <button className="md:hidden text-zinc-300" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-black/90 backdrop-blur-xl border-b border-[#ffffff]/15 px-5 py-4 space-y-1 animate-[fadeIn_0.2s_ease-out]">
          {links.map((l) => (
            <button
              key={l.label}
              onClick={() => go(l)}
              className="block w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:text-[#ffffff] hover:bg-white/5 rounded-lg transition-colors"
            >
              {l.label}
            </button>
          ))}
          <div className="pt-2 border-t border-white/10 mt-2">
            {session && profile ? (
              <div className="space-y-2">
                {profile.role === 'admin' && (
                  <Button variant="secondary" size="sm" className="w-full" onClick={() => { setMobileOpen(false); navigate({ name: 'admin' }); }}>
                    Admin panel
                  </Button>
                )}
                <div className="text-xs text-zinc-500 px-4 truncate">{profile.email}</div>
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => { setMobileOpen(false); signOut(); }}>
                  <LogOut size={16} /> Chiqish
                </Button>
              </div>
            ) : (
              <Button onClick={handleKabinet} size="sm" className="w-full">
                Kirish <ArrowRight size={16} />
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
