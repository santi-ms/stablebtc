#[starknet::interface]
trait IERC20<TContractState> {
    fn transfer_from(self: @TContractState, sender: starknet::ContractAddress, recipient: starknet::ContractAddress, amount: core::integer::u256);
    fn transfer(self: @TContractState, recipient: starknet::ContractAddress, amount: core::integer::u256);
}

#[starknet::contract]
mod MockRouter {
    use super::{IERC20Dispatcher, IERC20DispatcherTrait};
    use core::integer::u256;
    use starknet::{ContractAddress, get_caller_address, get_contract_address};

    #[storage]
    struct Storage {}

    /// Swap 1:1 demo: cobra sUSD del caller y paga USDT al recipient.
    #[external(v0)]
    fn swap_exact_in(
        ref self: ContractState,
        sell_token: ContractAddress,
        buy_token: ContractAddress,
        recipient: ContractAddress,
        amount_in: u256,
        _min_amount_out: u256
    ) {
        let caller = get_caller_address();
        let me = get_contract_address();

        // Cobro sUSD del caller -> router (requiere approve)
        let sell = IERC20Dispatcher { contract_address: sell_token };
        sell.transfer_from(caller, me, amount_in);

        // Pago USDT desde el router -> recipient (1:1)
        let buy = IERC20Dispatcher { contract_address: buy_token };
        buy.transfer(recipient, amount_in);
    }
}
