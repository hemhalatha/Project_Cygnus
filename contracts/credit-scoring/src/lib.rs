#![no_std]

//! Credit Scoring Smart Contract
//! 
//! This contract manages credit profiles for autonomous agents in the machine economy.
//! It calculates credit scores based on transaction history, payment timeliness,
//! and default records, then determines transaction limits accordingly.

use soroban_sdk::{contract, contractimpl, contracttype, Env, String};

/// Credit profile for an agent
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CreditProfile {
    /// Agent's DID (Decentralized Identifier)
    pub agent_did: String,
    /// Credit score (0-1000)
    pub score: u32,
    /// Total number of transactions
    pub total_transactions: u64,
    /// Number of successful transactions
    pub successful_transactions: u64,
    /// Number of defaults
    pub defaults: u64,
    /// Total transaction volume in stroops
    pub total_volume: i128,
    /// Account age in seconds since creation
    pub account_age: u64,
    /// Last update timestamp
    pub last_updated: u64,
}

/// Transaction limits based on credit score
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TransactionLimits {
    /// Maximum buy amount in stroops
    pub max_buy_amount: i128,
    /// Maximum sell amount in stroops
    pub max_sell_amount: i128,
    /// Maximum loan amount in stroops
    pub max_loan_amount: i128,
    /// Maximum borrow amount in stroops
    pub max_borrow_amount: i128,
    /// Daily transaction limit in stroops
    pub daily_transaction_limit: i128,
}

/// Transaction outcome for credit score updates
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum TransactionOutcome {
    Success,
    Default,
    Partial,
}

/// Storage keys for the contract
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Profile(String),
}

/// Credit scoring contract
#[contract]
pub struct CreditScoringContract;

#[contractimpl]
impl CreditScoringContract {
    /// Initialize a new credit profile for an agent
    /// 
    /// # Arguments
    /// * `env` - Contract environment
    /// * `agent_did` - Agent's decentralized identifier
    /// 
    /// # Returns
    /// * `CreditProfile` - Newly created profile with initial score of 500
    pub fn initialize_profile(env: Env, agent_did: String) -> CreditProfile {
        let key = DataKey::Profile(agent_did.clone());
        
        // Check if profile already exists
        if env.storage().instance().has(&key) {
            panic!("Profile already exists for this agent");
        }

        let current_time = env.ledger().timestamp();
        
        let profile = CreditProfile {
            agent_did: agent_did.clone(),
            score: 500, // Initial score (middle of 0-1000 range)
            total_transactions: 0,
            successful_transactions: 0,
            defaults: 0,
            total_volume: 0,
            account_age: 0,
            last_updated: current_time,
        };

        // Store the profile
        env.storage().instance().set(&key, &profile);
        
        profile
    }

    /// Update credit score based on transaction outcome
    /// 
    /// # Arguments
    /// * `env` - Contract environment
    /// * `agent_did` - Agent's decentralized identifier
    /// * `outcome` - Transaction outcome (Success, Default, or Partial)
    /// * `amount` - Transaction amount in stroops
    /// 
    /// # Returns
    /// * `u32` - Updated credit score
    pub fn update_score(
        env: Env,
        agent_did: String,
        outcome: TransactionOutcome,
        amount: i128,
    ) -> u32 {
        let key = DataKey::Profile(agent_did.clone());
        
        // Get existing profile
        let mut profile: CreditProfile = env
            .storage()
            .instance()
            .get(&key)
            .expect("Profile not found");

        let current_time = env.ledger().timestamp();
        
        // Update account age
        if profile.account_age == 0 {
            profile.account_age = current_time - profile.last_updated;
        } else {
            profile.account_age = current_time - (profile.last_updated - profile.account_age);
        }

        // Update transaction counts and volume
        profile.total_transactions += 1;
        profile.total_volume += amount;

        // Update based on outcome
        match outcome {
            TransactionOutcome::Success => {
                profile.successful_transactions += 1;
                // Increase score for successful transactions
                profile.score = Self::calculate_score(&profile);
            }
            TransactionOutcome::Default => {
                profile.defaults += 1;
                // Decrease score significantly for defaults
                profile.score = Self::calculate_score(&profile);
            }
            TransactionOutcome::Partial => {
                // Partial success - minor score adjustment
                profile.score = Self::calculate_score(&profile);
            }
        }

        profile.last_updated = current_time;

        // Store updated profile
        env.storage().instance().set(&key, &profile);

        profile.score
    }

    /// Get credit score for an agent
    /// 
    /// # Arguments
    /// * `env` - Contract environment
    /// * `agent_did` - Agent's decentralized identifier
    /// 
    /// # Returns
    /// * `u32` - Credit score (0-1000)
    pub fn get_credit_score(env: Env, agent_did: String) -> u32 {
        let key = DataKey::Profile(agent_did);
        
        let profile: CreditProfile = env
            .storage()
            .instance()
            .get(&key)
            .expect("Profile not found");

        profile.score
    }

    /// Get transaction limits based on credit score
    /// 
    /// # Arguments
    /// * `env` - Contract environment
    /// * `agent_did` - Agent's decentralized identifier
    /// 
    /// # Returns
    /// * `TransactionLimits` - Calculated transaction limits
    pub fn get_transaction_limits(env: Env, agent_did: String) -> TransactionLimits {
        let key = DataKey::Profile(agent_did);
        
        let profile: CreditProfile = env
            .storage()
            .instance()
            .get(&key)
            .expect("Profile not found");

        Self::calculate_limits(profile.score)
    }

    /// Get complete credit profile
    /// 
    /// # Arguments
    /// * `env` - Contract environment
    /// * `agent_did` - Agent's decentralized identifier
    /// 
    /// # Returns
    /// * `CreditProfile` - Complete credit profile
    pub fn get_profile(env: Env, agent_did: String) -> CreditProfile {
        let key = DataKey::Profile(agent_did);
        
        env.storage()
            .instance()
            .get(&key)
            .expect("Profile not found")
    }

    // Private helper functions

    /// Calculate credit score based on profile data
    /// 
    /// Scoring algorithm:
    /// - Payment History (35%): successful_transactions / total_transactions
    /// - Credit Utilization (30%): Based on transaction volume
    /// - Account Age (15%): Longer accounts get higher scores
    /// - Transaction Volume (20%): Higher volume increases score
    /// 
    /// Score range: 0-1000
    fn calculate_score(profile: &CreditProfile) -> u32 {
        if profile.total_transactions == 0 {
            return 500; // Default score for new accounts
        }

        // Payment History Score (35% weight) - 0 to 350 points
        // Using fixed-point arithmetic: multiply by 1000 to avoid floating point
        let success_rate = if profile.total_transactions > 0 {
            (profile.successful_transactions * 1000) / profile.total_transactions
        } else {
            500 // 0.5 in fixed-point (500/1000)
        };
        let payment_history_score = ((success_rate * 350) / 1000) as u32;

        // Default penalty - subtract 100 points per default
        let default_penalty = (profile.defaults as u32) * 100;

        // Credit Utilization Score (30% weight) - 0 to 300 points
        // Based on total volume (higher volume = better score, up to a point)
        let volume_score = if profile.total_volume > 0 {
            let volume_millions = (profile.total_volume / 10_000_000) as u32; // Convert to millions of stroops
            u32::min(volume_millions * 10, 300) // Cap at 300 points
        } else {
            150 // Neutral score for no volume
        };

        // Account Age Score (15% weight) - 0 to 150 points
        // 1 point per day, capped at 150 points (150 days)
        let age_days = profile.account_age / 86400; // Convert seconds to days
        let account_age_score = u32::min(age_days as u32, 150);

        // Transaction Volume Score (20% weight) - 0 to 200 points
        // Based on number of transactions
        let tx_count_score = u32::min(profile.total_transactions as u32 * 2, 200);

        // Calculate total score
        let total_score = payment_history_score
            + volume_score
            + account_age_score
            + tx_count_score;

        // Apply default penalty
        let final_score = if total_score > default_penalty {
            total_score - default_penalty
        } else {
            0
        };

        // Ensure score is within 0-1000 range
        u32::min(final_score, 1000)
    }

    /// Calculate transaction limits based on credit score
    /// 
    /// Base limit: 10,000,000 stroops (1 XLM)
    /// Multiplier: score / 500 (score of 500 = 1x, 1000 = 2x)
    fn calculate_limits(credit_score: u32) -> TransactionLimits {
        let base_limit: i128 = 10_000_000; // 1 XLM in stroops
        let multiplier = (credit_score as i128) * 1000 / 500_000; // Fixed-point arithmetic

        let max_buy = (base_limit * multiplier) / 1000;
        let max_sell = (base_limit * multiplier) / 1000;
        let max_loan = (base_limit * multiplier * 50) / 100_000; // 50% of base
        let max_borrow = (base_limit * multiplier * 30) / 100_000; // 30% of base
        let daily_limit = (base_limit * multiplier * 5) / 1000; // 5x base

        TransactionLimits {
            max_buy_amount: max_buy,
            max_sell_amount: max_sell,
            max_loan_amount: max_loan,
            max_borrow_amount: max_borrow,
            daily_transaction_limit: daily_limit,
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Ledger, Env, String};

    #[test]
    fn test_initialize_profile() {
        let env = Env::default();
        let contract_id = env.register_contract(None, CreditScoringContract);
        let client = CreditScoringContractClient::new(&env, &contract_id);

        let agent_did = String::from_str(&env, "did:stellar:agent1");
        let profile = client.initialize_profile(&agent_did);

        assert_eq!(profile.agent_did, agent_did);
        assert_eq!(profile.score, 500);
        assert_eq!(profile.total_transactions, 0);
        assert_eq!(profile.successful_transactions, 0);
        assert_eq!(profile.defaults, 0);
    }

    #[test]
    fn test_update_score_success() {
        let env = Env::default();
        let contract_id = env.register_contract(None, CreditScoringContract);
        let client = CreditScoringContractClient::new(&env, &contract_id);

        let agent_did = String::from_str(&env, "did:stellar:agent1");
        client.initialize_profile(&agent_did);

        // Successful transaction should increase score
        let amount = 1_000_000; // 0.1 XLM
        let new_score = client.update_score(&agent_did, &TransactionOutcome::Success, &amount);

        assert!(new_score >= 500); // Score should increase or stay same
    }

    #[test]
    fn test_update_score_default() {
        let env = Env::default();
        let contract_id = env.register_contract(None, CreditScoringContract);
        let client = CreditScoringContractClient::new(&env, &contract_id);

        let agent_did = String::from_str(&env, "did:stellar:agent1");
        client.initialize_profile(&agent_did);

        // Default should decrease score
        let amount = 1_000_000;
        let new_score = client.update_score(&agent_did, &TransactionOutcome::Default, &amount);

        assert!(new_score < 500); // Score should decrease
    }

    #[test]
    fn test_get_credit_score() {
        let env = Env::default();
        let contract_id = env.register_contract(None, CreditScoringContract);
        let client = CreditScoringContractClient::new(&env, &contract_id);

        let agent_did = String::from_str(&env, "did:stellar:agent1");
        client.initialize_profile(&agent_did);

        let score = client.get_credit_score(&agent_did);
        assert_eq!(score, 500);
    }

    #[test]
    fn test_get_transaction_limits() {
        let env = Env::default();
        let contract_id = env.register_contract(None, CreditScoringContract);
        let client = CreditScoringContractClient::new(&env, &contract_id);

        let agent_did = String::from_str(&env, "did:stellar:agent1");
        client.initialize_profile(&agent_did);

        let limits = client.get_transaction_limits(&agent_did);

        assert!(limits.max_buy_amount > 0);
        assert!(limits.max_sell_amount > 0);
        assert!(limits.max_loan_amount > 0);
        assert!(limits.max_borrow_amount > 0);
        assert!(limits.daily_transaction_limit > 0);
    }

    #[test]
    fn test_multiple_successful_transactions() {
        let env = Env::default();
        let contract_id = env.register_contract(None, CreditScoringContract);
        let client = CreditScoringContractClient::new(&env, &contract_id);

        let agent_did = String::from_str(&env, "did:stellar:agent1");
        client.initialize_profile(&agent_did);

        let initial_score = client.get_credit_score(&agent_did);

        // Perform multiple successful transactions
        for _ in 0..10 {
            env.ledger().set_timestamp(env.ledger().timestamp() + 86400); // Advance 1 day
            client.update_score(&agent_did, &TransactionOutcome::Success, &1_000_000);
        }

        let final_score = client.get_credit_score(&agent_did);
        assert!(final_score > initial_score); // Score should increase
    }

    #[test]
    #[should_panic(expected = "Profile already exists")]
    fn test_duplicate_profile() {
        let env = Env::default();
        let contract_id = env.register_contract(None, CreditScoringContract);
        let client = CreditScoringContractClient::new(&env, &contract_id);

        let agent_did = String::from_str(&env, "did:stellar:agent1");
        client.initialize_profile(&agent_did);
        client.initialize_profile(&agent_did); // Should panic
    }

    #[test]
    #[should_panic(expected = "Profile not found")]
    fn test_get_nonexistent_profile() {
        let env = Env::default();
        let contract_id = env.register_contract(None, CreditScoringContract);
        let client = CreditScoringContractClient::new(&env, &contract_id);

        let agent_did = String::from_str(&env, "did:stellar:nonexistent");
        client.get_credit_score(&agent_did); // Should panic
    }
}
