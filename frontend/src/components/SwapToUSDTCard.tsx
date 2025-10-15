'use client';

import React, { useMemo, useState } from 'react';
import { ArrowRightLeft, Zap, TrendingDown, Settings } from 'lucide-react';

// UI desde app/ con RUTAS RELATIVAS (evitamos alias @ por ahora)
// ✅ con alias @ (funciona porque tu tsconfig ya tiene "app/*" en paths)
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// hooks del swap/erc20 (en src)
import { useQuote, useSwap } from '../hooks/useSwap';
import { useAllowance, useApprove, useBalance, useDecimals } from '../hooks/useErc20';

type Props = {
  account: any | null;
  address?: string | null;
  sendWithToasts: (fn: () => Promise<any>, desc?: string) => Promise<any>;
};

// helpers locales
function u256ToBigInt(u: { low: string; high: string }) {
  const p = (s: string) => (s?.startsWith('0x') ? BigInt(s) : BigInt(s || '0'));
  return (p(u.high) << 128n) + p(u.low);
}
function formatBigint(x: bigint, decimals: number) {
  if (decimals === 0) return x.toString();
  const s = x.toString().padStart(decimals + 1, '0');
  const intP = s.slice(0, s.length - decimals) || '0';
  const fracP = s.slice(-decimals).replace(/0+$/, '');
  return fracP ? `${intP}.${fracP}` : intP;
}
function clampDecimals(v: string, max: number) {
  if (v === '' || v === '0' || v === '0.') return v;
  let s = v.replace(',', '.').replace(/[^\d.]/g, '');
  const parts = s.split('.');
  if (parts.length > 2) s = parts[0] + '.' + parts.slice(1).join('');
  const [i, f = ''] = s.split('.');
  const frac = f.slice(0, Math.max(0, max));
  return frac.length ? `${i}.${frac}` : i;
}

export default function SwapToUSDTCard({ account, address, sendWithToasts }: Props) {
  const STABLE = process.env.NEXT_PUBLIC_STABLE!;
  const USDT   = process.env.NEXT_PUBLIC_USDT!;
  const ROUTER = process.env.NEXT_PUBLIC_DEX_ROUTER!;

  const { data: sDec } = useDecimals(STABLE);
  const { data: uDec } = useDecimals(USDT);

  const { data: sBal } = useBalance(STABLE, address || undefined);
  const { data: uBal, refetch: refetchUBal } = useBalance(USDT, address || undefined);
  const allowance = useAllowance(STABLE, address || undefined, ROUTER);

  const [amount, setAmount] = useState('');
  const [slippageBps, setSlippageBps] = useState(50); // 0.5%

  const sBalHuman = useMemo(() => (!sBal || sDec == null ? '0' : formatBigint(u256ToBigInt(sBal), sDec)), [sBal, sDec]);
  const uBalHuman = useMemo(() => (!uBal || uDec == null ? '—' : formatBigint(u256ToBigInt(uBal), uDec)), [uBal, uDec]);

  const { data: quote } = useQuote({ amountIn: amount || '0', sellDecimals: sDec ?? 18, buyDecimals: uDec ?? 6, slippageBps });

  const approveMutation = useApprove(STABLE, ROUTER, sendWithToasts);
  const swapMutation = useSwap(sendWithToasts);

  const needApprove = useMemo(() => {
    if (!allowance.data || sDec == null) return true;
    const allow = formatBigint(u256ToBigInt(allowance.data), sDec);
    return Number(amount || '0') > Number(allow || '0');
  }, [allowance.data, amount, sDec]);

  function onMax() { setAmount(sBalHuman); }

  async function onApprove() {
    if (!account || sDec == null) return;
    const [i, f = ''] = (amount || '0').split('.');
    const frac = (f + '0'.repeat(sDec)).slice(0, sDec);
    const big = BigInt((i || '0') + frac);
    const u256 = { low: '0x' + (big & ((1n << 128n) - 1n)).toString(16), high: '0x' + (big >> 128n).toString(16) };
    await approveMutation.mutateAsync({ account, amount: u256 });
  }

  async function onSwap() {
    if (!account || sDec == null || uDec == null || !quote || !address) return;
    await swapMutation.mutateAsync({
      account, recipient: address,
      amountInHuman: quote.amountInHuman, minOutHuman: quote.minOutHuman,
      sellDecimals: sDec, buyDecimals: uDec,
    });
    setTimeout(() => refetchUBal(), 1500);
  }

  const connected = !!address && !!account;
  const amountOk = Number(amount || '0') > 0;
  const busy = approveMutation.isPending || swapMutation.isPending;
  const disabled = !connected || !amountOk || busy;

  return (
    <div className="space-y-6">
      {/* Router Info */}
      <div className="bg-slate-800/30 border border-slate-600/50 rounded-xl p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
            <Settings className="h-4 w-4 text-slate-300" />
          </div>
          <span className="text-sm font-medium text-slate-300">Router DEX</span>
        </div>
        <p className="text-xs text-slate-400 font-mono break-all">
          {ROUTER}
        </p>
      </div>

      {/* Swap Interface */}
      <div className="space-y-4">
        {/* Amount Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-white">Cantidad a convertir</label>
            <div className="text-xs text-slate-400">
              Balance: <span className="text-indigo-400 font-semibold">{sBalHuman} sUSD</span>
            </div>
          </div>
          
          <div className="relative">
            <Input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(clampDecimals(e.target.value, sDec ?? 18))}
              placeholder="0.00"
              disabled={busy}
              className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-500 rounded-xl h-14 pr-20 text-lg font-medium focus:border-indigo-500/50 focus:ring-indigo-500/20"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-sm text-slate-400 font-medium">sUSD</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onMax}
                disabled={busy}
                className="h-8 px-3 text-xs font-semibold border-slate-600 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                MAX
              </Button>
            </div>
          </div>
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center">
          <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center">
            <ArrowRightLeft className="h-5 w-5 text-slate-400" />
          </div>
        </div>

        {/* Slippage Settings */}
        <div className="bg-slate-800/30 border border-slate-600/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white">Tolerancia al slippage</span>
            <span className="text-xs text-slate-400">{(slippageBps / 100).toFixed(2)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <Input 
              type="number" 
              min={0} 
              max={1000}
              value={slippageBps}
              onChange={(e) => setSlippageBps(Math.max(0, Number(e.target.value || 0)))}
              className="w-24 bg-slate-700/50 border-slate-600/50 text-white text-center h-10"
            />
            <span className="text-xs text-slate-400">basis points (1 bp = 0.01%)</span>
          </div>
        </div>

        {/* Quote Information */}
        {quote && amountOk && (
          <div className="bg-slate-800/30 border border-slate-600/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-white">Estimación del swap</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-700/30 rounded-lg p-3">
                <p className="text-slate-400 mb-1">Recibirás</p>
                <p className="text-emerald-400 font-bold text-lg">
                  {quote.amountOutHuman} <span className="text-sm font-normal">USDT</span>
                </p>
              </div>
              
              <div className="bg-slate-700/30 rounded-lg p-3">
                <p className="text-slate-400 mb-1">Mínimo garantizado</p>
                <p className="text-amber-400 font-bold text-lg">
                  {quote.minOutHuman} <span className="text-sm font-normal">USDT</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Balance Display */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-slate-800/30 border border-slate-600/50 rounded-lg p-3">
            <p className="text-slate-400 mb-1">sUSD disponible</p>
            <p className="text-indigo-400 font-semibold">{sBalHuman}</p>
          </div>
          <div className="bg-slate-800/30 border border-slate-600/50 rounded-lg p-3">
            <p className="text-slate-400 mb-1">USDT actual</p>
            <p className="text-purple-400 font-semibold">{uBalHuman}</p>
          </div>
        </div>

        {/* Connection Warning */}
        {!connected && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Zap className="h-4 w-4 text-amber-400" />
              </div>
              <p className="text-amber-300 text-sm font-medium">
                Conectá tu wallet para continuar con el swap
              </p>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          {needApprove ? (
            <Button 
              onClick={onApprove} 
              disabled={disabled} 
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold rounded-xl h-14 text-lg shadow-lg shadow-yellow-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {approveMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Aprobando sUSD...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Aprobar sUSD
                </div>
              )}
            </Button>
          ) : (
            <Button 
              onClick={onSwap} 
              disabled={disabled} 
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl h-14 text-lg shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {swapMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Realizando swap...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  Convertir a USDT
                </div>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}