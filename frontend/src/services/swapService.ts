import { Contract } from 'starknet';
import { mockRouterAbi } from '@/abi/mockRouterAbi';

const DEX_KIND = (process.env.NEXT_PUBLIC_DEX_KIND || 'mock') as 'mock' | 'jedi' | 'ekubo';
const ROUTER = process.env.NEXT_PUBLIC_DEX_ROUTER!;
const STABLE = process.env.NEXT_PUBLIC_STABLE!; // sUSD
const USDT   = process.env.NEXT_PUBLIC_USDT!;   // USDT2

function toUint256FromDecimal(amountHuman: string, decimals: number) {
  const safe = (amountHuman || '0').trim();
  if (!/^\d+(\.\d+)?$/.test(safe)) throw new Error('Monto inválido');
  const [i, f = ''] = safe.split('.');
  const frac = (f + '0'.repeat(decimals)).slice(0, decimals);
  const big = BigInt((i || '0') + frac);
  const low = '0x' + (big & ((1n << 128n) - 1n)).toString(16);
  const high = '0x' + (big >> 128n).toString(16);
  return { low, high };
}
function applySlippage(amountHuman: string, slippageBps: number) {
  if (!amountHuman) return '0';
  const [i, f = ''] = amountHuman.split('.');
  const frac = f.length;
  const base = BigInt((i || '0') + f);
  const min = (base * BigInt(10000 - slippageBps)) / 10000n;
  const s = min.toString().padStart(frac + 1, '0');
  const intP = s.slice(0, s.length - frac) || '0';
  const fracP = frac ? s.slice(-frac).replace(/0+$/, '') : '';
  return fracP ? `${intP}.${fracP}` : intP;
}

export type QuoteParams = { amountIn: string; sellDecimals: number; buyDecimals: number; slippageBps: number; };
export type Quote = { amountInHuman: string; amountOutHuman: string; minOutHuman: string; slippageBps: number; };

export async function getQuote({ amountIn, slippageBps }: QuoteParams): Promise<Quote> {
  const minOut = applySlippage(amountIn || '0', slippageBps);
  return { amountInHuman: amountIn || '0', amountOutHuman: amountIn || '0', minOutHuman: minOut, slippageBps };
}

export async function swapViaRouter({
  account,
  recipient,
  amountInHuman,
  minOutHuman,
  sellDecimals,
  buyDecimals,
}: {
  account: any;
  recipient: string;
  amountInHuman: string;
  minOutHuman: string;
  sellDecimals: number;
  buyDecimals: number;
}) {
  if (DEX_KIND !== 'mock') throw new Error('DEX_KIND distinto de "mock". Integraremos Jedi/Ekubo luego.');
  if (!ROUTER || ROUTER === '0x0') throw new Error('Falta NEXT_PUBLIC_DEX_ROUTER');
  if (!STABLE || !USDT) throw new Error('Faltan NEXT_PUBLIC_STABLE o NEXT_PUBLIC_USDT');

  const amount_in = toUint256FromDecimal(amountInHuman, sellDecimals);
  const min_out  = toUint256FromDecimal(minOutHuman,  buyDecimals);

  const router = new Contract(mockRouterAbi as any, ROUTER, account);
  return await router.invoke('swap_exact_in', {
    sell_token: STABLE,
    buy_token:  USDT,
    recipient,
    amount_in,
    min_amount_out: min_out,
  });
}
