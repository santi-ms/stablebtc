'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import TextType from './TextType';

const LiquidEther = dynamic(() => import('./LiquidEther'), { ssr: false });

// CALCULAR CONFIG UNA SOLA VEZ FUERA DEL COMPONENTE
const getDeviceConfig = () => {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

export default function HeroStable() {
  const [isVisible, setIsVisible] = useState(false);
  const [deviceType] = useState(() => getDeviceConfig()); // Solo se calcula UNA VEZ

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Props estáticas según dispositivo
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';

  return (
    <section className="relative min-h-screen overflow-hidden flex items-center">
      {/* Fondo fluido - Props inline para evitar recálculos */}
      <div className="absolute inset-0 w-full h-full">
        <LiquidEther
          className="w-full h-full"
          colors={['#5227FF', '#FF9FFC', '#B19EEF']}
          mouseForce={isMobile ? 15 : isTablet ? 18 : 20}
          cursorSize={isMobile ? 80 : isTablet ? 90 : 100}
          autoDemo={true}
          autoSpeed={isMobile ? 0.4 : isTablet ? 0.45 : 0.5}
          autoIntensity={isMobile ? 1.8 : isTablet ? 2.0 : 2.2}
          autoResumeDelay={isMobile ? 1500 : isTablet ? 1200 : 1000}
          autoRampDuration={isMobile ? 0.8 : isTablet ? 0.7 : 0.6}
          resolution={isMobile ? 0.25 : isTablet ? 0.4 : 0.45}
          isViscous={!isMobile}
          viscous={isMobile ? 20 : isTablet ? 28 : 30}
          iterationsViscous={isMobile ? 12 : isTablet ? 20 : 24}
          iterationsPoisson={isMobile ? 12 : isTablet ? 20 : 24}
          BFECC={true}
          dt={isMobile ? 0.016 : 0.014}
          isBounce={false}
          takeoverDuration={isMobile ? 0.3 : 0.25}
          style={{ 
            width: '100%', 
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 0
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
        {/* Badge */}
        <div className={`mb-6 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 backdrop-blur-xl">
            <div className="relative flex h-2 w-2 items-center justify-center">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 animate-ping" />
              <div className="absolute h-2 w-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400" />
            </div>
            <p className="text-xs font-semibold tracking-[0.22em] text-white/80">BTC-BACKED LOANS</p>
          </div>
        </div>

        {/* Título */}
        <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-[1.05] md:text-7xl">
          <TextType
            text={['Bitcoin in, USDT out.']}
            typingSpeed={80}
            initialDelay={800}
            showCursor
            cursorCharacter="|"
            startOnVisible
            loop={false}
            className={`bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent transition-all duration-1000 delay-200 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
            cursorClassName="text-indigo-400"
          />
        </h1>

        {/* Subtítulo */}
        <p className={`mx-auto mt-6 max-w-3xl text-lg text-white/70 md:text-xl transition-all duration-1000 delay-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>
          Depositá BTC como colateral y obtené un préstamo en USDT en Starknet (Sepolia).
          <br className="hidden md:block" />
          <span className="text-white/60">No-custodial, sobrecolateralizado y simple de usar.</span>
        </p>

        {/* CTAs */}
        <div className={`mt-10 flex items-center justify-center gap-4 transition-all duration-1000 delay-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}>
          <Link
            href="/"
            className="group relative inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/40 active:scale-95"
          >
            <span className="relative z-10">Abrir dApp</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-400 to-purple-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-indigo-400 to-purple-500 opacity-0 blur transition-opacity duration-300 group-hover:opacity-30" />
          </Link>

          <a
            href="#caracteristicas"
            className="group relative inline-flex h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 font-semibold text-white/90 backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-white/30 hover:bg-white/10 active:scale-95"
          >
            <span className="relative z-10">Ver características</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/5 to-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </a>
        </div>

        {/* Mockup */}
        <div className={`mx-auto mt-16 w-full max-w-5xl transition-all duration-1500 delay-1200 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}>
          <div className="group relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 blur-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="relative rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl shadow-2xl transition-all duration-500 group-hover:border-white/20 group-hover:bg-white/10">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-cyan-500/10 ring-1 ring-white/10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}