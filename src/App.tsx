import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavProvider, useNav } from './context/NavContext';
import { Background } from './components/Background';
import { Navbar } from './components/Navbar';
import { Landing } from './components/Landing';
import { AuthModal } from './components/AuthModal';
import { Dashboard } from './components/Dashboard';
import { Admin } from './components/Admin';
import { Documents } from './components/Documents';
import { supabase } from './lib/supabase';

function AppContent() {
  const { profile, session, loading, profileError } = useAuth();
  const { route } = useNav();
  const [authOpen, setAuthOpen] = useState(false);

  if (loading) {
    return (
      <>
        <Background />
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (profile?.blocked) {
    return (
      <>
        <Background />
        <Navbar onKabinet={() => setAuthOpen(true)} />
        <div className="pt-32 px-5 text-center">
          <p className="text-red-400 text-lg font-semibold mb-3">Sizning akkountingiz bloklangan</p>
          <p className="text-zinc-400 text-sm">Admin bilan bog‘laning: telegram — @mixervisuals</p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="mt-6 text-zinc-500 hover:text-zinc-300 text-sm"
          >
            Chiqish
          </button>
        </div>
      </>
    );
  }

  // Guard protected routes
  const needsAuth = route.name === 'dashboard' || route.name === 'admin';
  if (needsAuth && !profile) {
    return (
      <>
        <Background />
        <Navbar onKabinet={() => setAuthOpen(true)} />
        <div className="pt-32 px-5 text-center">
          <p className="text-zinc-400 mb-4">Bu sahifaga kirish uchun tizimga kiring.</p>
          <p className="text-xs text-zinc-600 mb-4">
            {session ? `Sessiya mavjud: ${session.user.email} (profil topilmadi)` : 'Sessiya yo‘q — hozir tizimga kirmagansiz'}
          </p>
          {profileError && (
            <p className="text-xs text-red-400 mb-4 break-all max-w-md mx-auto">{profileError}</p>
          )}
          <button
            onClick={() => setAuthOpen(true)}
            className="text-emerald-400 hover:text-emerald-300 font-medium"
          >
            Kabinetga kirish
          </button>
        </div>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      </>
    );
  }

  if (route.name === 'admin' && profile?.role !== 'admin') {
    return (
      <>
        <Background />
        <Navbar onKabinet={() => setAuthOpen(true)} />
        <div className="pt-32 px-5 text-center">
          <p className="text-zinc-400">Sizda admin huquqlari yo‘q.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Background />
      <Navbar onKabinet={() => setAuthOpen(true)} />

      <main className="relative">
        {route.name === 'landing' && <Landing onKabinet={() => setAuthOpen(true)} />}
        {route.name === 'dashboard' && <Dashboard initialView={route.view} />}
        {route.name === 'admin' && <Admin />}
        {route.name === 'documents' && <Documents />}
      </main>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavProvider>
        <AppContent />
      </NavProvider>
    </AuthProvider>
  );
}
