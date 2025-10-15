'use client'

import { Shield, AlertTriangle, DollarSign, Percent, LineChart, ArrowLeftRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const items = [
  {
    icon: Shield,
    title: 'MCR (Collateral mínimo)',
    value: '150%',
    desc: 'Relación mínima colateral/deuda para evitar liquidación.',
    category: 'Seguridad',
    color: 'from-emerald-500 to-green-500',
    bgColor: 'from-emerald-500/10 to-green-500/10',
    status: 'safe',
    trend: 'stable',
  },
  {
    icon: Percent,
    title: 'LTV máximo',
    value: '≈ 66.7%',
    desc: 'Derivado del MCR (1 / 1.5). Mantener por debajo para estar seguro.',
    category: 'Límites',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'from-blue-500/10 to-cyan-500/10',
    status: 'optimal',
    trend: 'stable',
  },
  {
    icon: DollarSign,
    title: 'Fee de mint',
    value: '0.2% (demo)',
    desc: 'Configurable en contrato. Ajustable según el modelo.',
    category: 'Costos',
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'from-yellow-500/10 to-orange-500/10',
    status: 'configurable',
    trend: 'flexible',
  },
  {
    icon: AlertTriangle,
    title: 'Penalización de liquidación',
    value: '5% (demo)',
    desc: 'Incentivo para liquidadores; protege la solvencia del sistema.',
    category: 'Penalizaciones',
    color: 'from-red-500 to-pink-500',
    bgColor: 'from-red-500/10 to-pink-500/10',
    status: 'warning',
    trend: 'configurable',
  },
  {
    icon: LineChart,
    title: 'Oráculo',
    value: 'On-chain (Sepolia)',
    desc: 'Fuente demo en testnet; se puede cambiar por tu feed final.',
    category: 'Infraestructura',
    color: 'from-purple-500 to-indigo-500',
    bgColor: 'from-purple-500/10 to-indigo-500/10',
    status: 'demo',
    trend: 'upgradeable',
  },
  {
    icon: ArrowLeftRight,
    title: 'Router de swap',
    value: 'Mock / 10kswap',
    desc: 'Intercambio sUSD ↔ USDT desde la UI (router configurable).',
    category: 'Integración',
    color: 'from-teal-500 to-cyan-500',
    bgColor: 'from-teal-500/10 to-cyan-500/10',
    status: 'beta',
    trend: 'configurable',
  },
]

const statusConfig = {
  safe: { color: 'text-emerald-400', bg: 'bg-emerald-400/20', label: 'Seguro' },
  optimal: { color: 'text-blue-400', bg: 'bg-blue-400/20', label: 'Óptimo' },
  configurable: { color: 'text-yellow-400', bg: 'bg-yellow-400/20', label: 'Config' },
  warning: { color: 'text-red-400', bg: 'bg-red-400/20', label: 'Cuidado' },
  demo: { color: 'text-purple-400', bg: 'bg-purple-400/20', label: 'Demo' },
  beta: { color: 'text-teal-400', bg: 'bg-teal-400/20', label: 'Beta' },
}

export default function KeyParamsStable() {
  const [visibleItems, setVisibleItems] = useState<number[]>([])
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            items.forEach((_, index) => {
              setTimeout(() => {
                setVisibleItems(prev => [...prev, index])
              }, index * 150)
            })
          }
        })
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section 
      id="parametros" 
      ref={sectionRef}
      className="mx-auto max-w-6xl px-6 py-16 md:py-20 scroll-mt-28 relative"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      {/* Header */}
      <div className="mx-auto mb-12 max-w-3xl text-center relative z-10">
        <div className={`transition-all duration-1000 ${visibleItems.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Security badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 backdrop-blur-xl mb-6">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold tracking-wider text-white/80">PARÁMETROS CLAVE</span>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          </div>

          <h2 className="text-4xl font-bold md:text-5xl bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent mb-4">
            Parámetros & seguridad
          </h2>
          <p className="text-lg text-white/70 leading-relaxed">
            Resumen de valores clave usados en el demo. Los definitivos pueden cambiar al{' '}
            <span className="text-white/90 font-medium">cerrar la versión final</span>.
          </p>
        </div>
      </div>

      {/* Parameters Grid - versión simplificada */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 relative z-10">
        {items.map((item, index) => {
          const { icon: Icon, title, value, desc, category, color, bgColor, status } = item
          const statusInfo = statusConfig[status as keyof typeof statusConfig]
          const isVisible = visibleItems.includes(index)

          return (
            <div
              key={`param-${index}-${title}`}
              className={`
                param-card
                group
                relative 
                rounded-2xl 
                border 
                border-white/10 
                bg-white/5 
                p-6 
                backdrop-blur 
                transition-all 
                duration-500
                overflow-hidden
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}
              `}
              style={{
                transitionDelay: `${index * 150}ms`
              }}
            >
              {/* Glow effect controlado */}
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${bgColor} rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              {/* Category label - posición mejorada */}
              <div className="mb-2">
                <div className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl">
                  <span className="text-xs font-medium text-white/80">{category}</span>
                </div>
              </div>

              {/* Status indicator */}
              <div className="absolute top-4 right-4 z-20">
                <div className={`w-3 h-3 rounded-full ${statusInfo.bg} border border-white/20 transition-all duration-300 group-hover:scale-125`}>
                  <div className={`w-full h-full rounded-full ${statusInfo.bg} animate-pulse`} />
                </div>
              </div>

              {/* Main content */}
              <div className="relative z-10 pt-4">
                {/* Icon */}
                <div className="mb-4 relative">
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${bgColor} ring-1 ring-white/20 transition-all duration-300 group-hover:scale-105`}>
                    <Icon className="h-6 w-6 text-white transition-all duration-300" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold mb-2 text-white transition-all duration-300">
                  {title}
                </h3>

                {/* Value with status badge */}
                <div className="mb-3 flex items-center gap-3">
                  <p className={`text-xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                    {value}
                  </p>
                  <div className={`px-2 py-1 rounded-md ${statusInfo.bg} border border-white/10`}>
                    <span className={`text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-white/70 leading-relaxed text-sm group-hover:text-white/85 transition-colors duration-300">
                  {desc}
                </p>

                {/* Trend indicator */}
                <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
                  <div className="w-4 h-0.5 bg-gradient-to-r from-white/20 to-white/5 rounded-full" />
                  <span className="capitalize">{item.trend}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom summary */}
      <div className={`mt-16 text-center transition-all duration-1000 delay-1000 ${visibleItems.length > 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="inline-flex items-center gap-6 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Parámetros optimizados</span>
          </div>
          <div className="w-px h-6 bg-white/20" />
          <div className="flex items-center gap-2 text-sm text-white/70">
            <span>Demo seguro</span>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <div className="w-px h-6 bg-white/20" />
          <div className="flex items-center gap-2 text-sm text-white/70">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span>Valores de testnet</span>
          </div>
        </div>
      </div>
    </section>
  )
}