// contracts/vault_manager/src/math.cairo
use core::integer::{u128, u256};
use core::traits::TryInto;

fn to_u256(x: u128) -> u256 {
    u256 { low: x, high: 0 }
}

/// floor((a*b)/denom) evitando overflow intermedio.
/// Requiere denom > 0.
pub fn mul_div_u128(a: u128, b: u128, denom: u128) -> u128 {
    assert(denom != 0_u128, 'mul_div denom is zero');
    let ab: u256 = to_u256(a) * to_u256(b);
    let q: u256 = ab / to_u256(denom);
    q.try_into().expect('mul_div result > u128')
}
