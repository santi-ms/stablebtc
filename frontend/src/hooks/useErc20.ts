import { useMutation, useQuery } from '@tanstack/react-query';
import { Contract, RpcProvider } from 'starknet';

const RPC = process.env.NEXT_PUBLIC_RPC!;
const provider = new RpcProvider({ nodeUrl: RPC });

const Uint256Def = {
  name: 'Uint256',
  type: 'struct',
  members: [
    { name: 'low', type: 'felt' },
    { name: 'high', type: 'felt' },
  ],
};
const erc20Abi = [
  Uint256Def,
  { name: 'decimals', type: 'function', inputs: [], outputs: [{ name: 'decimals', type: 'felt' }], state_mutability: 'view' },
  { name: 'balance_of', type: 'function', inputs: [{ name: 'account', type: 'felt' }], outputs: [{ name: 'balance', type: 'Uint256' }], state_mutability: 'view' },
  { name: 'allowance', type: 'function', inputs: [{ name: 'owner', type: 'felt' }, { name: 'spender', type: 'felt' }], outputs: [{ name: 'remaining', type: 'Uint256' }], state_mutability: 'view' },
  { name: 'approve', type: 'function', inputs: [{ name: 'spender', type: 'felt' }, { name: 'amount', type: 'Uint256' }], outputs: [{ name: 'success', type: 'felt' }], state_mutability: 'external' },
];

export function useDecimals(token: string) {
  return useQuery({
    queryKey: ['decimals', token],
    queryFn: async () => {
      const c = new Contract(erc20Abi as any, token, provider);
      const d: any = await c.decimals();
      return Number(d);
    },
    enabled: !!token,
    staleTime: 60_000,
  });
}

export function useBalance(token: string, owner?: string) {
  return useQuery({
    queryKey: ['erc20Balance', token, owner],
    queryFn: async () => {
      if (!owner) return { low: '0x0', high: '0x0' };
      const c = new Contract(erc20Abi as any, token, provider);
      const res: any = await c.balance_of(owner);
      return res?.balance ?? res;
    },
    enabled: !!token && !!owner,
    refetchInterval: 10_000,
  });
}

export function useAllowance(token: string, owner?: string, spender?: string) {
  return useQuery({
    queryKey: ['erc20Allowance', token, owner, spender],
    queryFn: async () => {
      if (!owner || !spender) return { low: '0x0', high: '0x0' };
      const c = new Contract(erc20Abi as any, token, provider);
      const res: any = await c.allowance(owner, spender);
      return res?.remaining ?? res;
    },
    enabled: !!token && !!owner && !!spender,
    refetchInterval: 10_000,
  });
}

export function useApprove(token: string, spender: string, sendWithToasts: (fn: () => Promise<any>, desc?: string) => Promise<any>) {
  return useMutation({
    mutationFn: async (vars: { account: any; amount: { low: string; high: string } }) => {
      if (!vars?.account) throw new Error('Wallet no conectada');
      const c = new Contract(erc20Abi as any, token, vars.account);
      return await sendWithToasts(() => c.approve(spender, vars.amount), 'Aprobar token');
    },
  });
}
