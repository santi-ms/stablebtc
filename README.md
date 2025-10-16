# 🪙 StableBTC — BTC-backed Loans on Starknet

**StableBTC** es un protocolo DeFi de préstamos **sobrecolateralizados con Bitcoin tokenizado (tBTC)**, desplegado en **Starknet Sepolia**.  
Permite depositar BTC como colateral y obtener liquidez instantánea en **sUSD** de forma no-custodial y transparente.

---

## 🌐 Demo en producción
🔗 **[https://stablebtc.vercel.app](https://stablebtc.vercel.app)**

---

## ⚙️ Stack técnico

| Componente | Tecnología |
|-------------|-------------|
| **Frontend** | Next.js 15 (App Router) + TypeScript + TailwindCSS + shadcn/ui |
| **Contratos** | Cairo 1 (Starknet Sepolia) |
| **Toolchain** | Scarb 2.12.1 / Foundry v0.23 / starknet.js + starknetkit |
| **Infraestructura** | Docker + Dev Containers (WSL2 Ubuntu) |
| **Deploy** | Vercel (Frontend) |
| **Wallets** | Starknet Sepolia RPC + Argent X / Braavos |

---

## 🚀 Características principales

- 🧮 Préstamos sobrecolateralizados con **tBTC**
- 💰 Stablecoin **sUSD** emitida por el contrato **VaultManager**
- 🔒 Totalmente **no-custodial / on-chain**
- ⚡ Interfaz moderna con **LTV visual**, botones y métricas en tiempo real
- 🔄 Integración de **swap a USDT** (Ekubo / JediSwap)
- 📈 Oráculo personalizado con actualización off-chain (pipeline Python)

---

## 🧱 Estructura del proyecto

stablebtc/
│
├── contracts/ # Contratos Cairo 1 (VaultManager, StableToken, Oracle, etc.)
├── frontend/ # Frontend (Next.js 15)
│ ├── app/ # App Router
│ │ ├── (site)/ # Landing page pública
│ │ └── app/ # Dashboard principal (dApp)
│ ├── src/ # Hooks, servicios, componentes y lógica de conexión
│ └── public/ # Assets estáticos
└── README.md

yaml
Copiar código

---

## 🧰 Instalación local (WSL + DevContainer)

1. Cloná el repo:

   ```bash
   git clone https://github.com/santi-ms/stablebtc.git
   cd stablebtc
Abrí el proyecto en VS Code y seleccioná
👉 “Reopen in Container”

Compilá los contratos:

bash
Copiar código
cd contracts
scarb build
Corré el frontend:

bash
Copiar código
cd ../frontend
pnpm install
pnpm next dev
Abrí http://localhost:3000

🔗 Variables de entorno
En /frontend/.env.local definí tus direcciones:

bash
Copiar código
NEXT_PUBLIC_STARKNET_RPC_URL="https://sepolia.starknet.io"
NEXT_PUBLIC_VAULT_ADDRESS="0x..."
NEXT_PUBLIC_STABLE_TOKEN="0x..."
NEXT_PUBLIC_ORACLE_ADDRESS="0x..."
NEXT_PUBLIC_TBTC_ADDRESS="0x..."
🌍 Deploy en Vercel
El proyecto está listo para deploy automático desde main.
En Vercel → Settings → Environment Variables, agregá las mismas claves que en .env.local.

🧪 Desarrollo y pruebas
bash
Copiar código
pnpm lint
pnpm test
O directamente en el contenedor dev:

bash
Copiar código
Ctrl + Shift + P → "Dev Containers: Reopen in Container"
🧾 Licencia
MIT © 2025 santi-ms

💬 Contacto
📧 GitHub: @santi-ms
🌐 Web: https://stablebtc.vercel.app

Construido con ❤️ sobre Starknet — Proyecto StableBTC 2025
