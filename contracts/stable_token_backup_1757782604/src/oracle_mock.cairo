use starknet::ContractAddress;
use starknet::get_caller_address;

#[starknet::contract]
mod OracleMock {
    #[storage]
    struct Storage {
        price_e8: u128,        // precio BTC/USD con 8 decimales
        admin: ContractAddress // quien puede setear precio
    }

    #[constructor]
    fn constructor(ref self: ContractState, admin: ContractAddress, initial_price_e8: u128) {
        self.admin.write(admin);
        self.price_e8.write(initial_price_e8);
    }

    #[external(v0)]
    fn set_price(ref self: ContractState, new_price_e8: u128) {
        let caller = starknet::get_caller_address();
        assert(caller == self.admin.read(), 'ONLY_ADMIN');
        self.price_e8.write(new_price_e8);
    }

    #[external(v0)]
    fn get_price(self: @ContractState) -> u128 {
        self.price_e8.read()
    }
}
