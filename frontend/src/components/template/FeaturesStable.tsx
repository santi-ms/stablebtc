'use client'

import { Shield, Wallet, DollarSign, ArrowLeftRight, LineChart, Github } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const features = [
  {
    icon: Wallet,
    title: "Depositá BTC (tBTC)",
    desc: "Usás tBTC como colateral no-custodial. Todo on-chain en Starknet Sepolia.",
    bgColor: "bg-orange-500/20",
  },
  {
    icon: DollarSign,
    title: "Pedí USDT en minutos",
    desc: "Préstamo sobrecolateralizado. Fondos listos para usar en tu wallet.",
    bgColor: "bg-green-500/20",
  },
  {
    icon: ArrowLeftRight,
    title: "Swap integrado",
    desc: "Intercambiá sUSD ↔ USDT desde la misma interfaz (router configurable).",
    bgColor: "bg-blue-500/20",
  },
  {
    icon: LineChart,
    title: "Oráculo y LTV",
    desc: "Precio de BTC on-chain y simulador de LTV para evitar sorpresas.",
    bgColor: "bg-purple-500/20",
  },
  {
    icon: Shield,
    title: "Seguro por diseño",
    desc: "MCR 150%, alertas visuales y límites dinámicos de mint/withdraw.",
    bgColor: "bg-red-500/20",
  },
  {
    icon: Github,
    title: "Abierto y extensible",
    desc: "Contratos y frontend open-source. Listo para iterar en el hackatón.",
    bgColor: "bg-indigo-500/20",
  },
]

export default function FeaturesStable() {
  const [visibleItems, setVisibleItems] = useState<number[]>([])
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            features.forEach((_, index) => {
              setTimeout(() => {
                setVisibleItems(prev => [...prev, index])
              }, index * 100)
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
      id="caracteristicas" 
      ref={sectionRef}
      className="scroll-mt-28 mx-auto max-w-6xl px-6 py-16 md:py-20 relative"
    >
      {/* Background simple */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <div className="mx-auto mb-16 max-w-2xl text-center relative z-10">
        <div className={`transition-all duration-1000 ${visibleItems.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 backdrop-blur-xl mb-6">
            <div className="flex h-2 w-2 items-center justify-center">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 animate-ping" />
              <div className="absolute h-2 w-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400" />
            </div>
            <span className="text-xs font-semibold tracking-wider text-white/80">CARACTERÍSTICAS CLAVE</span>
          </div>

          <h2 className="text-4xl font-bold md:text-5xl bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent mb-4">
            Características
          </h2>
          <p className="text-lg text-white/70 leading-relaxed">
            Lo esencial para mostrar en el demo: claro, directo y con foco en el{' '}
            <span className="text-white/90 font-medium">flujo real</span>.
          </p>
        </div>
      </div>

      {/* Grid con efectos mejorados pero controlados */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 relative z-10">
        {features.map((feature, index) => {
          const Icon = feature.icon
          const isVisible = visibleItems.includes(index)

          return (
            <div
              key={index}
              className={`
                feature-card
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
                transitionDelay: `${index * 100}ms`
              }}
            >
              {/* Glow effect controlado */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />

              {/* Contenido */}
              <div className="relative z-10">
                {/* Icono con efectos */}
                <div className="mb-4 relative">
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${feature.bgColor} ring-1 ring-white/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
                    <Icon className="h-6 w-6 text-white transition-transform duration-300 group-hover:scale-105" />
                  </div>
                </div>

                {/* Título */}
                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-white transition-colors duration-300">
                  {feature.title}
                </h3>
                
                {/* Descripción */}
                <p className="text-white/70 leading-relaxed group-hover:text-white/85 transition-colors duration-300">
                  {feature.desc}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* CSS mejorado con efectos controlados */}
      <style jsx>{`
        .feature-card {
          position: relative;
          isolation: isolate;
        }
        
        .feature-card:hover {
          transform: scale(1.05) translateY(-8px);
          border-color: rgba(255, 255, 255, 0.3);
          background-color: rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        }
        
        .feature-card:nth-child(1):hover {
          box-shadow: 0 25px 50px rgba(255, 165, 0, 0.2);
          border-color: rgba(255, 165, 0, 0.3);
        }
        
        .feature-card:nth-child(2):hover {
          box-shadow: 0 25px 50px rgba(34, 197, 94, 0.2);
          border-color: rgba(34, 197, 94, 0.3);
        }
        
        .feature-card:nth-child(3):hover {
          box-shadow: 0 25px 50px rgba(59, 130, 246, 0.2);
          border-color: rgba(59, 130, 246, 0.3);
        }
        
        .feature-card:nth-child(4):hover {
          box-shadow: 0 25px 50px rgba(168, 85, 247, 0.2);
          border-color: rgba(168, 85, 247, 0.3);
        }
        
        .feature-card:nth-child(5):hover {
          box-shadow: 0 25px 50px rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.3);
        }
        
        .feature-card:nth-child(6):hover {
          box-shadow: 0 25px 50px rgba(99, 102, 241, 0.2);
          border-color: rgba(99, 102, 241, 0.3);
        }
      `}</style>
    </section>
  )
}