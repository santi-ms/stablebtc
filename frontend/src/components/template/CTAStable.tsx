'use client'

import Link from 'next/link'
import { ArrowRight, Github, Zap, Shield, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function CTAStable() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = document.getElementById('cta')?.getBoundingClientRect()
      if (rect) {
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <section
      id="cta"
      className="scroll-mt-28 mx-auto max-w-6xl px-6 py-16 md:py-24 relative"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div 
        className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-violet-600/20 via-violet-500/10 to-indigo-500/10 backdrop-blur-xl"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(168, 85, 247, 0.15) 0%, rgba(99, 102, 241, 0.1) 50%, transparent 70%), linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(79, 70, 229, 0.1) 100%)`
        }}
      >
        {/* Enhanced border with glow */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/20 shadow-2xl shadow-violet-500/20" />
        
        {/* Animated border gradient */}
        <div 
          className="absolute inset-0 rounded-3xl opacity-50"
          style={{ 
            background: `conic-gradient(from 0deg, transparent, rgba(168, 85, 247, 0.3), transparent, rgba(99, 102, 241, 0.3), transparent)`,
            animation: 'spin 10s linear infinite',
          }} 
        />

        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute h-1 w-1 rounded-full bg-gradient-to-r from-violet-400 to-indigo-400 animate-float opacity-40"
              style={{
                left: `${15 + i * 12}%`,
                top: `${20 + (i % 4) * 20}%`,
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${3 + i * 0.3}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 p-10 md:p-16">
          <div className="mx-auto max-w-3xl text-center">
            
            {/* Animated badge */}
            <div className={`mb-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="inline-flex items-center gap-3 rounded-full border border-white/30 bg-white/10 px-6 py-3 backdrop-blur-xl">
                <Sparkles className="w-5 h-5 text-violet-400" />
                <span className="text-sm font-semibold tracking-wider text-white/90">LISTO PARA PROBAR</span>
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                  <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
                </div>
              </div>
            </div>

            {/* Enhanced title */}
            <h2 className={`text-4xl font-bold md:text-5xl mb-6 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <span className="bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent">
                ¿Listo para{' '}
              </span>
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                probarlo?
              </span>
            </h2>

            {/* Enhanced description */}
            <p className={`text-xl text-white/80 leading-relaxed mb-10 transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              Depositá BTC (tBTC), pedí USDT y usá el simulador de LTV.{' '}
              <span className="text-white/90 font-medium">Todo en la misma interfaz.</span>
            </p>

            {/* Enhanced buttons */}
            <div className={`flex flex-col items-center justify-center gap-4 sm:flex-row transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
              
              {/* Primary CTA button */}
              <Link
                href="/"
                className="group relative inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-600 px-8 py-4 font-bold text-white shadow-2xl shadow-violet-500/40 transition-all duration-300 hover:shadow-3xl hover:shadow-violet-500/60 hover:scale-105 active:scale-95"
              >
                <span className="relative z-10 text-lg">Abrir dApp</span>
                <ArrowRight className="h-5 w-5 transition-all duration-300 group-hover:translate-x-1" />
                
                {/* Button glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-400 to-indigo-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100 blur" />
                
                {/* Shimmer effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                
                {/* Floating particles on hover */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300" />
              </Link>

              {/* Secondary button */}
              <a
                href="https://github.com/tu-org/tu-repo"
                target="_blank"
                rel="noreferrer"
                className="group relative inline-flex items-center gap-3 rounded-2xl border-2 border-white/20 bg-white/5 px-8 py-4 font-semibold text-white/90 backdrop-blur-xl transition-all duration-300 hover:border-white/40 hover:bg-white/10 hover:scale-105 active:scale-95"
              >
                <Github className="h-5 w-5 transition-all duration-300 group-hover:rotate-12" />
                <span className="text-lg">Ver código</span>
                
                {/* Border glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/10 to-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 blur-sm" />
              </a>
            </div>

            {/* Feature highlights */}
            <div className={`mt-12 flex flex-wrap items-center justify-center gap-6 transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              {[
                { icon: Zap, label: 'Rápido y fácil', color: 'text-yellow-400' },
                { icon: Shield, label: 'Seguro', color: 'text-emerald-400' },
                { icon: Github, label: 'Open Source', color: 'text-purple-400' }
              ].map(({ icon: Icon, label, color }, i) => (
                <div key={label} className="flex items-center gap-2 text-white/70 hover:text-white/90 transition-colors duration-300">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>

            {/* Bottom stats */}
            <div className={`mt-8 inline-flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 backdrop-blur-xl transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span>Testnet gratis</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div className="flex items-center gap-2 text-sm text-white/70">
                <span>Demo funcional</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div className="flex items-center gap-2 text-sm text-white/70">
                <span>5 min setup</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.4; }
          50% { transform: translateY(-15px) rotate(180deg); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </section>
  )
}