// ABI mínimo para el Router Mock 1:1 (compatible ABI v0)
export const mockRouterAbi = [
  {
    type: "function",
    name: "swap_exact_in",
    inputs: [
      { name: "sell_token", type: "felt" },
      { name: "buy_token",  type: "felt" },
      { name: "recipient",  type: "felt" },
      { name: "amount_in",  type: "(felt, felt)" },        // uint256
      { name: "min_amount_out", type: "(felt, felt)" }     // uint256
    ],
    outputs: []
  }
] as const;
