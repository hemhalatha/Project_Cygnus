#![no_std]

//! Escrow Smart Contract
//! 
//! Provides safe trading with escrow protection for autonomous agent transactions.

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowStatus {
    Funded,
    Delivered,
    Completed,
    Disputed,
    Refunded,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowState {
    pub buyer: Address,
    pub seller: Address,
    pub amount: i128,
    pub asset: Address,
    pub delivery_deadline: u64,
    pub status: EscrowStatus,
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Escrow(u64),
    EscrowCount,
}

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    pub fn create_escrow(
        env: Env,
        buyer: Address,
        seller: Address,
        amount: i128,
        asset: Address,
        delivery_deadline: u64,
    ) -> u64 {
        buyer.require_auth();

        let escrow_id = Self::get_next_escrow_id(&env);
        let current_time = env.ledger().timestamp();

        let escrow = EscrowState {
            buyer: buyer.clone(),
            seller: seller.clone(),
            amount,
            asset: asset.clone(),
            delivery_deadline,
            status: EscrowStatus::Funded,
            created_at: current_time,
        };

        // Lock funds
        let token_client = token::Client::new(&env, &asset);
        token_client.transfer(&buyer, &env.current_contract_address(), &amount);

        env.storage().instance().set(&DataKey::Escrow(escrow_id), &escrow);

        escrow_id
    }

    pub fn confirm_delivery(env: Env, escrow_id: u64, buyer: Address) -> EscrowStatus {
        buyer.require_auth();

        let mut escrow: EscrowState = env
            .storage()
            .instance()
            .get(&DataKey::Escrow(escrow_id))
            .expect("Escrow not found");

        if escrow.buyer != buyer {
            panic!("Only buyer can confirm delivery");
        }

        if escrow.status != EscrowStatus::Funded {
            panic!("Escrow is not in funded state");
        }

        escrow.status = EscrowStatus::Delivered;
        env.storage().instance().set(&DataKey::Escrow(escrow_id), &escrow);

        escrow.status
    }

    pub fn release_payment(env: Env, escrow_id: u64) -> EscrowStatus {
        let mut escrow: EscrowState = env
            .storage()
            .instance()
            .get(&DataKey::Escrow(escrow_id))
            .expect("Escrow not found");

        if escrow.status != EscrowStatus::Delivered {
            panic!("Delivery not confirmed");
        }

        // Transfer funds to seller
        let token_client = token::Client::new(&env, &escrow.asset);
        token_client.transfer(
            &env.current_contract_address(),
            &escrow.seller,
            &escrow.amount,
        );

        escrow.status = EscrowStatus::Completed;
        env.storage().instance().set(&DataKey::Escrow(escrow_id), &escrow);

        escrow.status
    }

    pub fn dispute(env: Env, escrow_id: u64, party: Address) -> EscrowStatus {
        party.require_auth();

        let mut escrow: EscrowState = env
            .storage()
            .instance()
            .get(&DataKey::Escrow(escrow_id))
            .expect("Escrow not found");

        if party != escrow.buyer && party != escrow.seller {
            panic!("Only buyer or seller can dispute");
        }

        if escrow.status != EscrowStatus::Funded && escrow.status != EscrowStatus::Delivered {
            panic!("Cannot dispute in current state");
        }

        escrow.status = EscrowStatus::Disputed;
        env.storage().instance().set(&DataKey::Escrow(escrow_id), &escrow);

        escrow.status
    }

    pub fn refund(env: Env, escrow_id: u64) -> EscrowStatus {
        let mut escrow: EscrowState = env
            .storage()
            .instance()
            .get(&DataKey::Escrow(escrow_id))
            .expect("Escrow not found");

        let current_time = env.ledger().timestamp();

        // Can refund if disputed or deadline passed without delivery
        let can_refund = escrow.status == EscrowStatus::Disputed
            || (escrow.status == EscrowStatus::Funded && current_time > escrow.delivery_deadline);

        if !can_refund {
            panic!("Cannot refund in current state");
        }

        // Refund to buyer
        let token_client = token::Client::new(&env, &escrow.asset);
        token_client.transfer(
            &env.current_contract_address(),
            &escrow.buyer,
            &escrow.amount,
        );

        escrow.status = EscrowStatus::Refunded;
        env.storage().instance().set(&DataKey::Escrow(escrow_id), &escrow);

        escrow.status
    }

    pub fn get_escrow(env: Env, escrow_id: u64) -> EscrowState {
        env.storage()
            .instance()
            .get(&DataKey::Escrow(escrow_id))
            .expect("Escrow not found")
    }

    fn get_next_escrow_id(env: &Env) -> u64 {
        let count_key = DataKey::EscrowCount;
        let count: u64 = env.storage().instance().get(&count_key).unwrap_or(0);
        env.storage().instance().set(&count_key, &(count + 1));
        count
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::{Address as _, Ledger}, token, Address, Env};

    fn create_token_contract<'a>(env: &Env, admin: &Address) -> token::Client<'a> {
        let contract_id = env.register_stellar_asset_contract(admin.clone());
        token::Client::new(env, &contract_id)
    }

    #[test]
    fn test_create_escrow() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, EscrowContract);
        let client = EscrowContractClient::new(&env, &contract_id);

        let buyer = Address::generate(&env);
        let seller = Address::generate(&env);
        let admin = Address::generate(&env);

        let token = create_token_contract(&env, &admin);
        token.mint(&buyer, &1000000);

        let escrow_id = client.create_escrow(
            &buyer,
            &seller,
            &100000,
            &token.address,
            &(env.ledger().timestamp() + 86400),
        );

        let escrow = client.get_escrow(&escrow_id);
        assert_eq!(escrow.status, EscrowStatus::Funded);
    }

    #[test]
    fn test_successful_trade() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, EscrowContract);
        let client = EscrowContractClient::new(&env, &contract_id);

        let buyer = Address::generate(&env);
        let seller = Address::generate(&env);
        let admin = Address::generate(&env);

        let token = create_token_contract(&env, &admin);
        token.mint(&buyer, &1000000);

        let escrow_id = client.create_escrow(
            &buyer,
            &seller,
            &100000,
            &token.address,
            &(env.ledger().timestamp() + 86400),
        );

        client.confirm_delivery(&escrow_id, &buyer);
        let status = client.release_payment(&escrow_id);

        assert_eq!(status, EscrowStatus::Completed);
    }

    #[test]
    fn test_refund_on_deadline() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, EscrowContract);
        let client = EscrowContractClient::new(&env, &contract_id);

        let buyer = Address::generate(&env);
        let seller = Address::generate(&env);
        let admin = Address::generate(&env);

        let token = create_token_contract(&env, &admin);
        token.mint(&buyer, &1000000);

        let escrow_id = client.create_escrow(
            &buyer,
            &seller,
            &100000,
            &token.address,
            &(env.ledger().timestamp() + 86400),
        );

        // Advance past deadline
        env.ledger().set_timestamp(env.ledger().timestamp() + 86401);

        let status = client.refund(&escrow_id);
        assert_eq!(status, EscrowStatus::Refunded);
    }
}
