'use client'

import { ArrowDownCircle, DollarSign, ArrowUpCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export default function HowItWorksStable() {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([])
  const sectionRef = useRef<HTMLElement>(null)

  const steps = [
    {
      icon: ArrowDownCircle,
      title: 'Depositá BTC (tBTC)',
      desc: 'Bloqueás tBTC como colateral en tu bóveda. Todo on-chain en Starknet Sepolia.',
      stepNumber: '01',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-500/10 to-cyan-500/10',
      iconBg: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
    },
    {
      icon: DollarSign,
      title: 'Tomá USDT en minutos',
      desc: 'Generás el préstamo sobrecolateralizado y usás USDT desde tu wallet.',
      stepNumber: '02',
      color: 'from-emerald-500 to-green-500',
      bgColor: 'from-emerald-500/10 to-green-500/10',
      iconBg: 'bg-gradient-to-br from-emerald-500/20 to-green-500/20',
    },
    {
      icon: ArrowUpCircle,
      title: 'Repagá y retirá',
      desc: 'Cuando quieras, repagás sUSD y recuperás tu BTC. Simple y transparente.',
      stepNumber: '03',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-500/10 to-pink-500/10',
      iconBg: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20',
    },
  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Animate steps with progressive delay
            steps.forEach((_, index) => {
              setTimeout(() => {
                setVisibleSteps(prev => [...prev, index])
              }, index * 200)
            })
          }
        })
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section 
      id="como-funciona" 
      ref={sectionRef}
      className="scroll-mt-28 mx-auto max-w-6xl px-6 py-16 md:py-20 relative overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Connecting lines for desktop */}
        <div className="hidden md:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl">
          <svg className="w-full h-24" viewBox="0 0 800 100">
            <defs>
              <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
                <stop offset="50%" stopColor="rgba(16, 185, 129, 0.3)" />
                <stop offset="100%" stopColor="rgba(168, 85, 247, 0.3)" />
              </linearGradient>
            </defs>
            <path
              d="M100 50 Q400 20 700 50"
              stroke="url(#connectionGradient)"
              strokeWidth="2"
              fill="none"
              strokeDasharray="5,5"
              className="animate-pulse"
            />
          </svg>
        </div>
      </div>

      {/* Header */}
      <div className="mx-auto mb-16 max-w-2xl text-center relative z-10">
        <div className={`transition-all duration-1000 ${visibleSteps.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Process badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 backdrop-blur-xl mb-6">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
              <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
            </div>
            <span className="text-xs font-semibold tracking-wider text-white/80">PROCESO SIMPLE</span>
          </div>

          <h2 className="text-4xl font-bold md:text-5xl bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent mb-4">
            ¿Cómo funciona?
          </h2>
          <p className="text-xl text-white/70 leading-relaxed">
            <span className="font-semibold text-white/90">Tres pasos</span>, sin vueltas.
          </p>
        </div>
      </div>

      {/* Steps Grid - versión simplificada y controlada */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 relative z-10">
        {steps.map(({ icon: Icon, title, desc, stepNumber, color, bgColor, iconBg }, index) => (
          <div
            key={`step-${index}-${title}`}
            className={`
              step-card
              group
              relative 
              rounded-3xl 
              border 
              border-white/10 
              bg-white/5 
              p-8 
              backdrop-blur 
              transition-all 
              duration-500
              overflow-hidden
              ${visibleSteps.includes(index) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}
            `}
            style={{
              transitionDelay: `${index * 200}ms`
            }}
          >
            {/* Glow effect controlado */}
            <div className={`absolute -inset-0.5 bg-gradient-to-r ${bgColor} rounded-3xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            {/* Step number - mejor posicionado dentro de la tarjeta */}
            <div className="absolute top-4 right-4 z-20">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center font-bold text-sm text-white shadow-lg transition-all duration-300 group-hover:scale-110`}>
                {stepNumber}
              </div>
            </div>

            {/* Card content */}
            <div className="relative z-10 pt-4">
              {/* Enhanced icon */}
              <div className="mb-6 relative">
                <div className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl ${iconBg} ring-1 ring-white/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl`}>
                  <Icon className="h-7 w-7 text-white transition-all duration-300" />
                </div>
              </div>

              {/* Enhanced title */}
              <h3 className="text-xl font-bold mb-4 text-white group-hover:text-white transition-all duration-300">
                {title}
              </h3>
              
              {/* Enhanced description */}
              <p className="text-white/70 leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                {desc}
              </p>

              {/* Progress indicator */}
              <div className="mt-6 flex items-center gap-2">
                {steps.map((_, stepIndex) => (
                  <div
                    key={stepIndex}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      stepIndex <= index 
                        ? `bg-gradient-to-r ${color} opacity-100` 
                        : 'bg-white/20 opacity-50'
                    }`}
                    style={{ width: stepIndex === index ? '24px' : '8px' }}
                  />
                ))}
              </div>

              {/* Arrow connector for mobile */}
              {index < steps.length - 1 && (
                <div className="md:hidden absolute -bottom-4 left-1/2 transform -translate-x-1/2 translate-y-full">
                  <div className={`w-0.5 h-8 bg-gradient-to-b ${color} opacity-50`} />
                  <div className={`w-2 h-2 bg-gradient-to-r ${color} rounded-full -mt-1 -ml-0.5`} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className={`mt-16 text-center transition-all duration-1000 delay-700 ${visibleSteps.length > 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="inline-flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <span>Tiempo estimado:</span>
            <span className="font-semibold text-white/90">~5 minutos</span>
          </div>
          <div className="w-px h-6 bg-white/20" />
          <div className="flex items-center gap-2 text-sm text-white/70">
            <span>Gas fees:</span>
            <span className="font-semibold text-emerald-400">Testnet gratis</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  )
}