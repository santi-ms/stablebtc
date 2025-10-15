'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, HelpCircle, Zap, Shield, Wallet, AlertTriangle, Coins, Settings } from 'lucide-react'

const faqs = [
  {
    q: '¿En qué red corre?',
    a: 'Starknet Sepolia (testnet). Ideal para demo del hackatón.',
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'from-blue-500/10 to-cyan-500/10',
  },
  {
    q: '¿Qué deposito como colateral?',
    a: 'tBTC (wrapped/bridge en testnet). Ese colateral respalda tu préstamo.',
    icon: Coins,
    color: 'from-orange-500 to-yellow-500',
    bgColor: 'from-orange-500/10 to-yellow-500/10',
  },
  {
    q: '¿Qué recibo al pedir el préstamo?',
    a: 'USDT en tu wallet (en testnet). Podés swapear o usarlo en otros protocolos.',
    icon: Wallet,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'from-green-500/10 to-emerald-500/10',
  },
  {
    q: '¿Cuál es el riesgo principal?',
    a: 'Si el LTV supera el límite (MCR 150%), tu posición puede liquidarse. La UI muestra simulaciones para evitarlo.',
    icon: AlertTriangle,
    color: 'from-red-500 to-pink-500',
    bgColor: 'from-red-500/10 to-pink-500/10',
  },
  {
    q: '¿Qué wallets soporta?',
    a: 'Argent X y Braavos en Starknet.',
    icon: Shield,
    color: 'from-purple-500 to-indigo-500',
    bgColor: 'from-purple-500/10 to-indigo-500/10',
  },
  {
    q: '¿Hay comisiones?',
    a: 'Solo gas de red y las comisiones del DEX si hacés swap. Los parámetros pueden cambiar durante el hackatón.',
    icon: Settings,
    color: 'from-gray-500 to-slate-500',
    bgColor: 'from-gray-500/10 to-slate-500/10',
  },
]

export default function FAQStable() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())
  const [visibleItems, setVisibleItems] = useState<number[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const sectionRef = useRef<HTMLElement>(null)

  const filteredFaqs = faqs.filter(faq => 
    faq.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.a.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            faqs.forEach((_, index) => {
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

  const toggleFaq = (index: number) => {
    setOpenItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  return (
    <section 
      id="faq" 
      ref={sectionRef}
      className="scroll-mt-28 mx-auto max-w-4xl px-6 py-16 md:py-20 relative"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <div className="mb-12 text-center relative z-10">
        <div className={`transition-all duration-1000 ${visibleItems.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* FAQ Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 backdrop-blur-xl mb-6">
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold tracking-wider text-white/80">PREGUNTAS FRECUENTES</span>
          </div>

          <h2 className="text-4xl font-bold md:text-5xl bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent mb-4">
            FAQ
          </h2>
          <p className="text-lg text-white/70 leading-relaxed mb-8">
            Preguntas frecuentes sobre el <span className="text-white/90 font-medium">demo</span>
          </p>

          {/* Search bar */}
          <div className="max-w-md mx-auto relative">
            <input
              type="text"
              placeholder="Buscar en FAQ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl text-white placeholder-white/50 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all duration-300"
            />
            <HelpCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50 hover:text-white/80 transition-colors"
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FAQ Items */}
      <div className="space-y-4 relative z-10">
        {filteredFaqs.map((faq, index) => {
          const originalIndex = faqs.findIndex(f => f.q === faq.q)
          const isOpen = openItems.has(originalIndex)
          const Icon = faq.icon

          return (
            <div
              key={faq.q}
              className={`group relative transition-all duration-700 ${
                visibleItems.includes(originalIndex) 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-8'
              }`}
              style={{
                transitionDelay: `${originalIndex * 100}ms`
              }}
            >
              {/* Glow effect */}
              <div className={`absolute -inset-0.5 bg-gradient-to-r ${faq.bgColor} rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div 
                className={`relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur transition-all duration-300 overflow-hidden ${
                  isOpen ? 'border-white/20 bg-white/10' : 'hover:border-white/20 hover:bg-white/10'
                }`}
              >
                {/* Question */}
                <button
                  onClick={() => toggleFaq(originalIndex)}
                  className="w-full p-6 text-left transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${faq.bgColor} border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${isOpen ? 'scale-110' : ''}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      
                      {/* Question text */}
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent group-hover:from-white group-hover:to-white transition-all duration-300">
                        {faq.q}
                      </h3>
                    </div>
                    
                    {/* Toggle button */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg border border-white/20 bg-white/5 flex items-center justify-center transition-all duration-300 ${isOpen ? 'rotate-180 bg-gradient-to-r from-white/10 to-white/20' : 'group-hover:bg-white/10'}`}>
                      <ChevronDown className="w-4 h-4 text-white/70" />
                    </div>
                  </div>
                </button>

                {/* Answer */}
                <div 
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-6">
                    <div className={`pl-14 border-l-2 bg-gradient-to-b ${faq.bgColor} border-opacity-30`}>
                      <p className="text-white/80 leading-relaxed pl-4">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Shimmer effect */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              </div>
            </div>
          )
        })}
      </div>

      {/* No results */}
      {searchTerm && filteredFaqs.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-white/50" />
          </div>
          <p className="text-white/70">No se encontraron preguntas que coincidan con tu búsqueda.</p>
          <button
            onClick={() => setSearchTerm('')}
            className="mt-4 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 transition-colors"
          >
            Limpiar búsqueda
          </button>
        </div>
      )}

      {/* Bottom stats */}
      <div className={`mt-16 text-center transition-all duration-1000 delay-700 ${visibleItems.length > 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="inline-flex items-center gap-6 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <span>{faqs.length} preguntas</span>
          </div>
          <div className="w-px h-6 bg-white/20" />
          <div className="flex items-center gap-2 text-sm text-white/70">
            <span>Actualizado para el hack</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  )
}