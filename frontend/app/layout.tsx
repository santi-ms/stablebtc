import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

// 🔹 Importá tu header y footer globales (los mismos de la landing)
import Navigation from "@/src/components/template/Navigation"
import FooterStable from "@/src/components/template/FooterStable"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "StableBTC - Protocolo de Préstamos DeFi",
  description:
    "Protocolo de préstamos sobrecolateralizados con Bitcoin en Starknet",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="antialiased" suppressHydrationWarning>
      <body className={`min-h-screen font-sans ${inter.className} bg-[#0b0d12] text-white`}>
        {/* 🔹 Navbar visible en todas las rutas */}
        <Navigation />

        {/* 🔹 Contenido dinámico (landing o dApp) */}
        <main className="pt-24">{children}</main>

        {/* 🔹 Footer visible en todas las rutas */}
        <FooterStable />
      </body>
    </html>
  )
}
