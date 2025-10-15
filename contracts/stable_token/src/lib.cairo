// contracts/stable_token/src/lib.cairo
// Edición V2023_10-friendly: sin `use super::*` globales.

#[starknet::contract]
pub mod StableToken {
    // Imports locales (evita `use super::*`)
    use starknet::ContractAddress;
    use starknet::get_caller_address;
    use starknet::storage::Map;
    use core::integer::u256;

    // ---------------- Events ----------------
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Transfer: Transfer,
        Approval: Approval,
    }

    #[derive(Drop, starknet::Event)]
    struct Transfer {
        from: ContractAddress,
        to: ContractAddress,
        value: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct Approval {
        owner: ContractAddress,
        spender: ContractAddress,
        value: u256,
    }

    // --------------- Storage ----------------
    #[storage]
    struct Storage {
        name: felt252,
        symbol: felt252,
        decimals: u8,
        total_supply: u256,
        // balances[addr] = amount
        balances: Map<ContractAddress, u256>,
        // allowances[(owner,spender)] = amount
        allowances: Map<(ContractAddress, ContractAddress), u256>,
        // minter (VaultManager)
        minter: ContractAddress,
        // NUEVO: owner que puede rotar minter
        owner: ContractAddress,
    }

    // ------------- Constructor --------------
    // Constructor extendido: (name, symbol, decimals, owner, initial_minter)
    #[constructor]
    fn constructor(
        ref self: ContractState,
        name: felt252,
        symbol: felt252,
        decimals: u8,
        owner: ContractAddress,
        initial_minter: ContractAddress
    ) {
        self.name.write(name);
        self.symbol.write(symbol);
        self.decimals.write(decimals);
        self.owner.write(owner);
        self.minter.write(initial_minter);
        self.total_supply.write(u256{ low: 0, high: 0 });
    }

    // --------------- Modificadores ----------
    fn only_owner(ref self: ContractState) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'ONLY_OWNER');
    }
    fn only_minter(ref self: ContractState) {
        let caller = get_caller_address();
        assert(caller == self.minter.read(), 'ONLY_MINTER');
    }

    // --------------- Views ------------------
    #[external(v0)]
    fn name(self: @ContractState) -> felt252 { self.name.read() }

    #[external(v0)]
    fn symbol(self: @ContractState) -> felt252 { self.symbol.read() }

    #[external(v0)]
    fn decimals(self: @ContractState) -> u8 { self.decimals.read() }

    #[external(v0)]
    fn total_supply(self: @ContractState) -> u256 { self.total_supply.read() }

    #[external(v0)]
    fn balance_of(self: @ContractState, account: ContractAddress) -> u256 {
        self.balances.read(account)
    }

    #[external(v0)]
    fn allowance(self: @ContractState, owner: ContractAddress, spender: ContractAddress) -> u256 {
        self.allowances.read((owner, spender))
    }

    // Getters útiles
    #[external(v0)]
    fn minter(self: @ContractState) -> ContractAddress { self.minter.read() }

    #[external(v0)]
    fn owner(self: @ContractState) -> ContractAddress { self.owner.read() }

    // ------------- Mutables ERC20 -----------
    #[external(v0)]
    fn transfer(ref self: ContractState, to: ContractAddress, value: u256) -> bool {
        let from = get_caller_address();
        _transfer(ref self, from, to, value);
        true
    }

    #[external(v0)]
    fn approve(ref self: ContractState, spender: ContractAddress, value: u256) -> bool {
        let owner = get_caller_address();
        self.allowances.write((owner, spender), value);
        self.emit(Approval { owner, spender, value });
        true
    }

    #[external(v0)]
    fn transfer_from(ref self: ContractState, from: ContractAddress, to: ContractAddress, value: u256) -> bool {
        let caller = get_caller_address();
        let current = self.allowances.read((from, caller));
        assert(current >= value, 'INSUFFICIENT_ALLOWANCE');
        self.allowances.write((from, caller), current - value);
        _transfer(ref self, from, to, value);
        true
    }

    // ------------- Admin (owner) ------------
    // AHORA: set_minter controlado por OWNER (no por minter)
    #[external(v0)]
    fn set_minter(ref self: ContractState, new_minter: ContractAddress) {
        only_owner(ref self);
        self.minter.write(new_minter);
    }

    #[external(v0)]
    fn set_owner(ref self: ContractState, new_owner: ContractAddress) {
        only_owner(ref self);
        self.owner.write(new_owner);
    }

    // ------------- Mint/Burn (minter) -------
    #[external(v0)]
    fn mint(ref self: ContractState, to: ContractAddress, value: u256) {
        only_minter(ref self);
        _mint(ref self, to, value);
        // (Opcional) emitir Transfer desde 0x0 si querés compatibilidad ERC más estricta
    }

    #[external(v0)]
    fn burn(ref self: ContractState, from: ContractAddress, value: u256) {
        only_minter(ref self);
        _burn(ref self, from, value);
    }

    // ------------- Internals ----------------
    fn _transfer(ref self: ContractState, from: ContractAddress, to: ContractAddress, value: u256) {
        let from_bal = self.balances.read(from);
        assert(from_bal >= value, 'INSUFFICIENT_BALANCE');
        self.balances.write(from, from_bal - value);

        let to_bal = self.balances.read(to);
        self.balances.write(to, to_bal + value);

        self.emit(Transfer { from, to, value });
    }

    fn _mint(ref self: ContractState, to: ContractAddress, value: u256) {
        let to_bal = self.balances.read(to);
        self.balances.write(to, to_bal + value);

        let ts = self.total_supply.read();
        self.total_supply.write(ts + value);
    }

    fn _burn(ref self: ContractState, from: ContractAddress, value: u256) {
        let from_bal = self.balances.read(from);
        assert(from_bal >= value, 'INSUFFICIENT_BALANCE');
        self.balances.write(from, from_bal - value);

        let ts = self.total_supply.read();
        self.total_supply.write(ts - value);
    }
}
