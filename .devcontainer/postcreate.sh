#!/usr/bin/env bash
set -euo pipefail
cd /workspaces/stablebtc

# ---- Cairo contracts skeleton ----
if [ ! -f contracts/Scarb.toml ]; then
  mkdir -p contracts/src
  cat > contracts/Scarb.toml <<'EOF'
[package]
name = "stablebtc_contracts"
version = "0.1.0"
edition = "2023_10"

[cairo]
version = "2.6.3"

[dependencies]
starknet = "2.6.3"

[[target.starknet-contract]]
sierra = true
casm = false
EOF

  cat > contracts/src/lib.cairo <<'EOF'
%lang starknet
#[contract]
mod Hello {
    #[storage]
    struct Storage { counter: u128 }

    #[constructor]
    fn constructor(ref self: Storage) { self.counter.write(0); }

    #[external]
    fn get(self: @Storage) -> u128 { self.counter.read() }

    #[external]
    fn inc(ref self: Storage) {
        let v = self.counter.read() + 1_u128;
        self.counter.write(v);
    }
}
EOF
fi

# ---- Frontend minimal (Next.js placeholder) ----
if [ ! -f frontend/package.json ]; then
  cd frontend
  pnpm init -y
  pnpm add next@14.2.5 react@18.3.1 react-dom@18.3.1 \
    @starknet-react/core@2.8.0 starknet@6.19.0 \
    tailwindcss@3.4.9 autoprefixer@10.4.20 postcss@8.4.41
  npx tailwindcss init -p
  mkdir -p app
  cat > app/page.tsx <<'EOF'
export default function Home() {
  return <main className="p-6">StableBTC — setup OK ✅</main>;
}
EOF
fi

echo "✅ Devcontainer listo. Prueba: cd contracts && scarb build"
