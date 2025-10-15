'use client';
import { useMemo } from 'react';
import { Contract, Account, RpcProvider } from 'starknet';
import vaultAbi from '@/lib/abi/vault.json';
import erc20Abi from '@/lib/abi/erc20.json';
import oracleAbi from '@/lib/abi/oracle.json';

export function useContracts(p: RpcProvider | Account, addrs: {
  vault: string; stable: string; collateral: string; oracle: string;
}) {
  const vault = useMemo(() => new Contract(vaultAbi as any, addrs.vault, p), [p, addrs.vault]);
  const stable = useMemo(() => new Contract(erc20Abi as any, addrs.stable, p), [p, addrs.stable]);
  const collateral = useMemo(() => new Contract(erc20Abi as any, addrs.collateral, p), [p, addrs.collateral]);
  const oracle = useMemo(() => new Contract(oracleAbi as any, addrs.oracle, p), [p, addrs.oracle]);
  return { vault, stable, collateral, oracle };
}
