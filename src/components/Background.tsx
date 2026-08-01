import { useMemo } from 'react';
import { BG_IMAGE } from '../lib/constants';

export function Background() {
  const particles = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 15,
        duration: 15 + Math.random() * 20,
        size: 1 + Math.random() * 3,
      })),
    []
  );

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
      {/* Atmospheric castle night background */}
      <img
        src={BG_IMAGE}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale contrast-125"
      />
      {/* Dark overlay — lighter so background is visible */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

      {/* Floating gold orbs */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[#ffffff]/8 blur-[120px] animate-[float_25s_ease-in-out_infinite]" />
      <div className="absolute top-[30%] right-[-10%] w-[450px] h-[450px] rounded-full bg-[#ffffff]/6 blur-[120px] animate-[float_30s_ease-in-out_infinite_reverse]" />
      <div className="absolute bottom-[-10%] left-[20%] w-[400px] h-[400px] rounded-full bg-amber-700/5 blur-[120px] animate-[float_28s_ease-in-out_infinite]" />

      {/* Floating particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-[#ffffff]/40"
          style={{
            left: `${p.left}%`,
            bottom: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `particleFloat ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
