%lang starknet

use core::integer::u256;
use starknet::ContractAddress;
use starknet::get_caller_address;
use starknet::storage::Map;

#[starknet::contract]
mod vault_nft {
    use super::*;
    use core::integer::u256;
    use starknet::ContractAddress;
    use starknet::get_caller_address;
    use starknet::storage::Map;

    #[storage]
    struct Storage {
        name: felt252,
        symbol: felt252,
        total_supply: u256,

        // ERC-721 básico
        owners: Map<u256, ContractAddress>,                         // tokenId -> owner
        balances: Map<ContractAddress, u256>,                       // owner -> balance
        token_approvals: Map<u256, ContractAddress>,               // tokenId -> approved
        operator_approvals: Map<(ContractAddress, ContractAddress), bool>, // (owner, operator) -> bool

        // para chequear existencia sin depender de "zero address"
        minted: Map<u256, bool>,    // tokenId -> true si existe

        // sólo este address puede mintear (tu VaultManager)
        manager: ContractAddress,
    }

    #[event]
    fn Transfer(from: ContractAddress, to: ContractAddress, token_id: u256) {}

    #[event]
    fn Approval(owner: ContractAddress, approved: ContractAddress, token_id: u256) {}

    #[event]
    fn ApprovalForAll(owner: ContractAddress, operator: ContractAddress, approved: bool) {}

    // -------- helpers u256 ----------
    fn u256_add(a: u256, b: u256) -> u256 { a + b }
    fn u256_sub(a: u256, b: u256) -> u256 { a - b }

    // -------- constructor ------------
    #[constructor]
    fn constructor(ref self: ContractState, name: felt252, symbol: felt252, manager: ContractAddress) {
        self.name.write(name);
        self.symbol.write(symbol);
        self.total_supply.write(u256 { low: 0, high: 0 });
        self.manager.write(manager);
    }

    // -------- views básicos ----------
    #[external]
    fn name(self: @ContractState) -> felt252 { self.name.read() }

    #[external]
    fn symbol(self: @ContractState) -> felt252 { self.symbol.read() }

    #[external]
    fn totalSupply(self: @ContractState) -> u256 { self.total_supply.read() }

    #[external]
    fn balanceOf(self: @ContractState, owner: ContractAddress) -> u256 {
        // (si querés, assert(owner != 0) acá)
        self.balances.read(owner)
    }

    #[external]
    fn ownerOf(self: @ContractState, token_id: u256) -> ContractAddress {
        assert(self.minted.read(token_id), 'NOT_MINTED');
        self.owners.read(token_id)
    }

    // -------- approvals --------------
    #[external]
    fn approve(ref self: ContractState, to: ContractAddress, token_id: u256) {
        assert(self.minted.read(token_id), 'NOT_MINTED');
        let owner = self.owners.read(token_id);
        let caller = get_caller_address();
        let is_op = self.operator_approvals.read((owner, caller));
        assert(caller == owner || is_op, 'NOT_OWNER_NOR_OPERATOR');

        self.token_approvals.write(token_id, to);
        Approval(owner, to, token_id);
    }

    #[external]
    fn getApproved(self: @ContractState, token_id: u256) -> ContractAddress {
        assert(self.minted.read(token_id), 'NOT_MINTED');
        self.token_approvals.read(token_id)
    }

    #[external]
    fn setApprovalForAll(ref self: ContractState, operator: ContractAddress, approved: bool) {
        let owner = get_caller_address();
        assert(operator != owner, 'SELF_APPROVE');
        self.operator_approvals.write((owner, operator), approved);
        ApprovalForAll(owner, operator, approved);
    }

    #[external]
    fn isApprovedForAll(self: @ContractState, owner: ContractAddress, operator: ContractAddress) -> bool {
        self.operator_approvals.read((owner, operator))
    }

    // -------- transfer ----------------
    fn _is_approved_or_owner(self: @ContractState, spender: ContractAddress, token_id: u256) -> bool {
        let owner = self.owners.read(token_id);
        spender == owner
            || self.token_approvals.read(token_id) == spender
            || self.operator_approvals.read((owner, spender))
    }

    fn _transfer(ref self: ContractState, from: ContractAddress, to: ContractAddress, token_id: u256) {
        assert(self.minted.read(token_id), 'NOT_MINTED');
        assert(self.owners.read(token_id) == from, 'WRONG_FROM');
        // (opcional) assert(to != 0, 'ZERO_TO');

        // limpiar aprobación
        self.token_approvals.write(token_id, ContractAddress::from(0));

        // balances
        let from_bal = self.balances.read(from);
        let to_bal = self.balances.read(to);
        self.balances.write(from, u256_sub(from_bal, u256 { low: 1, high: 0 }));
        self.balances.write(to, u256_add(to_bal, u256 { low: 1, high: 0 }));

        // dueñx
        self.owners.write(token_id, to);
        Transfer(from, to, token_id);
    }

    #[external]
    fn transferFrom(ref self: ContractState, from: ContractAddress, to: ContractAddress, token_id: u256) {
        assert(self._is_approved_or_owner(get_caller_address(), token_id), 'NOT_APPROVED');
        self._transfer(from, to, token_id);
    }

    // -------- mint --------------------
    /// Sólo el manager (VaultManager) puede mintear. token_id debe ser único.
    #[external]
    fn mint(ref self: ContractState, to: ContractAddress, token_id: u256) {
        assert(get_caller_address() == self.manager.read(), 'ONLY_MANAGER');
        assert(!self.minted.read(token_id), 'ALREADY_MINTED');
        // (opcional) assert(to != 0, 'ZERO_TO');

        self.minted.write(token_id, true);
        self.owners.write(token_id, to);

        let bal = self.balances.read(to);
        self.balances.write(to, u256_add(bal, u256 { low: 1, high: 0 }));

        let ts = self.total_supply.read();
        self.total_supply.write(u256_add(ts, u256 { low: 1, high: 0 }));

        Transfer(ContractAddress::from(0), to, token_id);
    }
}
