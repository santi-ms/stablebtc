import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'StableBTC - Protocolo de Préstamos DeFi',
  description: 'Protocolo de préstamos sobrecolateralizados con Bitcoin en Starknet',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="antialiased" suppressHydrationWarning>
      <body className={`min-h-screen font-sans ${inter.className}`}>
        {children}
      </body>
    </html>
  )
}