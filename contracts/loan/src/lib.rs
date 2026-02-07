#![no_std]

//! Loan Management Smart Contract
//! 
//! Manages peer-to-peer loans between autonomous agents with collateral,
//! automatic repayment, and liquidation mechanisms.

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Vec};

/// Loan status
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum LoanStatus {
    Active,
    Repaid,
    Defaulted,
    Liquidated,
}

/// Payment schedule entry
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Payment {
    pub due_date: u64,
    pub amount: i128,
    pub paid: bool,
}

/// Loan state
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LoanState {
    pub lender: Address,
    pub borrower: Address,
    pub principal: i128,
    pub interest_rate: u32,        // basis points (e.g., 500 = 5%)
    pub duration: u64,              // seconds
    pub collateral_amount: i128,
    pub collateral_asset: Address,
    pub repayment_schedule: Vec<Payment>,
    pub status: LoanStatus,
    pub created_at: u64,
    pub total_repaid: i128,
}

/// Loan terms for creation
#[contracttype]
#[derive(Clone, Debug)]
pub struct LoanTerms {
    pub principal: i128,
    pub interest_rate: u32,
    pub duration: u64,
    pub collateral_amount: i128,
    pub collateral_asset: Address,
    pub installments: u32,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Loan(u64),
    LoanCount,
}

#[contract]
pub struct LoanContract;

#[contractimpl]
impl LoanContract {
    /// Create a new loan with collateral
    pub fn create_loan(
        env: Env,
        lender: Address,
        borrower: Address,
        terms: LoanTerms,
    ) -> u64 {
        lender.require_auth();
        borrower.require_auth();

        let loan_id = Self::get_next_loan_id(&env);
        let current_time = env.ledger().timestamp();

        // Calculate repayment schedule
        let total_amount = terms.principal + (terms.principal * terms.interest_rate as i128 / 10000);
        let payment_amount = total_amount / terms.installments as i128;
        let payment_interval = terms.duration / terms.installments as u64;

        let mut schedule = Vec::new(&env);
        for i in 0..terms.installments {
            schedule.push_back(Payment {
                due_date: current_time + (payment_interval * (i + 1) as u64),
                amount: payment_amount,
                paid: false,
            });
        }

        let loan = LoanState {
            lender: lender.clone(),
            borrower: borrower.clone(),
            principal: terms.principal,
            interest_rate: terms.interest_rate,
            duration: terms.duration,
            collateral_amount: terms.collateral_amount,
            collateral_asset: terms.collateral_asset.clone(),
            repayment_schedule: schedule,
            status: LoanStatus::Active,
            created_at: current_time,
            total_repaid: 0,
        };

        // Lock collateral
        let collateral_token = token::Client::new(&env, &terms.collateral_asset);
        collateral_token.transfer(
            &borrower,
            &env.current_contract_address(),
            &terms.collateral_amount,
        );

        // Transfer principal to borrower
        let principal_token = token::Client::new(&env, &terms.collateral_asset);
        principal_token.transfer(&lender, &borrower, &terms.principal);

        // Store loan
        env.storage().instance().set(&DataKey::Loan(loan_id), &loan);

        loan_id
    }

    /// Make a repayment
    pub fn make_repayment(
        env: Env,
        loan_id: u64,
        borrower: Address,
        amount: i128,
    ) -> LoanStatus {
        borrower.require_auth();

        let mut loan: LoanState = env
            .storage()
            .instance()
            .get(&DataKey::Loan(loan_id))
            .expect("Loan not found");

        if loan.status != LoanStatus::Active {
            panic!("Loan is not active");
        }

        if borrower != loan.borrower {
            panic!("Only borrower can make repayments");
        }

        // Find next unpaid installment
        let mut payment_made = false;
        for i in 0..loan.repayment_schedule.len() {
            let mut payment = loan.repayment_schedule.get(i).unwrap();
            if !payment.paid && amount >= payment.amount {
                let payment_amount = payment.amount;
                payment.paid = true;
                loan.repayment_schedule.set(i, payment);
                loan.total_repaid += payment_amount;
                payment_made = true;
                break;
            }
        }

        if !payment_made {
            panic!("Invalid repayment amount");
        }

        // Transfer payment to lender
        let token_client = token::Client::new(&env, &loan.collateral_asset);
        token_client.transfer(&borrower, &loan.lender, &amount);

        // Check if loan is fully repaid
        let total_due = loan.principal + (loan.principal * loan.interest_rate as i128 / 10000);
        if loan.total_repaid >= total_due {
            loan.status = LoanStatus::Repaid;
            // Release collateral
            token_client.transfer(
                &env.current_contract_address(),
                &loan.borrower,
                &loan.collateral_amount,
            );
        }

        env.storage().instance().set(&DataKey::Loan(loan_id), &loan);

        loan.status.clone()
    }

    /// Liquidate collateral on default
    pub fn liquidate_collateral(env: Env, loan_id: u64, lender: Address) -> LoanStatus {
        lender.require_auth();

        let mut loan: LoanState = env
            .storage()
            .instance()
            .get(&DataKey::Loan(loan_id))
            .expect("Loan not found");

        if loan.lender != lender {
            panic!("Only lender can liquidate");
        }

        if loan.status != LoanStatus::Active {
            panic!("Loan is not active");
        }

        // Check if any payment is overdue
        let current_time = env.ledger().timestamp();
        let mut is_defaulted = false;

        for i in 0..loan.repayment_schedule.len() {
            let payment = loan.repayment_schedule.get(i).unwrap();
            if !payment.paid && current_time > payment.due_date {
                is_defaulted = true;
                break;
            }
        }

        if !is_defaulted {
            panic!("No payments are overdue");
        }

        // Transfer collateral to lender
        let token_client = token::Client::new(&env, &loan.collateral_asset);
        token_client.transfer(
            &env.current_contract_address(),
            &lender,
            &loan.collateral_amount,
        );

        loan.status = LoanStatus::Liquidated;
        env.storage().instance().set(&DataKey::Loan(loan_id), &loan);

        loan.status
    }

    /// Get loan status
    pub fn get_loan_status(env: Env, loan_id: u64) -> LoanStatus {
        let loan: LoanState = env
            .storage()
            .instance()
            .get(&DataKey::Loan(loan_id))
            .expect("Loan not found");

        loan.status
    }

    /// Get complete loan details
    pub fn get_loan(env: Env, loan_id: u64) -> LoanState {
        env.storage()
            .instance()
            .get(&DataKey::Loan(loan_id))
            .expect("Loan not found")
    }

    /// Check if loan is overdue
    pub fn is_overdue(env: Env, loan_id: u64) -> bool {
        let loan: LoanState = env
            .storage()
            .instance()
            .get(&DataKey::Loan(loan_id))
            .expect("Loan not found");

        if loan.status != LoanStatus::Active {
            return false;
        }

        let current_time = env.ledger().timestamp();
        for i in 0..loan.repayment_schedule.len() {
            let payment = loan.repayment_schedule.get(i).unwrap();
            if !payment.paid && current_time > payment.due_date {
                return true;
            }
        }

        false
    }

    // Private helpers

    fn get_next_loan_id(env: &Env) -> u64 {
        let count_key = DataKey::LoanCount;
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
    fn test_create_loan() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, LoanContract);
        let client = LoanContractClient::new(&env, &contract_id);

        let lender = Address::generate(&env);
        let borrower = Address::generate(&env);
        let admin = Address::generate(&env);

        let token = create_token_contract(&env, &admin);
        token.mint(&lender, &1000000);
        token.mint(&borrower, &500000);

        let terms = LoanTerms {
            principal: 100000,
            interest_rate: 500, // 5%
            duration: 2592000,  // 30 days
            collateral_amount: 150000,
            collateral_asset: token.address.clone(),
            installments: 3,
        };

        let loan_id = client.create_loan(&lender, &borrower, &terms);
        assert_eq!(loan_id, 0);

        let status = client.get_loan_status(&loan_id);
        assert_eq!(status, LoanStatus::Active);
    }

    #[test]
    fn test_make_repayment() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, LoanContract);
        let client = LoanContractClient::new(&env, &contract_id);

        let lender = Address::generate(&env);
        let borrower = Address::generate(&env);
        let admin = Address::generate(&env);

        let token = create_token_contract(&env, &admin);
        token.mint(&lender, &1000000);
        token.mint(&borrower, &500000);

        let terms = LoanTerms {
            principal: 100000,
            interest_rate: 500,
            duration: 2592000,
            collateral_amount: 150000,
            collateral_asset: token.address.clone(),
            installments: 3,
        };

        let loan_id = client.create_loan(&lender, &borrower, &terms);

        // Make first repayment
        let payment_amount = 35000; // (100000 + 5000) / 3
        let status = client.make_repayment(&loan_id, &borrower, &payment_amount);
        assert_eq!(status, LoanStatus::Active);
    }

    #[test]
    fn test_full_repayment() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, LoanContract);
        let client = LoanContractClient::new(&env, &contract_id);

        let lender = Address::generate(&env);
        let borrower = Address::generate(&env);
        let admin = Address::generate(&env);

        let token = create_token_contract(&env, &admin);
        token.mint(&lender, &1000000);
        token.mint(&borrower, &500000);

        let terms = LoanTerms {
            principal: 100000,
            interest_rate: 500,
            duration: 2592000,
            collateral_amount: 150000,
            collateral_asset: token.address.clone(),
            installments: 3,
        };

        let loan_id = client.create_loan(&lender, &borrower, &terms);

        // Make all repayments
        let payment_amount = 35000;
        client.make_repayment(&loan_id, &borrower, &payment_amount);
        client.make_repayment(&loan_id, &borrower, &payment_amount);
        let status = client.make_repayment(&loan_id, &borrower, &payment_amount);

        assert_eq!(status, LoanStatus::Repaid);
    }

    #[test]
    fn test_liquidation() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register_contract(None, LoanContract);
        let client = LoanContractClient::new(&env, &contract_id);

        let lender = Address::generate(&env);
        let borrower = Address::generate(&env);
        let admin = Address::generate(&env);

        let token = create_token_contract(&env, &admin);
        token.mint(&lender, &1000000);
        token.mint(&borrower, &500000);

        let terms = LoanTerms {
            principal: 100000,
            interest_rate: 500,
            duration: 86400, // 1 day
            collateral_amount: 150000,
            collateral_asset: token.address.clone(),
            installments: 1,
        };

        let loan_id = client.create_loan(&lender, &borrower, &terms);

        // Advance time past due date
        env.ledger().set_timestamp(env.ledger().timestamp() + 86401);

        // Liquidate
        let status = client.liquidate_collateral(&loan_id, &lender);
        assert_eq!(status, LoanStatus::Liquidated);
    }
}
