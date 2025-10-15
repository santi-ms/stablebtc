export type U256 = { low: string; high: string };

export function toUint256(amountWei: bigint): U256 {
  const mask = (1n << 128n) - 1n;
  const low = amountWei & mask;
  const high = amountWei >> 128n;
  return { low: '0x' + low.toString(16), high: '0x' + high.toString(16) };
}

export function fromUint256(u: { low: string; high: string }): bigint {
  const low = BigInt(u.low);
  const high = BigInt(u.high);
  return (high << 128n) + low;
}

export function parseUnits(decimalStr: string, decimals: number): bigint {
  const [int, frac = ''] = decimalStr.split('.');
  const fracPadded = (frac + '0'.repeat(decimals)).slice(0, decimals);
  const s = int + fracPadded;
  if (!/^\d+$/.test(s)) throw new Error('Monto inválido');
  return BigInt(s);
}

export function formatUnits(wei: bigint, decimals: number): string {
  const s = wei.toString().padStart(decimals + 1, '0');
  const i = s.slice(0, -decimals);
  const f = s.slice(-decimals).replace(/0+$/, '');
  return f ? `${i}.${f}` : i;
}
