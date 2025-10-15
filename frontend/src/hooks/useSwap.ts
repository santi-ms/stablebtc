import { useMutation, useQuery } from '@tanstack/react-query';
import { qk } from '@/queries/keys';
import { getQuote, swapViaRouter } from '@/services/swapService';

export function useQuote(params: { amountIn: string; sellDecimals: number; buyDecimals: number; slippageBps: number }) {
  const { amountIn, sellDecimals, buyDecimals, slippageBps } = params;
  const enabled = !!amountIn && Number(amountIn) > 0 && Number.isFinite(Number(amountIn));
  return useQuery({
    enabled,
    queryKey: qk.quote(amountIn || '0', slippageBps),
    queryFn: () => getQuote({ amountIn: amountIn || '0', sellDecimals, buyDecimals, slippageBps }),
    staleTime: 5_000,
  });
}

export function useSwap(sendWithToasts: (fn: () => Promise<any>, desc?: string) => Promise<any>) {
  return useMutation({
    mutationFn: async (vars: {
      account: any;
      recipient: string;
      amountInHuman: string;
      minOutHuman: string;
      sellDecimals: number;
      buyDecimals: number;
    }) => {
      return await sendWithToasts(
        () =>
          swapViaRouter({
            account: vars.account,
            recipient: vars.recipient,
            amountInHuman: vars.amountInHuman,
            minOutHuman: vars.minOutHuman,
            sellDecimals: vars.sellDecimals,
            buyDecimals: vars.buyDecimals,
          }),
        'Ejecutando swap…'
      );
    },
  });
}
