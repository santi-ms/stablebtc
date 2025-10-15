'use client'

import { useState, useEffect } from 'react'
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { connect, disconnect } from 'starknetkit'
import { Contract, RpcProvider, cairo, uint256 } from 'starknet'
import { toast, Toaster } from 'react-hot-toast'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Wallet,
  TrendingUp,
  DollarSign,
  Shield,
  ArrowUpCircle,
  ArrowDownCircle,
  Zap,
  AlertTriangle,
} from 'lucide-react'

// ⬇️ Import del swap card
// import SwapToUSDTCard from '@/components/SwapToUSDTCard';
// ✅ usá el alias
import SwapToUSDTCard from '@/components/SwapToUSDTCard';


// Uint256 {low, high} -> string (wei)
const u256ToStr = (u: any) => uint256.uint256ToBN(u).toString()

// ======= Constantes de entorno =======
const RPC_URL = process.env.NEXT_PUBLIC_RPC!
const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT!
const STABLE_ADDRESS = process.env.NEXT_PUBLIC_STABLE!
const COLLATERAL_ADDRESS = process.env.NEXT_PUBLIC_COLLATERAL!
const ORACLE_ADDRESS = process.env.NEXT_PUBLIC_ORACLE!
// usados por el SwapToUSDTCard internamente (vía hooks/servicio)
const DEX_ROUTER = process.env.NEXT_PUBLIC_DEX_ROUTER!
const USDT_ADDRESS = process.env.NEXT_PUBLIC_USDT!

const provider = new RpcProvider({ nodeUrl: RPC_URL })

// ======= ABIs (inline) =======
const Uint256Def = {
  name: 'Uint256',
  type: 'struct',
  members: [
    { name: 'low', type: 'felt' },
    { name: 'high', type: 'felt' },
  ],
}

const VaultDataDef = {
  name: 'VaultData',
  type: 'struct',
  members: [
    { name: 'collateral_amount', type: 'Uint256' },
    { name: 'debt_amount', type: 'Uint256' },
  ],
}

const vaultAbi = [
  Uint256Def,
  VaultDataDef,
  {
    name: 'get_vault',
    type: 'function',
    inputs: [{ name: 'user', type: 'felt' }],
    outputs: [{ name: 'vault', type: 'VaultData' }],
    state_mutability: 'view',
  },
  {
    name: 'deposit',
    type: 'function',
    inputs: [{ name: 'amount', type: 'Uint256' }],
    outputs: [],
    state_mutability: 'external',
  },
  {
    name: 'withdraw',
    type: 'function',
    inputs: [{ name: 'amount', type: 'Uint256' }],
    outputs: [],
    state_mutability: 'external',
  },
  {
    name: 'mint',
    type: 'function',
    inputs: [{ name: 'amount', type: 'Uint256' }],
    outputs: [],
    state_mutability: 'external',
  },
  {
    name: 'repay',
    type: 'function',
    inputs: [{ name: 'amount', type: 'Uint256' }],
    outputs: [],
    state_mutability: 'external',
  },
]

const erc20Abi = [
  Uint256Def,
  { name: 'decimals', type: 'function', inputs: [], outputs: [{ name: 'decimals', type: 'felt' }], state_mutability: 'view' },
  { name: 'balance_of', type: 'function', inputs: [{ name: 'account', type: 'felt' }], outputs: [{ name: 'balance', type: 'Uint256' }], state_mutability: 'view' },
  { name: 'allowance', type: 'function', inputs: [{ name: 'owner', type: 'felt' }, { name: 'spender', type: 'felt' }], outputs: [{ name: 'remaining', type: 'Uint256' }], state_mutability: 'view' },
  { name: 'approve', type: 'function', inputs: [{ name: 'spender', type: 'felt' }, { name: 'amount', type: 'Uint256' }], outputs: [{ name: 'success', type: 'felt' }], state_mutability: 'external' },
]

const oracleAbi = [
  { name: 'get_price', type: 'function', inputs: [], outputs: [{ name: 'price', type: 'felt' }], state_mutability: 'view' },
  { name: 'get_decimals', type: 'function', inputs: [], outputs: [{ name: 'decimals', type: 'felt' }], state_mutability: 'view' },
]

// ======= React Query Client =======
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, refetchOnWindowFocus: false, retry: 2 },
    mutations: { retry: 1 },
  },
})

// ======= Tipos =======
interface VaultData { collateral: string; debt: string }
interface WalletState { account: any | null; isConnected: boolean }

// ======= Componente raíz con Provider =======
export default function Dashboard() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
            borderRadius: '16px',
            fontSize: '14px',
            fontWeight: '500',
          },
        }}
      />
    </QueryClientProvider>
  )
}

// ======= Contenido principal =======
function DashboardContent() {
  const [wallet, setWallet] = useState<WalletState>({ account: null, isConnected: false })
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [mintAmount, setMintAmount] = useState('')
  const [repayAmount, setRepayAmount] = useState('')
  const [approveAmount, setApproveAmount] = useState('')
  const queryClient = useQueryClient()
  const [shockPct, setShockPct] = useState(0)

  const parseVault = (res: any) => {
    const v = res?.vault ?? res
    if (v?.collateral_amount && v?.debt_amount) {
      return { collateral: u256ToStr(v.collateral_amount), debt: u256ToStr(v.debt_amount) }
    }
    if (Array.isArray(v) && v.length >= 2) {
      return { collateral: u256ToStr(v[0]), debt: u256ToStr(v[1]) }
    }
    console.log('get_vault inesperado:', res)
    return { collateral: '0', debt: '0' }
  }

  // ===== TxLog =====
  type TxKind = 'approve' | 'approve_susd' | 'deposit' | 'withdraw' | 'mint' | 'repay'
  type TxRow = { id: string; kind: TxKind; amount: string; token: 'tBTC' | 'sUSD'; hash: string; time: number }
  const [txLog, setTxLog] = useState<TxRow[]>([])
  useEffect(() => { try { const raw = localStorage.getItem('sbtx:txlog'); if (raw) setTxLog(JSON.parse(raw)) } catch {} }, [])
  useEffect(() => { try { localStorage.setItem('sbtx:txlog', JSON.stringify(txLog.slice(0, 200))) } catch {} }, [txLog])
  const addTx = (row: TxRow) => setTxLog(prev => [row, ...prev].slice(0, 200))
  const formatDate = (t: number) => new Date(t).toLocaleString()
  const kindLabel: Record<TxKind, string> = {
    approve: 'Approve tBTC', approve_susd: 'Approve sUSD', deposit: 'Depositar', withdraw: 'Retirar', mint: 'Mint', repay: 'Repagar',
  }
  const downloadCsv = () => {
    const header = ['time_iso', 'kind', 'amount', 'token', 'hash']
    const lines = txLog.map(r => [
      new Date(r.time).toISOString(), r.kind, r.amount, r.token, r.hash,
    ].map(x => `"${String(x).replace(/"/g, '""')}"`).join(','))
    const csv = header.join(',') + '\n' + lines.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'stablebtc_txlog.csv'; document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  // helpers
  const fromUnits = (human: string, decimals: number) => {
    if (!human) return '0'
    let s = human.replace(',', '.').trim().replace(/^\+/, '')
    if (!/^\d*(\.\d*)?$/.test(s)) return '0'
    const [intPart, rawFrac = ''] = s.split('.')
    const frac = (rawFrac + '0'.repeat(decimals)).slice(0, decimals)
    const base = BigInt(10) ** BigInt(decimals)
    const i = BigInt(intPart || '0')
    const f = BigInt(frac || '0')
    return (i * base + f).toString()
  }

  // MAX helpers
  const setMaxApprove  = () => setApproveAmount(collBalHuman.toString())
  const setMaxDeposit  = () => setDepositAmount(Math.min(collBalHuman, allowanceHuman).toString())
  const setMaxWithdraw = () => setWithdrawAmount(Math.max(0, withdrawMax).toFixed(6))
  const setMaxMint     = () => setMintAmount(Math.max(0, mintMax).toFixed(2))
  const setMaxRepay    = () => setRepayAmount(Math.min(susdBalHuman, debtHuman).toFixed(2))

  // Autoconnect si ya está autorizado
  useEffect(() => {
    (async () => {
      try {
        const anyWin = globalThis as any
        const injected = anyWin?.starknet_braavos ?? anyWin?.starknet_argentX ?? anyWin?.starknet
        if (!injected) return
        if (typeof injected.isPreauthorized === 'function') {
          const ok = await injected.isPreauthorized(); if (!ok) return
        }
        await injected.enable?.(); await injected.requestAccounts?.()
        if (injected?.account) setWallet({ account: injected.account, isConnected: true })
      } catch {}
    })()
  }, [])

  // refetch al tener address
  useEffect(() => {
    if (!wallet.account?.address) return
    const addr = wallet.account.address
    const keys = [
      ['vault', addr], ['stableBalance', addr], ['collateralBalance', addr],
      ['allowance', addr], ['stableAllowance', addr],
    ] as const
    for (const k of keys) {
      queryClient.invalidateQueries({ queryKey: k })
      queryClient.refetchQueries({ queryKey: k })
    }
  }, [wallet.account?.address, queryClient])

  // conectar / desconectar
  const connectWallet = async () => {
    try {
      const connection = await connect({
        modalMode: 'alwaysAsk',
        dappName: 'StableBTC',
        chains: [{ id: 'SN_SEPOLIA', rpcUrl: RPC_URL }],
        argentX: { enabled: true },
        braavos: { enabled: true },
      } as any)
      const w = (connection as any)?.wallet
      if (!w) return toast.error('No se seleccionó ninguna wallet.')
      await w.requestAccounts?.()
      const chainId = w?.provider?.chainId ?? (connection as any)?.chain?.id
      if (chainId && `${chainId}` !== 'SN_SEPOLIA') {
        toast.error(`Red incorrecta: ${chainId}. Cambiá a Sepolia.`); return
      }
      setWallet({ account: w.account, isConnected: true })
      toast.success('Wallet conectada!')
    } catch (err: any) {
      const msg = err?.message || err?.error?.message || String(err ?? 'desconocido')
      toast.error(`Error al conectar wallet: ${msg}`)
    }
  }
  const disconnectWallet = async () => {
    try { await disconnect() } finally {
      setWallet({ account: null, isConnected: false }); toast.success('Wallet desconectada')
    }
  }

  // Lecturas con fallback
  async function callState(c: Contract, entry: string, calldata: any[] = []) {
    try { return await c.call(entry, calldata, { blockIdentifier: 'pending' } as any) }
    catch { return await c.call(entry, calldata, { blockIdentifier: 'latest' } as any) }
  }

  // ======= Queries =======
  const { data: vaultData, isInitialLoading: vaultInit, isFetching: vaultFetching } = useQuery<VaultData>({
    queryKey: ['vault', wallet.account?.address],
    queryFn: async () => {
      if (!wallet.account?.address) return { collateral: '0', debt: '0' }
      try {
        const vault = new Contract(vaultAbi as any, VAULT_ADDRESS, provider)
        const res: any = await vault.call('get_vault', [wallet.account.address], { blockIdentifier: 'latest' } as any)
        return parseVault(res)
      } catch (e) {
        console.error('Error fetching vault data:', e); return { collateral: '0', debt: '0' }
      }
    },
    enabled: !!wallet.account?.address,
    refetchInterval: 8_000,
  })

  const { data: btcPrice = 60000 } = useQuery({
    queryKey: ['btcPrice'],
    queryFn: async () => {
      try {
        const oracle = new Contract(oracleAbi as any, ORACLE_ADDRESS, provider)
        const res: any = await oracle.call('get_price', [], { blockIdentifier: 'latest' } as any)
        const raw = res?.price ?? (Array.isArray(res) ? res[0] : res)
        const num = Number(raw); return Number.isFinite(num) ? num : 60000
      } catch { return 60000 }
    },
    refetchInterval: 30000,
  })

  const { data: collateralDecimals = 18 } = useQuery({
    queryKey: ['collateralDecimals'],
    queryFn: async () => {
      const c = new Contract(erc20Abi as any, COLLATERAL_ADDRESS, provider)
      const d: any = await c.decimals(); return Number(d)
    },
  })

  const { data: stableDecimals = 18 } = useQuery({
    queryKey: ['stableDecimals'],
    queryFn: async () => {
      const s = new Contract(erc20Abi as any, STABLE_ADDRESS, provider)
      const d: any = await s.decimals(); return Number(d)
    },
  })

  const { data: oracleDecimals = 0 } = useQuery({
    queryKey: ['oracleDecimals'],
    queryFn: async () => {
      const o = new Contract(oracleAbi as any, ORACLE_ADDRESS, provider)
      const d: any = await o.get_decimals(); return Number(d)
    },
  })

  const { data: collateralBalance = '0' } = useQuery({
    queryKey: ['collateralBalance', wallet.account?.address],
    queryFn: async () => {
      if (!wallet.account?.address) return '0'
      try {
        const erc20 = new Contract(erc20Abi as any, COLLATERAL_ADDRESS, provider)
        const res: any = await callState(erc20, 'balance_of', [wallet.account.address])
        const raw = res?.balance ?? (Array.isArray(res) ? res[0] : res)
        return u256ToStr(raw)
      } catch { return '0' }
    },
    enabled: !!wallet.account?.address,
    refetchInterval: 8_000,
  })

  const { data: stableBalance = '0', isInitialLoading: stableInit, isFetching: stableFetching } = useQuery({
    queryKey: ['stableBalance', wallet.account?.address],
    queryFn: async () => {
      if (!wallet.account?.address) return '0'
      try {
        const s = new Contract(erc20Abi as any, STABLE_ADDRESS, provider)
        const res: any = await s.call('balance_of', [wallet.account.address], { blockIdentifier: 'latest' } as any)
        const raw = res?.balance ?? (Array.isArray(res) ? res[0] : res)
        return u256ToStr(raw)
      } catch { return '0' }
    },
    enabled: !!wallet.account?.address,
    refetchInterval: 10_000,
  })

  // allowance tBTC
  const { data: allowance = '0' } = useQuery({
    queryKey: ['allowance', wallet.account?.address],
    queryFn: async () => {
      if (!wallet.account?.address) return '0'
      const erc20 = new Contract(erc20Abi as any, COLLATERAL_ADDRESS, provider)
      const res: any = await erc20.call('allowance', [wallet.account.address, VAULT_ADDRESS], { blockIdentifier: 'latest' } as any)
      const raw = res?.remaining ?? (Array.isArray(res) ? res[0] : res)
      return u256ToStr(raw)
    },
    enabled: !!wallet.account?.address,
    refetchInterval: 8_000,
  })

  // allowance sUSD
  const { data: stableAllowance = '0' } = useQuery({
    queryKey: ['stableAllowance', wallet.account?.address],
    queryFn: async () => {
      if (!wallet.account?.address) return '0'
      const s = new Contract(erc20Abi as any, STABLE_ADDRESS, provider)
      const res: any = await s.call('allowance', [wallet.account.address, VAULT_ADDRESS], { blockIdentifier: 'latest' } as any)
      const raw = res?.remaining ?? (Array.isArray(res) ? res[0] : res)
      return u256ToStr(raw)
    },
    enabled: !!wallet.account?.address,
    refetchInterval: 8_000,
  })

  // ensureConnected
  const ensureConnected = async () => {
    if (wallet.account) return wallet.account
    try {
      const anyWin = globalThis as any
      const injected = anyWin?.starknet_braavos ?? anyWin?.starknet_argentX ?? anyWin?.starknet
      if (injected) {
        if (typeof injected.enable === 'function') await injected.enable()
        else if (typeof injected.requestAccounts === 'function') await injected.requestAccounts()
        if (injected?.account) {
          setWallet({ account: injected.account, isConnected: true })
          return injected.account
        }
      }
    } catch {}
    const c: any = await connect({
      modalMode: 'alwaysAsk',
      dappName: 'StableBTC',
      chains: [{ id: 'SN_SEPOLIA', rpcUrl: RPC_URL }],
      argentX: { enabled: true },
      braavos: { enabled: true },
    } as any)
    const acc = c?.wallet?.account
    if (acc) { setWallet({ account: acc, isConnected: true }); return acc }
    throw new Error('No wallet connected')
  }

  // === Voyager helpers + toasts ===
  const VOYAGER_BASE = 'https://sepolia.voyager.online/tx/'
  const voyagerTxUrl = (hash: string) => `${VOYAGER_BASE}${hash}`

  async function sendWithToasts(label: string, sendFn: () => Promise<any>) {
    const signingId = toast.loading(`${label}: firmando…`)
    try {
      const tx: any = await sendFn()
      const hash = tx?.transaction_hash || tx?.hash
      if (!hash) throw new Error('Tx hash no disponible')

      toast.dismiss(signingId)
      toast(() => (
        <span>
          {label} enviada —{' '}
          <a href={voyagerTxUrl(hash)} target="_blank" rel="noreferrer" className="underline">
            ver en Voyager ↗
          </a>
        </span>
      ))

      await provider.waitForTransaction(hash, {
        successStates: ['ACCEPTED_ON_L2', 'ACCEPTED_ON_L1'],
        retryInterval: 2000,
      } as any)

      toast.success(`${label} confirmada ✅`)
      return tx
    } catch (e: any) {
      toast.dismiss(signingId)
      const msg = e?.message || e?.error?.message || String(e ?? 'desconocido')
      toast.error(`${label} falló: ${msg}`)
      throw e
    }
  }

  // ⬇️ Adaptador para el card de swap (fuera de la función de arriba!)
  const sendWithToastsAdapter = (fn: () => Promise<any>, desc?: string) =>
    sendWithToasts(desc || 'Transacción', fn)

  // ======= Mutations =======
  const approveMutation = useMutation({
    mutationFn: async (humanAmount: string) => {
      if (!humanAmount) throw new Error('Ingresá un monto')
      const account = await ensureConnected()
      const erc20 = new Contract(erc20Abi as any, COLLATERAL_ADDRESS, account)
      const amountWei = fromUnits(humanAmount, collateralDecimals)
      const amt = cairo.uint256(amountWei)
      return await sendWithToasts('Approve', async () => erc20.approve(VAULT_ADDRESS, amt))
    },
    onSuccess: async (tx, variables) => {
      const addr = wallet.account?.address
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['allowance', addr] }),
        queryClient.refetchQueries({ queryKey: ['allowance', addr] }),
      ])
      const hash = (tx as any)?.transaction_hash || (tx as any)?.hash || ''
      addTx({ id: `${Date.now()}_${hash}`, kind: 'approve', amount: String(variables ?? ''), token: 'tBTC', hash, time: Date.now() })
      setApproveAmount('')
    },
  })

  const approveStableMutation = useMutation({
    mutationFn: async (humanAmount: string) => {
      if (!humanAmount) throw new Error('Ingresá un monto')
      const account = await ensureConnected()
      const s = new Contract(erc20Abi as any, STABLE_ADDRESS, account)
      const amountWei = fromUnits(humanAmount, stableDecimals)
      const amt = cairo.uint256(amountWei)
      return await sendWithToasts('Approve sUSD', async () => s.approve(VAULT_ADDRESS, amt))
    },
    onSuccess: async (tx, variables) => {
      const addr = wallet.account?.address
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['stableAllowance', addr] }),
        queryClient.refetchQueries({ queryKey: ['stableAllowance', addr] }),
      ])
      const hash = (tx as any)?.transaction_hash || (tx as any)?.hash || ''
      addTx({ id: `${Date.now()}_${hash}`, kind: 'approve_susd', amount: String(variables ?? ''), token: 'sUSD', hash, time: Date.now() })
    },
  })

  const depositMutation = useMutation({
    mutationFn: async (humanAmount: string) => {
      if (!humanAmount) throw new Error('Ingresá un monto')
      const account = await ensureConnected()
      const vault = new Contract(vaultAbi as any, VAULT_ADDRESS, account)
      const amountWei = fromUnits(humanAmount, collateralDecimals)
      const amt = cairo.uint256(amountWei)
      return await sendWithToasts('Depósito', async () => vault.deposit(amt))
    },
    onSuccess: async (tx, variables) => {
      const addr = wallet.account?.address
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['vault', addr] }),
        queryClient.invalidateQueries({ queryKey: ['collateralBalance', addr] }),
      ])
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['vault', addr] }),
        queryClient.refetchQueries({ queryKey: ['collateralBalance', addr] }),
      ])
      const hash = (tx as any)?.transaction_hash || (tx as any)?.hash || ''
      addTx({ id: `${Date.now()}_${hash}`, kind: 'deposit', amount: String(variables ?? ''), token: 'tBTC', hash, time: Date.now() })
      setDepositAmount('')
    },
  })

  const withdrawMutation = useMutation({
    mutationFn: async (humanAmount: string) => {
      if (!humanAmount) throw new Error('Ingresá un monto')
      const account = await ensureConnected()
      const vault = new Contract(vaultAbi as any, VAULT_ADDRESS, account)
      const amountWei = fromUnits(humanAmount, collateralDecimals)
      const amt = cairo.uint256(amountWei)
      return await sendWithToasts('Retiro', async () => vault.withdraw(amt))
    },
    onSuccess: async (tx, variables) => {
      const addr = wallet.account?.address
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['vault', addr] }),
        queryClient.invalidateQueries({ queryKey: ['collateralBalance', addr] }),
      ])
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['vault', addr] }),
        queryClient.refetchQueries({ queryKey: ['collateralBalance', addr] }),
      ])
      const hash = (tx as any)?.transaction_hash || (tx as any)?.hash || ''
      addTx({ id: `${Date.now()}_${hash}`, kind: 'withdraw', amount: String(variables ?? ''), token: 'tBTC', hash, time: Date.now() })
      setWithdrawAmount('')
    },
  })

  const mintMutation = useMutation({
    mutationFn: async (humanAmount: string) => {
      if (!humanAmount) throw new Error('Ingresá un monto')
      const account = await ensureConnected()
      const vault = new Contract(vaultAbi as any, VAULT_ADDRESS, account)
      const amountWei = fromUnits(humanAmount, stableDecimals)
      const amt = cairo.uint256(amountWei)
      return await sendWithToasts('Mint', async () => vault.mint(amt))
    },
    onSuccess: async (tx, variables) => {
      const addr = wallet.account?.address
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['vault', addr] }),
        queryClient.invalidateQueries({ queryKey: ['stableBalance', addr] }),
      ])
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['vault', addr] }),
        queryClient.refetchQueries({ queryKey: ['stableBalance', addr] }),
      ])
      const hash = (tx as any)?.transaction_hash || (tx as any)?.hash || ''
      addTx({ id: `${Date.now()}_${hash}`, kind: 'mint', amount: String(variables ?? ''), token: 'sUSD', hash, time: Date.now() })
      setMintAmount('')
    },
  })

  const repayMutation = useMutation({
    mutationFn: async (humanAmount: string) => {
      if (!humanAmount) throw new Error('Ingresá un monto')
      const account = await ensureConnected()
      const vault = new Contract(vaultAbi as any, VAULT_ADDRESS, account)
      const amountWei = fromUnits(humanAmount, stableDecimals)
      const amt = cairo.uint256(amountWei)
      return await sendWithToasts('Repago', async () => vault.repay(amt))
    },
    onSuccess: async (tx, variables) => {
      const addr = wallet.account?.address
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['vault', addr] }),
        queryClient.invalidateQueries({ queryKey: ['stableBalance', addr] }),
      ])
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['vault', addr] }),
        queryClient.refetchQueries({ queryKey: ['stableBalance', addr] }),
      ])
      const hash = (tx as any)?.transaction_hash || (tx as any)?.hash || ''
      addTx({ id: `${Date.now()}_${hash}`, kind: 'repay', amount: String(variables ?? ''), token: 'sUSD', hash, time: Date.now() })
      setRepayAmount('')
    },
  })

  const closePositionMutation = useMutation({
    mutationFn: async () => {
      const account = await ensureConnected()
      const vault = new Contract(vaultAbi as any, VAULT_ADDRESS, account)
      if (debtHuman > 0) {
        if (susdBalHuman < debtHuman) throw new Error('No tenés sUSD suficiente para repagar todo')
        if (stableAllowanceHuman < debtHuman) throw new Error('Falta aprobar sUSD para repagar todo')
        const repayWei = fromUnits(debtHuman.toString(), stableDecimals)
        const repayAmt = cairo.uint256(repayWei)
        await sendWithToasts('Repago total', async () => vault.repay(repayAmt))
      }
      const vRes: any = await (new Contract(vaultAbi as any, VAULT_ADDRESS, provider))
        .call('get_vault', [wallet.account.address], { blockIdentifier: 'latest' } as any)
      const fresh = parseVault(vRes)
      const freshCollHuman = Number(fresh.collateral) / Math.pow(10, collateralDecimals)
      if (freshCollHuman > 0) {
        const withdrawWei = fromUnits(freshCollHuman.toString(), collateralDecimals)
        const withdrawAmt = cairo.uint256(withdrawWei)
        await sendWithToasts('Retiro total', async () => vault.withdraw(withdrawAmt))
      }
    },
    onSuccess: async () => {
      const addr = wallet.account?.address
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['vault', addr] }),
        queryClient.invalidateQueries({ queryKey: ['collateralBalance', addr] }),
        queryClient.invalidateQueries({ queryKey: ['stableBalance', addr] }),
        queryClient.invalidateQueries({ queryKey: ['stableAllowance', addr] }),
      ])
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['vault', addr] }),
        queryClient.refetchQueries({ queryKey: ['collateralBalance', addr] }),
        queryClient.refetchQueries({ queryKey: ['stableBalance', addr] }),
        queryClient.refetchQueries({ queryKey: ['stableAllowance', addr] }),
      ])
      toast.success('¡Posición cerrada!')
    },
    onError: (e: any) => toast.error(e?.message || 'Error al cerrar posición'),
  })

  // ======= Utils & derivados =======
  const formatAmount = (amount: string, decimals = 18) => {
    const num = Number(amount) / Math.pow(10, decimals)
    return num.toLocaleString('en-US', { maximumFractionDigits: 4 })
  }
  const formatUSD = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  const calculateCollateralUSD = () => {
    if (!vaultData) return 0
    const collateralAmount = Number(vaultData.collateral) / Math.pow(10, collateralDecimals)
    const price = Number(btcPrice) / Math.pow(10, oracleDecimals)
    return collateralAmount * price
  }
  const calculateLTV = () => {
    const collateralUSD = calculateCollateralUSD()
    if (collateralUSD === 0) return 0
    const debtAmount = Number(vaultData?.debt || '0') / Math.pow(10, stableDecimals)
    return (debtAmount / collateralUSD) * 100
  }

  const MCR = 1.5
  const LTV_LIMIT = 100 / MCR
  const price = Number(btcPrice) / Math.pow(10, oracleDecimals)

  const collHuman     = Number(vaultData?.collateral ?? '0') / Math.pow(10, collateralDecimals)
  const debtHuman     = Number(vaultData?.debt ?? '0')       / Math.pow(10, stableDecimals)
  const collBalHuman  = Number(collateralBalance)            / Math.pow(10, collateralDecimals)
  const susdBalHuman  = Number(stableBalance)                / Math.pow(10, stableDecimals)

  const allowanceHuman       = Number(allowance)       / Math.pow(10, collateralDecimals)
  const stableAllowanceHuman = Number(stableAllowance) / Math.pow(10, stableDecimals)

  const withdrawMax = debtHuman > 0
    ? Math.max(0, collHuman - (debtHuman * MCR) / price)
    : collHuman

  const mintMax = Math.max(0, (collHuman * price) / MCR - debtHuman)

  const statsLoading = vaultInit || stableInit || vaultFetching || stableFetching
  const isLoading = approveMutation.isPending || approveStableMutation.isPending || depositMutation.isPending ||
                    withdrawMutation.isPending || mintMutation.isPending || repayMutation.isPending

  const calcLtvPct = (collTbtcHuman: number, debtSusdHuman: number) => {
    const usd = collTbtcHuman * price; if (usd <= 0) return 0; return (debtSusdHuman / usd) * 100
  }
  const ltvNow = calcLtvPct(collHuman, debtHuman)
  const ltvClass = ltvNow >= 80 ? 'bg-red-500' : ltvNow >= 60 ? 'bg-amber-500' : 'bg-emerald-500'

  const simDepositLtv  = Number(depositAmount)  > 0 ? calcLtvPct(collHuman + Number(depositAmount), debtHuman) : null
  const simWithdrawLtv = Number(withdrawAmount) > 0 ? calcLtvPct(Math.max(0, collHuman - Number(withdrawAmount)), debtHuman) : null
  const simMintLtv     = Number(mintAmount)     > 0 ? calcLtvPct(collHuman, debtHuman + Number(mintAmount)) : null
  const simRepayLtv    = Number(repayAmount)    > 0 ? calcLtvPct(collHuman, Math.max(0, debtHuman - Number(repayAmount))) : null

  const withdrawBreaches = simWithdrawLtv !== null && simWithdrawLtv >= LTV_LIMIT
  const mintBreaches     = simMintLtv     !== null && simMintLtv     >= LTV_LIMIT

  const ltvBadge = (v: number) =>
    v >= 80 ? 'text-red-600 bg-red-100' : v >= 60 ? 'text-amber-700 bg-amber-100' : 'text-emerald-700 bg-emerald-100'

  const closeRepayAmount = Math.min(debtHuman, susdBalHuman)
  const canRepayAll = closeRepayAmount >= debtHuman && debtHuman > 0
  const closeDisabledReason =
    (debtHuman <= 0 && collHuman <= 0) ? 'No hay nada para cerrar' :
    (debtHuman > 0 && susdBalHuman < debtHuman) ? 'No tenés sUSD suficiente para repagar todo' :
    (debtHuman > 0 && stableAllowanceHuman < debtHuman) ? 'Falta aprobar sUSD para repagar todo' : ''

  const calcLtvPctAtPrice = (collTbtcHuman: number, debtSusdHuman: number, px: number) => {
    const usd = collTbtcHuman * px; if (usd <= 0) return 0; return (debtSusdHuman / usd) * 100
  }
  const priceShocked = price * (1 + shockPct / 100)
  const ltvShockNow = calcLtvPctAtPrice(collHuman, debtHuman, priceShocked)
  const simDepositLtvShock  = Number(depositAmount)  > 0 ? calcLtvPctAtPrice(collHuman + Number(depositAmount), debtHuman, priceShocked) : null
  const simWithdrawLtvShock = Number(withdrawAmount) > 0 ? calcLtvPctAtPrice(Math.max(0, collHuman - Number(withdrawAmount)), debtHuman, priceShocked) : null
  const simMintLtvShock     = Number(mintAmount)     > 0 ? calcLtvPctAtPrice(collHuman, debtHuman + Number(mintAmount), priceShocked) : null
  const simRepayLtvShock    = Number(repayAmount)    > 0 ? calcLtvPctAtPrice(collHuman, Math.max(0, debtHuman - Number(repayAmount)), priceShocked) : null

  const depositDisabledReason =
    !depositAmount ? 'Ingresá un monto'
      : Number(depositAmount) <= 0 ? 'Monto inválido'
      : Number(depositAmount) > collBalHuman ? 'Saldo tBTC insuficiente'
      : allowanceHuman < Number(depositAmount) ? 'Allowance insuficiente (aprobá primero)'
      : ''

  const withdrawDisabledReason =
    !withdrawAmount ? 'Ingresá un monto'
      : Number(withdrawAmount) <= 0 ? 'Monto inválido'
      : Number(withdrawAmount) > withdrawMax ? `Excede el máximo (${withdrawMax.toFixed(6)} tBTC)`
      : withdrawBreaches ? `Rompe MCR: LTV sim ${simWithdrawLtv!.toFixed(2)}% > ${LTV_LIMIT.toFixed(2)}%`
      : ''

  const mintDisabledReason =
    !mintAmount ? 'Ingresá un monto'
      : Number(mintAmount) <= 0 ? 'Monto inválido'
      : Number(mintAmount) > mintMax ? `Excede el máximo (${mintMax.toFixed(2)} sUSD)`
      : mintBreaches ? `Rompe MCR: LTV sim ${simMintLtv!.toFixed(2)}% > ${LTV_LIMIT.toFixed(2)}%`
      : ''

  const repayDisabledReason =
    !repayAmount ? 'Ingresá un monto'
      : Number(repayAmount) <= 0 ? 'Monto inválido'
      : Number(repayAmount) > susdBalHuman ? 'Saldo sUSD insuficiente'
      : stableAllowanceHuman < Number(repayAmount) ? 'Allowance sUSD insuficiente (aprobá primero)'
      : Number(repayAmount) > debtHuman ? 'No podés repagar más que la deuda'
      : ''

  const clampDecimals = (value: string, maxDecimals: number) => {
    if (value === '' || value === '0' || value === '0.') return value
    let v = value.replace(',', '.')
    v = v.replace(/[^\d.]/g, '')
    const parts = v.split('.')
    if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('')
    const [i, f = ''] = v.split('.')
    const frac = f.slice(0, Math.max(0, maxDecimals))
    return frac.length ? `${i}.${frac}` : i
  }

  const NEAR_MCR_MARGIN_PCT = 2
  const nearWithdraw = simWithdrawLtv !== null && simWithdrawLtv < LTV_LIMIT && simWithdrawLtv >= LTV_LIMIT - NEAR_MCR_MARGIN_PCT
  const nearMint = simMintLtv !== null && simMintLtv < LTV_LIMIT && simMintLtv >= LTV_LIMIT - NEAR_MCR_MARGIN_PCT
  const nearMsg = (v: number) => `Quedás muy cerca del límite de seguridad (LTV sim ${v.toFixed(2)}% de ${LTV_LIMIT.toFixed(2)}%).`

  // ======= UI =======
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">

      {/* Header */}
<header className="border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
  <div className="container mx-auto px-6 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/25">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></div>
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
            StableBTC
          </h1>
          <p className="text-sm text-slate-400 font-medium">Protocolo DeFi - Starknet Sepolia</p>
        </div>
      </div>

      {!wallet.isConnected ? (
        <Button 
          onClick={connectWallet} 
          size="lg"
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300"
        >
          <Wallet className="mr-2 h-5 w-5" />
          Conectar Wallet
        </Button>
      ) : (
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <p className="text-sm font-semibold text-slate-200">Conectado</p>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {wallet.account?.address?.slice(0, 8)}...{wallet.account?.address?.slice(-6)}
            </p>
          </div>
          <Button 
            onClick={disconnectWallet} 
            variant="outline" 
            className="border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white"
          >
            Desconectar
          </Button>
        </div>
      )}
    </div>
  </div>
</header>

      {/* Main */}
<main className="container mx-auto px-4 py-8">
  {!wallet.isConnected ? (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="relative mb-8">
        <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 backdrop-blur-sm flex items-center justify-center border border-orange-500/20">
          <Wallet className="h-16 w-16 text-orange-400" />
        </div>
      </div>
      <h2 className="text-4xl font-bold text-white mb-4 text-center">
        Bienvenido a <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">StableBTC</span>
      </h2>
      <p className="text-slate-400 text-center max-w-2xl mb-12 text-lg leading-relaxed">
        El protocolo de préstamos sobrecolateralizados más avanzado en Starknet. 
        Deposita Bitcoin como colateral y obtén liquidez instantánea con sUSD.
      </p>
      <Button 
        onClick={connectWallet} 
        size="lg" 
        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-12 py-4 rounded-2xl shadow-2xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:scale-105"
      >
        <Wallet className="mr-3 h-6 w-6" />
        Conectar Wallet
      </Button>
    </div>
  ) : (
    <>
      {/* El resto de tu código sigue igual aquí */}
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <Card className="bg-gradient-to-br from-green-500/10 via-green-600/10 to-emerald-500/10 border-green-500/20 backdrop-blur-lg hover:bg-green-500/20 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/20">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-green-400 mb-2">Colateral Depositado</p>
                      <p className="text-3xl font-bold text-white mb-1">
                        {statsLoading ? '—' : formatAmount(vaultData?.collateral || '0', collateralDecimals)}
                        <span className="text-lg text-green-300 ml-1">tBTC</span>
                      </p>
                      <p className="text-sm text-green-300">≈ {formatUSD(calculateCollateralUSD())}</p>
                    </div>
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25">
                      <Shield className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-500/10 via-red-600/10 to-rose-500/10 border-red-500/20 backdrop-blur-lg hover:bg-red-500/20 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-red-500/20">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-red-400 mb-2">Deuda Actual</p>
                      <p className="text-3xl font-bold text-white mb-1">
                        {statsLoading ? '—' : formatAmount(vaultData?.debt || '0', stableDecimals)}
                        <span className="text-lg text-red-300 ml-1">sUSD</span>
                      </p>
                      <p className="text-sm text-red-300">LTV: {statsLoading ? '—' : `${calculateLTV().toFixed(2)}%`}</p>
                    </div>
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/25">
                      <AlertTriangle className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 via-blue-600/10 to-cyan-500/10 border-blue-500/20 backdrop-blur-lg hover:bg-blue-500/20 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-blue-400 mb-2">Balance sUSD</p>
                      <p className="text-3xl font-bold text-white mb-1">
                        {statsLoading ? '—' : formatAmount(stableBalance, stableDecimals)}
                        <span className="text-lg text-blue-300 ml-1">sUSD</span>
                      </p>
                      <p className="text-sm text-blue-300">Tokens disponibles</p>
                    </div>
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                      <DollarSign className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 via-purple-600/10 to-violet-500/10 border-purple-500/20 backdrop-blur-lg hover:bg-purple-500/20 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-purple-400 mb-2">Precio BTC</p>
                      <p className="text-3xl font-bold text-white mb-1">{formatUSD(price)}</p>
                      <p className="text-sm text-purple-300">Oráculo en vivo</p>
                    </div>
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                      <TrendingUp className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

{/* Salud del Vault + herramientas */}
<Card className="mb-8 bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-700/50 backdrop-blur-xl">
  <CardContent className="p-6">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/25 flex items-center justify-center">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-xl">Salud del Vault</h3>
          <p className="text-slate-400 text-sm">Estado actual de tu posición</p>
        </div>
      </div>
      <span className={`px-3 py-1 rounded-xl text-sm font-semibold ${ltvBadge(ltvNow)} border border-current/20`}>LTV actual: {ltvNow.toFixed(2)}%</span>
    </div>

    {/* Historial */}
    <Card className="mb-8 bg-gradient-to-br from-slate-800/80 to-slate-700/80 border-slate-600/50 backdrop-blur-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Historial de operaciones</CardTitle>
            <CardDescription className="text-slate-400">Últimas 10 acciones confirmadas</CardDescription>
          </div>
        </div>
        <Button onClick={downloadCsv} variant="outline" size="sm" className="border-slate-600 hover:bg-slate-700 text-slate-300 hover:text-white">
          Exportar CSV
        </Button>
      </CardHeader>
      <CardContent>
        {txLog.length === 0 ? (
          <p className="text-sm text-slate-400">Aún no hay operaciones. Cuando confirmes transacciones, aparecerán aquí.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-slate-400">
                <tr>
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">Acción</th>
                  <th className="py-2 pr-4">Monto</th>
                  <th className="py-2 pr-4">Tx</th>
                </tr>
              </thead>
              <tbody className="text-slate-300">
                {txLog.slice(0, 10).map(row => (
                  <tr key={row.id} className="border-t border-slate-700">
                    <td className="py-2 pr-4 whitespace-nowrap">{formatDate(row.time)}</td>
                    <td className="py-2 pr-4">{kindLabel[row.kind]}</td>
                    <td className="py-2 pr-4">
                      <span className="font-medium">{row.amount}</span>{' '}
                      <span className="text-slate-500">{row.token}</span>
                    </td>
                    <td className="py-2 pr-4">
                      <a href={`https://sepolia.voyager.online/tx/${row.hash}`} target="_blank" rel="noreferrer" className="text-orange-400 underline hover:text-orange-300">
                        {row.hash.slice(0, 6)}…{row.hash.slice(-6)}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Stress test */}
    <Card className="mb-8 bg-gradient-to-br from-slate-800/80 to-slate-700/80 border-slate-600/50 backdrop-blur-xl">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Stress test: movimiento de BTC</h3>
          <span className="text-sm text-slate-400">Precio simulado: <span className="font-semibold text-white">{formatUSD(priceShocked)}</span></span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500 w-10 text-right">-30%</span>
          <input type="range" min={-30} max={30} step={1} value={shockPct} onChange={(e) => setShockPct(Number(e.target.value))} className="w-full accent-orange-500" />
          <span className="text-xs text-slate-500 w-10">+30%</span>
          <span className="text-sm font-medium text-white w-16 text-right">{shockPct}%</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="border border-slate-600 rounded-lg p-3 bg-slate-700/30">
            <p className="text-slate-400">LTV actual</p>
            <p className={`mt-1 inline-block px-2 py-0.5 rounded ${ltvBadge(ltvNow)}`}>{ltvNow.toFixed(2)}%</p>
          </div>
          <div className="border border-slate-600 rounded-lg p-3 bg-slate-700/30">
            <p className="text-slate-400">LTV con shock</p>
            <p className={`mt-1 inline-block px-2 py-0.5 rounded ${ltvBadge(ltvShockNow)}`}>{ltvShockNow.toFixed(2)}%</p>
          </div>
          <div className="border border-slate-600 rounded-lg p-3 bg-slate-700/30">
            <p className="text-slate-400">Precio simulado</p>
            <p className="font-semibold text-white">{formatUSD(priceShocked)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          {simDepositLtvShock !== null && (
            <div className="rounded-lg border border-slate-600 p-3 bg-slate-700/30">
              <p className="text-slate-400">Tras <span className="font-medium text-white">Depositar</span> (con shock)</p>
              <p className={`mt-1 inline-block px-2 py-0.5 rounded ${ltvBadge(simDepositLtvShock)}`}>LTV: {simDepositLtvShock.toFixed(2)}%</p>
            </div>
          )}
          {simWithdrawLtvShock !== null && (
            <div className="rounded-lg border border-slate-600 p-3 bg-slate-700/30">
              <p className="text-slate-400">Tras <span className="font-medium text-white">Retirar</span> (con shock)</p>
              <p className={`mt-1 inline-block px-2 py-0.5 rounded ${ltvBadge(simWithdrawLtvShock)}`}>LTV: {simWithdrawLtvShock.toFixed(2)}%</p>
            </div>
          )}
          {simMintLtvShock !== null && (
            <div className="rounded-lg border border-slate-600 p-3 bg-slate-700/30">
              <p className="text-slate-400">Tras <span className="font-medium text-white">Mintear</span> (con shock)</p>
              <p className={`mt-1 inline-block px-2 py-0.5 rounded ${ltvBadge(simMintLtvShock)}`}>LTV: {simMintLtvShock.toFixed(2)}%</p>
            </div>
          )}
          {simRepayLtvShock !== null && (
            <div className="rounded-lg border border-slate-600 p-3 bg-slate-700/30">
              <p className="text-slate-400">Tras <span className="font-medium text-white">Repagar</span> (con shock)</p>
              <p className={`mt-1 inline-block px-2 py-0.5 rounded ${ltvBadge(simRepayLtvShock)}`}>LTV: {simRepayLtvShock.toFixed(2)}%</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>

    <div className="w-full h-3 bg-slate-800 rounded overflow-hidden">
      <div className={`h-full ${ltvClass} transition-all`} style={{ width: `${Math.min(100, ltvNow)}%` }} />
    </div>
    <div className="flex justify-between text-xs text-slate-500 mt-1">
      <span>Seguro (&lt;60%)</span><span>Zona media (60–80%)</span><span>Riesgo (&gt;=80%)</span>
    </div>

    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
      {simDepositLtv !== null && (
        <div className="rounded-lg border border-slate-600 p-3 bg-slate-700/30">
          <p className="text-slate-400">Tras <span className="font-medium text-white">Depositar</span></p>
          <p className={`mt-1 inline-block px-2 py-0.5 rounded ${ltvBadge(simDepositLtv)}`}>LTV: {simDepositLtv.toFixed(2)}%</p>
        </div>
      )}
      {simWithdrawLtv !== null && (
        <div className="rounded-lg border border-slate-600 p-3 bg-slate-700/30">
          <p className="text-slate-400">Tras <span className="font-medium text-white">Retirar</span></p>
          <p className={`mt-1 inline-block px-2 py-0.5 rounded ${ltvBadge(simWithdrawLtv)}`}>LTV: {simWithdrawLtv.toFixed(2)}%</p>
        </div>
      )}
      {simMintLtv !== null && (
        <div className="rounded-lg border border-slate-600 p-3 bg-slate-700/30">
          <p className="text-slate-400">Tras <span className="font-medium text-white">Mintear</span></p>
          <p className={`mt-1 inline-block px-2 py-0.5 rounded ${ltvBadge(simMintLtv)}`}>LTV: {simMintLtv.toFixed(2)}%</p>
        </div>
      )}
      {simRepayLtv !== null && (
        <div className="rounded-lg border border-slate-600 p-3 bg-slate-700/30">
          <p className="text-slate-400">Tras <span className="font-medium text-white">Repagar</span></p>
          <p className={`mt-1 inline-block px-2 py-0.5 rounded ${ltvBadge(simRepayLtv)}`}>LTV: {simRepayLtv.toFixed(2)}%</p>
        </div>
      )}
    </div>
  </CardContent>
</Card>
            {/* Acciones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
              {/* Approve */}
              <Card className="bg-white/5 backdrop-blur-lg border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-white text-xl">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    Aprobar Colateral
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Allowance:{' '}
                    <span className="text-yellow-400 font-semibold">
                      {formatAmount(allowance, collateralDecimals)} tBTC
                    </span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="relative">
                    <Input
                      placeholder="Cantidad en tBTC (ej: 1.0)"
                      value={approveAmount}
                      onChange={(e) => setApproveAmount(clampDecimals(e.target.value, collateralDecimals))}
                      disabled={isLoading || statsLoading}
                      className="bg-white border border-slate-300 text-slate-900 placeholder:text-slate-500 rounded-xl h-12 pr-12"
                    />
                    <button type="button" onClick={setMaxApprove} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-600 hover:text-slate-900">
                      MAX
                    </button>
                  </div>

                  <Button
                    onClick={() => approveMutation.mutate(approveAmount)}
                    disabled={!approveAmount || isLoading || statsLoading}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold rounded-xl h-12 shadow-lg shadow-yellow-500/25"
                  >
                    {approveMutation.isPending ? 'Aprobando...' : 'Aprobar'}
                  </Button>

                  <p className="text-xs text-slate-400">
                    Balance:{' '}
                    <span className="text-yellow-400">
                      {formatAmount(collateralBalance, collateralDecimals)} tBTC
                    </span>
                  </p>
                </CardContent>
              </Card>
              
{/* Convertir a USDT */}
<Card className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-indigo-500/20 backdrop-blur-xl hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 group">
  <CardHeader>
    <CardTitle className="flex items-center gap-3 text-white">
      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-all duration-300">
        <ArrowUpCircle className="h-6 w-6 text-white" />
      </div>
      <div>
        <div className="text-xl font-bold">Convertir a USDT</div>
        <div className="text-sm text-indigo-300/80 font-normal">Intercambio de tokens</div>
      </div>
    </CardTitle>
  </CardHeader>
  <CardContent>
    <SwapToUSDTCard
      account={wallet.account}
      address={wallet.account?.address}
      sendWithToasts={sendWithToastsAdapter}
    />
  </CardContent>
</Card>

{/* Cerrar posición */}
<Card className="bg-gradient-to-br from-slate-900/40 to-slate-800/40 border-slate-500/20 backdrop-blur-xl hover:shadow-2xl hover:shadow-slate-500/10 transition-all duration-500 group">
  <CardHeader>
    <CardTitle className="flex items-center gap-3 text-white text-xl">
      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-500/25 group-hover:shadow-slate-500/40 transition-all duration-300">
        <Shield className="h-6 w-6 text-white" />
      </div>
      <div>
        <div className="text-xl font-bold">Cerrar posición</div>
        <div className="text-sm text-slate-300/80 font-normal">Repaga deuda y retira colateral</div>
      </div>
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="text-sm text-slate-300 grid grid-cols-1 md:grid-cols-2 gap-2">
      <div className="border border-slate-600 rounded-lg p-3 bg-slate-700/30">
        <p className="text-slate-400">Deuda a repagar</p>
        <p className="font-semibold text-white">{debtHuman.toFixed(2)} sUSD</p>
      </div>
      <div className="border border-slate-600 rounded-lg p-3 bg-slate-700/30">
        <p className="text-slate-400">sUSD disponible</p>
        <p className="font-semibold text-white">{susdBalHuman.toFixed(2)} sUSD</p>
      </div>
    </div>

    {debtHuman > 0 && stableAllowanceHuman < debtHuman && (
      <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-800/30 rounded-lg p-3">
        <span>
          Allowance sUSD insuficiente: <span className="font-semibold text-white">{formatAmount(stableAllowance, stableDecimals)} / {debtHuman.toFixed(2)} sUSD</span>
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => approveStableMutation.mutate(debtHuman.toString())} 
          disabled={isLoading || statsLoading} 
          className="h-7 px-3 border-slate-600 hover:bg-slate-700 text-slate-300 hover:text-white"
        >
          Aprobar sUSD
        </Button>
      </div>
    )}

    <Button
      onClick={() => closePositionMutation.mutate()}
      disabled={!!closeDisabledReason || isLoading || statsLoading}
      className="w-full bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black text-white font-semibold rounded-xl h-14 text-lg shadow-lg shadow-slate-500/25"
    >
      {closePositionMutation.isPending ? 'Cerrando...' : (
        <>
          <Shield className="mr-2 h-5 w-5" />
          Cerrar posición
        </>
      )}
    </Button>

    {closeDisabledReason && <p className="text-xs text-slate-400">{closeDisabledReason}</p>}
  </CardContent>
</Card>

              {/* Deposit */}
              <Card className="bg-white/5 backdrop-blur-lg border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-white text-xl">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                      <ArrowDownCircle className="h-5 w-5 text-white" />
                    </div>
                    Depositar
                  </CardTitle>
                  <CardDescription className="text-slate-400">Deposita tBTC como colateral</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="relative">
                    <Input
                      placeholder="Cantidad"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(clampDecimals(e.target.value, collateralDecimals))}
                      disabled={isLoading || statsLoading}
                      className="bg-white border border-slate-300 text-slate-900 placeholder:text-slate-500 rounded-xl h-12 pr-12"
                    />
                    <button type="button" onClick={setMaxDeposit} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-600 hover:text-slate-900">MAX</button>
                  </div>

                  <Button
                    onClick={() => depositMutation.mutate(depositAmount)}
                    disabled={!!depositDisabledReason || isLoading || statsLoading}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-xl h-12 shadow-lg shadow-green-500/25"
                  >
                    {depositMutation.isPending ? 'Depositando...' : 'Depositar'}
                  </Button>

                  {depositDisabledReason && <p className="text-xs text-slate-400 mt-1">{depositDisabledReason}</p>}
                </CardContent>
              </Card>

              {/* Withdraw */}
              <Card className="bg-white/5 backdrop-blur-lg border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-white text-xl">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center">
                      <ArrowUpCircle className="h-5 w-5 text-white" />
                    </div>
                    Retirar
                  </CardTitle>
                  <CardDescription className="text-slate-400">Retira tu colateral disponible</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Input
                      placeholder="Cantidad"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(clampDecimals(e.target.value, collateralDecimals))}
                      disabled={isLoading || statsLoading}
                      className="bg-white border border-slate-300 text-slate-900 placeholder:text-slate-500 rounded-xl h-12 pr-12"
                    />
                    <button type="button" onClick={setMaxWithdraw} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-600 hover:text-slate-900">MAX</button>
                  </div>

                  {simWithdrawLtv !== null && (
                    <div className="text-xs text-slate-400">
                      LTV simulado:{' '}
                      <span className={`px-2 py-0.5 rounded ${ltvBadge(simWithdrawLtv)}`}>{simWithdrawLtv.toFixed(2)}%</span>
                      {withdrawBreaches && <span className="ml-2 text-red-600 font-semibold">Rompe MCR (límite {LTV_LIMIT.toFixed(2)}%)</span>}
                    </div>
                  )}

                  {!withdrawBreaches && nearWithdraw && (
                    <div className="text-xs px-3 py-2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      {nearMsg(simWithdrawLtv!)} Considerá retirar un poco menos.
                    </div>
                  )}

                  <Button
                    onClick={() => withdrawMutation.mutate(withdrawAmount)}
                    disabled={!!withdrawDisabledReason || isLoading || statsLoading}
                    className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-semibold rounded-xl h-12 shadow-lg shadow-red-500/25"
                  >
                    {withdrawMutation.isPending ? 'Retirando...' : 'Retirar'}
                  </Button>

                  {withdrawDisabledReason && <p className="text-xs text-slate-400">{withdrawDisabledReason}</p>}
                  <p className="text-xs text-slate-400">Máx retiro: <span className="font-semibold">{withdrawMax.toFixed(6)} tBTC</span></p>
                </CardContent>
              </Card>

              {/* Mint */}
              <Card className="bg-white/5 backdrop-blur-lg border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-white text-xl">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    Mint sUSD
                  </CardTitle>
                  <CardDescription className="text-slate-400">Genera sUSD contra tu colateral</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Input
                      placeholder="Cantidad"
                      value={mintAmount}
                      onChange={(e) => setMintAmount(clampDecimals(e.target.value, stableDecimals))}
                      disabled={isLoading || statsLoading}
                      className="bg-white border border-slate-300 text-slate-900 placeholder:text-slate-500 rounded-xl h-12 pr-12"
                    />
                    <button type="button" onClick={setMaxMint} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-600 hover:text-slate-900">MAX</button>
                  </div>

                  {simMintLtv !== null && (
                    <div className="text-xs text-slate-400">
                      LTV simulado:{' '}
                      <span className={`px-2 py-0.5 rounded ${ltvBadge(simMintLtv)}`}>{simMintLtv.toFixed(2)}%</span>
                      {mintBreaches && <span className="ml-2 text-red-600 font-semibold">Rompe MCR (límite {LTV_LIMIT.toFixed(2)}%)</span>}
                    </div>
                  )}

                  {!mintBreaches && nearMint && (
                    <div className="text-xs px-3 py-2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      {nearMsg(simMintLtv!)} Considerá mintear un poco menos.
                    </div>
                  )}

                  <Button
                    onClick={() => mintMutation.mutate(mintAmount)}
                    disabled={!!mintDisabledReason || isLoading || statsLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl h-12 shadow-lg shadow-blue-500/25"
                  >
                    {mintMutation.isPending ? 'Minteando...' : 'Mint'}
                  </Button>

                  {mintDisabledReason && <p className="text-xs text-slate-400">{mintDisabledReason}</p>}
                  <p className="text-xs text-slate-400">Máx mint: <span className="font-semibold">{mintMax.toFixed(2)} sUSD</span></p>
                </CardContent>
              </Card>

              {/* Repay */}
              <Card className="bg-white/5 backdrop-blur-lg border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-white text-xl">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    Repagar Deuda
                  </CardTitle>
                  <CardDescription className="text-slate-400">Repaga tu deuda en sUSD</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Input
                      placeholder="Cantidad"
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(clampDecimals(e.target.value, stableDecimals))}
                      disabled={isLoading || statsLoading}
                      className="bg-white border border-slate-300 text-slate-900 placeholder:text-slate-500 rounded-xl h-12 pr-12"
                    />
                    <button type="button" onClick={setMaxRepay} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-600 hover:text-slate-900">MAX</button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Allowance sUSD: <span className="font-semibold">{formatAmount(stableAllowance, stableDecimals)} sUSD</span></span>
                    {repayAmount && (Number(stableAllowance) / Math.pow(10, stableDecimals)) < Number(repayAmount) && (
                      <Button variant="outline" size="sm" onClick={() => approveStableMutation.mutate(repayAmount)} disabled={isLoading || statsLoading} className="h-7 px-3">
                        Aprobar sUSD
                      </Button>
                    )}
                  </div>

                  <Button
                    onClick={() => repayMutation.mutate(repayAmount)}
                    disabled={!!repayDisabledReason || isLoading || statsLoading}
                    className="w-full bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-semibold rounded-xl h-12 shadow-lg shadow-purple-500/25"
                  >
                    {repayMutation.isPending ? 'Repagando...' : 'Repagar'}
                  </Button>

                  {repayDisabledReason && <p className="text-xs text-slate-400 mt-1">{repayDisabledReason}</p>}
                </CardContent>
              </Card>
            </div>

            {/* Health Alert */}
            {calculateLTV() > 80 && (
              <Alert className="mt-8 border-red-500/30 bg-red-500/10 backdrop-blur-lg rounded-2xl">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <AlertDescription className="text-red-300 font-medium">
                  ⚠️ Tu LTV está alto ({calculateLTV().toFixed(2)}%). Considera depositar más colateral o repagar deuda.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </main>
    </div>
  )
}