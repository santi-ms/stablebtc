'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X, Zap } from 'lucide-react'

// helper simple
function cn(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(' ')
}

function useScrollThreshold(threshold = 15) {
  const [scrolled, setScrolled] = React.useState(false)
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])
  return scrolled
}

function useActiveSection() {
  const [activeSection, setActiveSection] = React.useState('')
  
  React.useEffect(() => {
    const sections = ['caracteristicas', 'como-funciona', 'faq', 'parametros']
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        })
      },
      { threshold: 0.3, rootMargin: '-20% 0px -20% 0px' }
    )

    sections.forEach((id) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [])

  return activeSection
}

function StableBTCLogo({ className = '' }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 font-bold', className)}>
      <div className="relative">
        <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg" />
        <div className="absolute inset-0 h-6 w-6 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-400 blur-sm opacity-60 animate-pulse" />
        <div className="absolute top-1 left-1 h-2 w-2 rounded-full bg-white/40" />
      </div>
      <span className="bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">
        StableBTC
      </span>
    </div>
  )
}

export default function Navigation() {
  const scrolled = useScrollThreshold(15)
  const activeSection = useActiveSection()
  const [open, setOpen] = React.useState(false)
  const [isExpanded, setIsExpanded] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = () => setOpen(false)
    mq.addEventListener('change', handler)
    handler()
    return () => mq.removeEventListener('change', handler)
  }, [])

  const LINKS = [
    { label: 'Características', href: '/site#caracteristicas', id: 'caracteristicas' },
    { label: 'Cómo funciona', href: '/site#como-funciona', id: 'como-funciona' },
    { label: 'FAQ', href: '/site#faq', id: 'faq' },
    { label: 'Parámetros', href: '/site#parametros', id: 'parametros' }
  ]

  const toggleMenu = () => {
    setOpen(!open)
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="card-nav-container">
      <nav 
        className={cn(
          'card-nav',
          open ? 'open' : '',
          scrolled ? 'scrolled' : ''
        )}
      >
        <div className="card-nav-top">
          {/* Hamburger Menu */}
          <div
            className={cn('hamburger-menu', open ? 'open' : '')}
            onClick={toggleMenu}
            role="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            tabIndex={0}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>

          {/* Logo */}
          <div className="logo-container">
            <Link href="/" aria-label="Home">
              <StableBTCLogo />
            </Link>
          </div>

          {/* CTA Button */}
          <Link href="/" className="card-nav-cta-button">
            <Zap className="w-4 h-4 mr-2" />
            Abrir dApp
          </Link>
        </div>

        {/* Expandable Content */}
        <div className="card-nav-content" aria-hidden={!open}>
          <div className="nav-card" style={{ backgroundColor: '#1a1b3a' }}>
            <div className="nav-card-label">Información</div>
            <div className="nav-card-links">
              <Link href="/site#caracteristicas" className="nav-card-link" onClick={() => setOpen(false)}>
                Características
              </Link>
              <Link href="/site#como-funciona" className="nav-card-link" onClick={() => setOpen(false)}>
                Cómo funciona
              </Link>
            </div>
          </div>

          <div className="nav-card" style={{ backgroundColor: '#2d1b45' }}>
            <div className="nav-card-label">Soporte</div>
            <div className="nav-card-links">
              <Link href="/site#faq" className="nav-card-link" onClick={() => setOpen(false)}>
                FAQ
              </Link>
              <Link href="/site#parametros" className="nav-card-link" onClick={() => setOpen(false)}>
                Parámetros
              </Link>
            </div>
          </div>

          <div className="nav-card" style={{ backgroundColor: '#0f3460' }}>
            <div className="nav-card-label">Acción</div>
            <div className="nav-card-links">
              <Link href="/" className="nav-card-link" onClick={() => setOpen(false)}>
                <Zap className="w-4 h-4" />
                Abrir dApp
              </Link>
              <a href="https://github.com/" target="_blank" rel="noreferrer" className="nav-card-link">
                Ver Código
              </a>
            </div>
          </div>
        </div>
      </nav>

      <style jsx>{`
        .card-nav-container {
          position: fixed;
          top: 1rem;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 800px;
          z-index: 1000;
          box-sizing: border-box;
        }

        .card-nav {
          display: block;
          height: 60px;
          padding: 0;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.75rem;
          backdrop-filter: blur(20px);
          position: relative;
          overflow: hidden;
          transition: all 0.4s ease;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        }

        .card-nav.scrolled {
          background: rgba(0, 0, 0, 0.7);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.24);
        }

        .card-nav.open {
          height: 280px;
          background: rgba(0, 0, 0, 0.8);
        }

        .card-nav-top {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0.45rem 0.55rem 1.1rem;
          z-index: 2;
        }

        .hamburger-menu {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          gap: 6px;
          padding: 8px;
          border-radius: 8px;
          transition: background-color 0.2s ease;
        }

        .hamburger-menu:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .hamburger-line {
          width: 24px;
          height: 2px;
          background: rgba(255, 255, 255, 0.8);
          transition: all 0.25s ease;
          transform-origin: center;
        }

        .hamburger-menu.open .hamburger-line:first-child {
          transform: translateY(4px) rotate(45deg);
        }

        .hamburger-menu.open .hamburger-line:last-child {
          transform: translateY(-4px) rotate(-45deg);
        }

        .logo-container {
          display: flex;
          align-items: center;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        }

        .card-nav-cta-button {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border: none;
          border-radius: calc(0.75rem - 0.35rem);
          padding: 0 1rem;
          height: calc(100% - 8px);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          text-decoration: none;
          font-size: 0.875rem;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .card-nav-cta-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
        }

        .card-nav-content {
          position: absolute;
          left: 0;
          right: 0;
          top: 60px;
          bottom: 0;
          padding: 0.75rem;
          display: flex;
          align-items: flex-end;
          gap: 12px;
          visibility: hidden;
          pointer-events: none;
          z-index: 1;
          opacity: 0;
          transition: all 0.3s ease;
        }

        .card-nav.open .card-nav-content {
          visibility: visible;
          pointer-events: auto;
          opacity: 1;
        }

        .nav-card {
          height: 180px;
          flex: 1 1 0;
          min-width: 0;
          border-radius: calc(0.75rem - 0.2rem);
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 16px;
          gap: 12px;
          user-select: none;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
          transform: translateY(20px);
          animation: slideUp 0.4s ease forwards;
        }

        .nav-card:nth-child(1) { animation-delay: 0.1s; }
        .nav-card:nth-child(2) { animation-delay: 0.2s; }
        .nav-card:nth-child(3) { animation-delay: 0.3s; }

        .nav-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .nav-card-label {
          font-weight: 600;
          font-size: 20px;
          letter-spacing: -0.5px;
          color: white;
          margin-bottom: auto;
        }

        .nav-card-links {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nav-card-link {
          font-size: 14px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(255, 255, 255, 0.7);
          padding: 4px 0;
          border-radius: 4px;
        }

        .nav-card-link:hover {
          color: white;
          transform: translateX(4px);
        }

        @keyframes slideUp {
          to {
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .card-nav-container {
            width: 95%;
            top: 0.75rem;
          }

          .card-nav-top {
            padding: 0.5rem 1rem;
            justify-content: space-between;
          }

          .hamburger-menu {
            order: 2;
          }

          .logo-container {
            position: static;
            transform: none;
            order: 1;
          }

          .card-nav-cta-button {
            display: none;
          }

          .card-nav.open {
            height: auto;
            min-height: 320px;
          }

          .card-nav-content {
            flex-direction: column;
            align-items: stretch;
            gap: 12px;
            padding: 0.75rem;
            position: relative;
            top: 0;
          }

          .nav-card {
            height: auto;
            min-height: 80px;
            flex: none;
          }

          .nav-card-label {
            font-size: 18px;
            margin-bottom: 8px;
          }

          .nav-card-links {
            margin-top: 0;
          }

          .nav-card-link {
            font-size: 15px;
          }
        }
      `}</style>
    </div>
  )
}