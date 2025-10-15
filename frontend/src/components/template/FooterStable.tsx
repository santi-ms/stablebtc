'use client'

import Link from 'next/link'
import { Github, ExternalLink, ArrowRight, Zap, Shield, Code2 } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function FooterStable() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.1 }
    )

    const footer = document.querySelector('footer')
    if (footer) {
      observer.observe(footer)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <footer className="mt-20 border-t border-white/10 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-64 h-64 bg-gradient-to-r from-violet-500/5 to-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-48 h-48 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-full blur-3xl" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.01)_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-12 relative z-10">
        <div className="grid gap-12 md:grid-cols-3 mb-12">
          
          {/* Brand section */}
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="h-4 w-4 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 animate-pulse" />
                <div className="absolute inset-0 h-4 w-4 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 blur-sm opacity-50" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
                StableBTC
              </span>
            </div>
            <p className="text-white/70 leading-relaxed mb-6">
              Préstamos sobrecolateralizados: depositás BTC (tBTC) y obtenés USDT en Starknet.
            </p>
            
            {/* Key features mini-badges */}
            <div className="flex flex-wrap gap-2">
              {[
                { icon: Shield, label: 'Seguro', color: 'from-emerald-500/20 to-green-500/20' },
                { icon: Zap, label: 'Rápido', color: 'from-yellow-500/20 to-orange-500/20' },
                { icon: Code2, label: 'Open Source', color: 'from-purple-500/20 to-indigo-500/20' }
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${color} border border-white/10 backdrop-blur-sm`}>
                  <Icon className="w-3 h-3 text-white/80" />
                  <span className="text-xs font-medium text-white/80">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Product section */}
          <nav className={`grid gap-4 content-start transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h4 className="text-sm font-bold text-white/90 mb-2 flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-violet-500 to-indigo-500 rounded-full" />
              Producto
            </h4>
            <Link 
              href="/site#caracteristicas" 
              className="group text-sm text-white/70 hover:text-white transition-all duration-300 flex items-center gap-2"
            >
              <span>Características</span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
            </Link>
            <Link 
              href="/" 
              className="group text-sm text-white/70 hover:text-white transition-all duration-300 flex items-center gap-2"
            >
              <span>Abrir dApp</span>
              <div className="w-2 h-2 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300" />
            </Link>
          </nav>

          {/* Resources section */}
          <nav className={`grid gap-4 content-start transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h4 className="text-sm font-bold text-white/90 mb-2 flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
              Recursos
            </h4>
            <a
              href="https://github.com/..." 
              target="_blank" 
              rel="noreferrer"
              className="group inline-flex items-center gap-3 text-sm text-white/70 hover:text-white transition-all duration-300"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
                <Github className="h-4 w-4" />
              </div>
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </a>
            <a
              href="https://sepolia.voyager.online/" 
              target="_blank" 
              rel="noreferrer"
              className="group inline-flex items-center gap-3 text-sm text-white/70 hover:text-white transition-all duration-300"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
                <ExternalLink className="h-4 w-4" />
              </div>
              <span>Voyager</span>
              <div className="w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-opacity duration-300" />
            </a>
          </nav>
        </div>

        {/* Enhanced bottom section */}
        <div className="border-t border-white/10 pt-8">
          <div className={`flex flex-col items-center justify-between gap-6 md:flex-row transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            
            {/* Copyright with enhanced styling */}
            <div className="flex items-center gap-4">
              <p className="text-sm text-white/50">
                © {new Date().getFullYear()} StableBTC — Hackatón Starknet
              </p>
              <div className="hidden md:flex items-center gap-2">
                <div className="w-1 h-1 bg-white/30 rounded-full" />
                <span className="text-xs text-white/40">Demo Version</span>
              </div>
            </div>

            {/* Enhanced CTA button */}
            <Link
              href="/"
              className="group relative inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-gradient-to-r from-white/5 to-white/10 px-6 py-3 backdrop-blur-xl transition-all duration-300 hover:border-white/30 hover:bg-gradient-to-r hover:from-white/10 hover:to-white/20 hover:scale-105"
            >
              <span className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors duration-300">
                Abrir dApp
              </span>
              <ArrowRight className="h-4 w-4 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
              
              {/* Button glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 blur transition-opacity duration-300" />
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
            </Link>
          </div>

          {/* Additional info row */}
          <div className={`mt-6 pt-6 border-t border-white/5 flex flex-wrap items-center justify-center gap-6 text-xs text-white/40 transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span>Testnet Live</span>
            </div>
            <div className="w-px h-3 bg-white/20" />
            <div className="flex items-center gap-2">
              <span>Starknet Sepolia</span>
            </div>
            <div className="w-px h-3 bg-white/20" />
            <div className="flex items-center gap-2">
              <span>Open Source</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}