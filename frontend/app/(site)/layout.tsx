import type { Metadata } from "next"
import Navigation from "@/src/components/template/Navigation"
import FooterStable from "@/src/components/template/FooterStable"

export const metadata: Metadata = {
  title: "StableBTC — BTC-backed loans en Starknet",
  description:
    "Depositá BTC (tBTC) como colateral y obtené USDT en minutos en Starknet (Sepolia). No-custodial, con simulador de LTV.",
  metadataBase: new URL("http://localhost:3000"), // ← cambiá por tu dominio cuando lo tengas
  openGraph: {
    title: "StableBTC — BTC-backed loans en Starknet",
    description:
      "Depositá BTC (tBTC) como colateral y obtené USDT en minutos en Starknet (Sepolia).",
    url: "/site",
    siteName: "StableBTC",
    images: [{ url: "/site-og.png", width: 1200, height: 630, alt: "StableBTC" }],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StableBTC — BTC-backed loans en Starknet",
    description:
      "Depositá BTC (tBTC) como colateral y obtené USDT en minutos en Starknet (Sepolia).",
    images: ["/site-og.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#0b0d12] text-white antialiased">
      <Navigation />
      <main className="pt-24">{children}</main>
      <FooterStable />
    </div>
  )
}
