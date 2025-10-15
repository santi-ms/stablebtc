export const qk = {
  quote: (amount: string, slippageBps: number) => ['quote', amount, slippageBps] as const,
};
