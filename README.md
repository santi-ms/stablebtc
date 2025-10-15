# StableBTC Starter (WSL + Devcontainer)

Entorno reproducible con versiones fijas para evitar conflictos en Windows/WSL.

## Requisitos previos
- Docker Desktop (Engine running) con WSL integration activada para Ubuntu.
- VS Code con la extensión "Dev Containers".

## Uso
1. Extrae este ZIP en **WSL** (por ejemplo `~/stablebtc`).
2. Abre la carpeta en VS Code y elige **"Reopen in Container"**.
3. En la terminal del contenedor:
   ```bash
   cd contracts
   scarb build
   ```
4. Frontend (opcional):
   ```bash
   cd ../frontend
   pnpm next dev
   ```
   Luego abre http://localhost:3000

## Versiones fijadas
- Rust 1.79.0
- Scarb 2.7.1
- Starknet Foundry v0.23.0
- Node 20 + pnpm 9.1.4
- Cairo/starknet crates 2.6.3

> Sube este repo a Git y mantené estas versiones para estabilidad.
