// src/lib.cairo

use core::integer::u256;
use starknet::ContractAddress;
use starknet::get_caller_address;
use starknet::get_contract_address; // <-- para obtener la address del propio contrato
use starknet::storage::Map;

mod math; // <--- agregado (math.cairo en el mismo src)

#[starknet::contract]
mod vault_manager {
    use super::*;
    use core::integer::u256;
    use starknet::ContractAddress;
    use starknet::get_caller_address;
    use starknet::get_contract_address;
    use starknet::storage::Map;
    use crate::math::mul_div_u128;  // <--- agregado

    // ============ Interfaces ============

    // Stable token (sUSD) igual que antes
    #[starknet::interface]
    trait IStableToken<T> {
        fn mint(ref self: T, to: ContractAddress, amount: u256);
        fn burn(ref self: T, from: ContractAddress, amount: u256);
    }

    // Oráculo igual que antes
    #[starknet::interface]
    trait IPriceOracle<T> {
        /// Precio BTC/USD con `decimals` decimales (p.ej. 63456.12 -> 6_345_612_000 si decimals=5)
        fn get_price(self: @T) -> u128;
        fn get_decimals(self: @T) -> u8;
    }

    // NUEVO: interfaz mínima ERC-20 para el colateral (tBTC)
    #[starknet::interface]
    trait IERC20<T> {
        fn transfer_from(ref self: T, sender: ContractAddress, recipient: ContractAddress, amount: u256) -> bool;
        fn transfer(ref self: T, recipient: ContractAddress, amount: u256) -> bool;
        fn balance_of(self: @T, account: ContractAddress) -> u256;
        // approve/allowance no las necesitamos desde el vault
    }

    // ============ Storage ============

    #[storage]
    struct Storage {
        // contratos externos
        token_addr: ContractAddress,          // sUSD
        collateral_token: ContractAddress,    // NUEVO: tBTC (u otro ERC-20)
        oracle_addr: ContractAddress,

        // maps de vault
        collateral: Map<ContractAddress, u256>, // colateral en unidades del token (decimales configurables)
        debt: Map<ContractAddress, u256>,       // deuda en stable (18 dec)

        // parámetros
        max_ltv_bps: u16,         // 6600 => 66.00%
        liq_ratio_bps: u16,       // 15000 => 150.00%
        liq_penalty_bps: u16,     // 1000 => 10.00%
        stability_fee_bps: u16,   // 500 => 5.00% APR (MVP: aún no aplicado)
        collateral_decimals: u8,  // p.ej. 18 si tBTC, 8 si sats-like

        // caps/flags
        global_debt_cap: u256,
        total_debt: u256,
        mint_paused: bool,
        liquidation_paused: bool,

        // control
        owner: ContractAddress,

        // ==== NUEVO: integración para VaultNFT ====
        vault_nft: ContractAddress,  // address del contrato VaultNFT
        vault_nft_set: bool,         // flag para permitir setearlo solo una vez
    }

    // ============ Constructor ============

    #[constructor]
    fn constructor(
        ref self: ContractState,
        token_addr: ContractAddress,              // sUSD
        collateral_token_addr: ContractAddress,   // NUEVO: tBTC
        oracle_addr: ContractAddress,
        collateral_decimals: u8,
        max_ltv_bps: u16,       // p.ej. 6600
        liq_ratio_bps: u16,     // p.ej. 15000
        liq_penalty_bps: u16,   // p.ej. 1000
        stability_fee_bps: u16, // p.ej. 500
        global_debt_cap: u256,  // p.ej. 100_000e18
        owner: ContractAddress,
    ) {
        self.token_addr.write(token_addr);
        self.collateral_token.write(collateral_token_addr); // <-- nuevo
        self.oracle_addr.write(oracle_addr);
        self.collateral_decimals.write(collateral_decimals);

        self.max_ltv_bps.write(max_ltv_bps);
        self.liq_ratio_bps.write(liq_ratio_bps);
        self.liq_penalty_bps.write(liq_penalty_bps);
        self.stability_fee_bps.write(stability_fee_bps);

        self.global_debt_cap.write(global_debt_cap);
        self.total_debt.write(u256 { low: 0, high: 0 });
        self.mint_paused.write(false);
        self.liquidation_paused.write(false);

        self.owner.write(owner);
        // vault_nft_set queda en false por defecto
    }

    // =========================
    // Dispatchers a externos
    // =========================
    fn token(self: @ContractState) -> IStableTokenDispatcher {
        let addr = self.token_addr.read();
        IStableTokenDispatcher { contract_address: addr }
    }
    fn oracle(self: @ContractState) -> IPriceOracleDispatcher {
        let addr = self.oracle_addr.read();
        IPriceOracleDispatcher { contract_address: addr }
    }
    fn collateral_erc20(self: @ContractState) -> IERC20Dispatcher {
        let addr = self.collateral_token.read();
        IERC20Dispatcher { contract_address: addr }
    }

    // ============ Helpers ============

    fn only_owner(ref self: ContractState) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'only owner');
    }

    fn u256_zero() -> u256 { u256 { low: 0, high: 0 } }
    fn u256_add(a: u256, b: u256) -> u256 { a + b }
    fn u256_sub(a: u256, b: u256) -> u256 { a - b }

    fn to_u128(x: u256) -> u128 {
        assert(x.high == 0, 'u256->u128 overflow');
        x.low
    }
    fn from_u128(x: u128) -> u256 { u256 { low: x, high: 0 } }

    fn exp10_u128(n: u8) -> u128 {
        let mut i: u8 = 0;
        let mut acc: u128 = 1;
        loop {
            if i >= n { break; }
            acc = acc * 10_u128;
            i = i + 1_u8;
        };
        acc
    }

    /// Precio normalizado a 1e18 (u128) evitando overflow: p * 10^(18-d)
    fn price_1e18(self: @ContractState) -> u128 {
        let o = oracle(self);
        let p: u128 = o.get_price();
        let d: u8 = o.get_decimals();
        assert(d <= 18_u8, 'dec>18');
        let scale: u128 = exp10_u128(18_u8 - d);
        // en vez de p * scale directo (u128*u128) -> usa mul_div
        mul_div_u128(p, scale, 1_u128)
    }

    /// usd_val en 1e18 (u128): (collateral * price_1e18) / 10^coll_decimals, sin overflow
    fn usd_value_1e18(self: @ContractState, coll: u256) -> u128 {
        let col_u128 = to_u128(coll);
        let p18 = price_1e18(self);
        let dec = self.collateral_decimals.read();
        let denom = exp10_u128(dec);
        mul_div_u128(col_u128, p18, denom)
    }

    /// true si saludable con respecto a `ratio_bps` (por ej. liq_ratio=15000 bps)
    fn is_healthy_at(self: @ContractState, coll: u256, debt: u256, ratio_bps: u16) -> bool {
        let debt_u128 = to_u128(debt);                  // deuda ya en 18 dec
        let usd = usd_value_1e18(self, coll);          // valor en 1e18
        // Comparamos: debt <= floor((usd * ratio_bps)/10000)
        let max_allowed = mul_div_u128(usd, (ratio_bps.into()), 10000_u128);
        debt_u128 <= max_allowed
    }

    fn max_borrowable_1e18(self: @ContractState, coll: u256) -> u128 {
        let usd = usd_value_1e18(self, coll);
        let m: u16 = self.max_ltv_bps.read(); // bps
        mul_div_u128(usd, (m.into()), 10000_u128)
    }

    /// Colateral incautado por `repay` (1e18) con penalidad liq_penalty_bps, sin overflow
    fn seized_collateral(self: @ContractState, repay_1e18: u128) -> u128 {
        let pen_bps: u16 = self.liq_penalty_bps.read();
        let price = price_1e18(self); // USD/BTC en 1e18
        let dec = self.collateral_decimals.read();
        let ten_pow_dec = exp10_u128(dec);

        // num = repay * (10000 + pen) * 10^dec, encadenando mul_div
        let with_pen = mul_div_u128(repay_1e18, (10000_u128 + (pen_bps.into())), 1_u128);
        let num = mul_div_u128(with_pen, ten_pow_dec, 1_u128);
        // den = price * 10000, también encadenado
        let den = mul_div_u128(price, 10000_u128, 1_u128);

        // seized = floor(num / den)
        mul_div_u128(num, 1_u128, den)
    }

    // ======================
    // API del Vault (v0)
    // ======================

    /// DEPÓSITO CON ERC-20: requiere approve previo del usuario al VAULT.
    #[external(v0)]
    fn deposit(ref self: ContractState, amount: u256) {
        let caller = get_caller_address();

        // 1) Cobrar el colateral real (tBTC) del usuario hacia este contrato
        let this = get_contract_address();
        let mut c = collateral_erc20(@self);
        let _ok = c.transfer_from(caller, this, amount);
        // (opcional) assert(_ok, 'transfer_from failed');

        // 2) Registrar contablemente
        let prev: u256 = self.collateral.read(caller);
        self.collateral.write(caller, u256_add(prev, amount));
    }

    /// RETIRO: valida LTV y transfiere el colateral (tBTC) al usuario.
    #[external(v0)]
    fn withdraw(ref self: ContractState, amount: u256) {
        let caller = get_caller_address();

        let prev: u256 = self.collateral.read(caller);
        let next = u256_sub(prev, amount);

        // chequeo de salud post-withdraw: LTV <= max_ltv
        let debt: u256 = self.debt.read(caller);
        let max_borrow: u128 = max_borrowable_1e18(@self, next);
        let debt_u128 = to_u128(debt);
        assert(debt_u128 <= max_borrow, 'LTV too high');

        // efectos contables primero
        self.collateral.write(caller, next);

        // transferir el colateral al usuario
        let mut c = collateral_erc20(@self);
        let _ok = c.transfer(caller, amount);
        // (opcional) assert(_ok, 'transfer failed');
    }

    #[external(v0)]
    fn mint(ref self: ContractState, amount: u256) {
        assert(!self.mint_paused.read(), 'mint paused');

        let caller = get_caller_address();

        // cap global
        let td = u256_add(self.total_debt.read(), amount);
        assert(td <= self.global_debt_cap.read(), 'cap exceeded');

        // LTV check: debt_new <= max_borrowable(collateral)
        let prev_debt: u256 = self.debt.read(caller);
        let new_debt = u256_add(prev_debt, amount);

        let coll: u256 = self.collateral.read(caller);
        let max_borrow = max_borrowable_1e18(@self, coll);
        let new_debt_u128 = to_u128(new_debt);
        assert(new_debt_u128 <= max_borrow, 'LTV too high');

        // efectos
        self.debt.write(caller, new_debt);
        self.total_debt.write(td);

        let mut t = token(@self);
        t.mint(caller, amount);
    }

    #[external(v0)]
    fn repay(ref self: ContractState, amount: u256) {
        let caller = get_caller_address();

        let prev_debt: u256 = self.debt.read(caller);
        assert(amount <= prev_debt, 'repay > debt');

        let new_debt = u256_sub(prev_debt, amount);
        self.debt.write(caller, new_debt);

        let td_prev = self.total_debt.read();
        self.total_debt.write(u256_sub(td_prev, amount));

        let mut t = token(@self);
        t.burn(caller, amount);
    }

    #[external(v0)]
    fn liquidate(ref self: ContractState, user: ContractAddress, repay_amount: u256) {
        assert(!self.liquidation_paused.read(), 'liquidation paused');

        let coll: u256 = self.collateral.read(user);
        let debt: u256 = self.debt.read(user);

        // vault debe estar por debajo del ratio de liquidación
        let healthy = is_healthy_at(@self, coll, debt, self.liq_ratio_bps.read());
        assert(!healthy, 'vault not liquidatable');

        // limitar repay a deuda
        assert(repay_amount <= debt, 'repay > user debt');

        // burn del liquidador
        let caller = get_caller_address();
        let mut t = token(@self);
        t.burn(caller, repay_amount);

        // actualizar deuda
        let new_debt = u256_sub(debt, repay_amount);
        self.debt.write(user, new_debt);
        let td_prev = self.total_debt.read();
        self.total_debt.write(u256_sub(td_prev, repay_amount));

        // colateral incautado
        let repay_u128 = to_u128(repay_amount);
        let seized_u128 = seized_collateral(@self, repay_u128);
        let seized_u256 = from_u128(seized_u128);

        // quitar colateral del usuario (MVP: no se asigna a ningún lado)
        let new_coll = u256_sub(coll, seized_u256);
        self.collateral.write(user, new_coll);
    }

    // ======================
    // Admin (v0)
    // ======================
    #[external(v0)]
    fn set_oracle(ref self: ContractState, oracle_addr: ContractAddress) {
        only_owner(ref self);
        self.oracle_addr.write(oracle_addr);
    }
    #[external(v0)]
    fn set_params(
        ref self: ContractState,
        collateral_decimals: u8,
        max_ltv_bps: u16,
        liq_ratio_bps: u16,
        liq_penalty_bps: u16,
        stability_fee_bps: u16,
    ) {
        only_owner(ref self);
        self.collateral_decimals.write(collateral_decimals);
        self.max_ltv_bps.write(max_ltv_bps);
        self.liq_ratio_bps.write(liq_ratio_bps);
        self.liq_penalty_bps.write(liq_penalty_bps);
        self.stability_fee_bps.write(stability_fee_bps);
    }
    #[external(v0)]
    fn set_cap(ref self: ContractState, cap: u256) {
        only_owner(ref self);
        self.global_debt_cap.write(cap);
    }
    #[external(v0)]
    fn pause_mint(ref self: ContractState, paused: bool) {
        only_owner(ref self);
        self.mint_paused.write(paused);
    }
    #[external(v0)]
    fn pause_liquidation(ref self: ContractState, paused: bool) {
        only_owner(ref self);
        self.liquidation_paused.write(paused);
    }

    /// ==== NUEVO: setear y leer el contrato VaultNFT ====
    #[external(v0)]
    fn set_vault_nft(ref self: ContractState, addr: ContractAddress) {
        only_owner(ref self);
        let already = self.vault_nft_set.read();
        assert(!already, 'ALREADY_SET');

        self.vault_nft.write(addr);
        self.vault_nft_set.write(true);
    }

    #[external(v0)]
    fn get_vault_nft(self: @ContractState) -> ContractAddress {
        self.vault_nft.read()
    }

    // ======================
    // Getters (v0 views)
    // ======================
    #[external(v0)]
    fn get_vault(self: @ContractState, user: ContractAddress) -> (u256, u256) {
        (self.collateral.read(user), self.debt.read(user))
    }

    #[external(v0)]
    fn get_params(self: @ContractState) -> (u8, u16, u16, u16, u16) {
        (
            self.collateral_decimals.read(),
            self.max_ltv_bps.read(),
            self.liq_ratio_bps.read(),
            self.liq_penalty_bps.read(),
            self.stability_fee_bps.read(),
        )
    }

    // Mantuve get_addrs (backward-compat) y agrego un getter nuevo para collateral_token
    #[external(v0)]
    fn get_addrs(self: @ContractState) -> (ContractAddress, ContractAddress, ContractAddress) {
        (self.token_addr.read(), self.oracle_addr.read(), self.owner.read())
    }

    #[external(v0)]
    fn get_collateral_token(self: @ContractState) -> ContractAddress {
        self.collateral_token.read()
    }

    #[external(v0)]
    fn get_caps_flags(self: @ContractState) -> (u256, u256, bool, bool) {
        (self.global_debt_cap.read(), self.total_debt.read(), self.mint_paused.read(), self.liquidation_paused.read())
    }

    #[external(v0)]
    fn preview_liquidation(self: @ContractState, repay_amount: u256) -> u256 {
        let seized = seized_collateral(self, to_u128(repay_amount));
        from_u128(seized)
    }
}


// ==============================
// Oráculo Mock para test/dev
// ==============================
#[starknet::contract]
mod oracle_mock {
    use super::*;
    use starknet::ContractAddress;
    use starknet::get_caller_address;

    #[storage]
    struct Storage {
        owner: ContractAddress,
        price: u128,    // p.ej. 65_000_000_000 si decimals=6
        decimals: u8,   // p.ej. 6
    }

    #[constructor]
    fn constructor(ref self: ContractState, price: u128, decimals: u8, owner: ContractAddress) {
        self.price.write(price);
        self.decimals.write(decimals);
        self.owner.write(owner);
    }

    fn only_owner(ref self: ContractState) {
        let caller = get_caller_address();
        assert(caller == self.owner.read(), 'only owner');
    }

    // Interfaz compatible con vault_manager::IPriceOracle
    #[external(v0)]
    fn get_price(self: @ContractState) -> u128 {
        self.price.read()
    }

    #[external(v0)]
    fn get_decimals(self: @ContractState) -> u8 {
        self.decimals.read()
    }

    // Admin
    #[external(v0)]
    fn set_price(ref self: ContractState, new_price: u128) {
        only_owner(ref self);
        self.price.write(new_price);
    }

    #[external(v0)]
    fn set_decimals(ref self: ContractState, new_decimals: u8) {
        only_owner(ref self);
        self.decimals.write(new_decimals);
    }
}
