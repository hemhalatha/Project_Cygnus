# Credit Scoring Smart Contract

A Soroban smart contract for managing credit profiles and calculating transaction limits for autonomous agents in the machine economy.

## Overview

This contract implements a credit scoring system that:
- Tracks agent transaction history
- Calculates credit scores (0-1000 range)
- Determines transaction limits based on creditworthiness
- Updates scores based on transaction outcomes

## Credit Score Algorithm

The credit score is calculated using a weighted formula:

### Components (Total: 1000 points)

1. **Payment History (35%)** - 0 to 350 points
   - Based on successful_transactions / total_transactions ratio
   - Penalty: -100 points per default

2. **Credit Utilization (30%)** - 0 to 300 points
   - Based on total transaction volume
   - Higher volume increases score (capped at 300)

3. **Account Age (15%)** - 0 to 150 points
   - 1 point per day of account age
   - Capped at 150 points (150 days)

4. **Transaction Volume (20%)** - 0 to 200 points
   - Based on number of transactions
   - 2 points per transaction (capped at 200)

### Initial Score

New accounts start with a score of **500** (middle of range).

## Transaction Limits

Limits are calculated based on credit score:

```
Base Limit = 10,000,000 stroops (1 XLM)
Multiplier = credit_score / 500

max_buy_amount = base_limit * multiplier
max_sell_amount = base_limit * multiplier
max_loan_amount = base_limit * multiplier * 0.5
max_borrow_amount = base_limit * multiplier * 0.3
daily_transaction_limit = base_limit * multiplier * 5
```

### Examples

| Credit Score | Multiplier | Max Buy/Sell | Max Loan | Max Borrow | Daily Limit |
|--------------|------------|--------------|----------|------------|-------------|
| 250 | 0.5x | 0.5 XLM | 0.25 XLM | 0.15 XLM | 2.5 XLM |
| 500 | 1.0x | 1.0 XLM | 0.5 XLM | 0.3 XLM | 5.0 XLM |
| 750 | 1.5x | 1.5 XLM | 0.75 XLM | 0.45 XLM | 7.5 XLM |
| 1000 | 2.0x | 2.0 XLM | 1.0 XLM | 0.6 XLM | 10.0 XLM |

## Contract Functions

### `initialize_profile`

Creates a new credit profile for an agent.

```rust
pub fn initialize_profile(env: Env, agent_did: String) -> CreditProfile
```

**Parameters:**
- `agent_did`: Agent's decentralized identifier (DID)

**Returns:** Newly created `CreditProfile` with initial score of 500

**Panics:** If profile already exists for the agent

### `update_score`

Updates credit score based on transaction outcome.

```rust
pub fn update_score(
    env: Env,
    agent_did: String,
    outcome: TransactionOutcome,
    amount: i128,
) -> u32
```

**Parameters:**
- `agent_did`: Agent's DID
- `outcome`: Transaction outcome (Success, Default, or Partial)
- `amount`: Transaction amount in stroops

**Returns:** Updated credit score

**Transaction Outcomes:**
- `Success`: Increases score
- `Default`: Decreases score significantly (-100 points)
- `Partial`: Minor score adjustment

### `get_credit_score`

Retrieves the current credit score for an agent.

```rust
pub fn get_credit_score(env: Env, agent_did: String) -> u32
```

**Parameters:**
- `agent_did`: Agent's DID

**Returns:** Credit score (0-1000)

### `get_transaction_limits`

Calculates transaction limits based on credit score.

```rust
pub fn get_transaction_limits(env: Env, agent_did: String) -> TransactionLimits
```

**Parameters:**
- `agent_did`: Agent's DID

**Returns:** `TransactionLimits` struct with calculated limits

### `get_profile`

Retrieves the complete credit profile.

```rust
pub fn get_profile(env: Env, agent_did: String) -> CreditProfile
```

**Parameters:**
- `agent_did`: Agent's DID

**Returns:** Complete `CreditProfile`

## Data Structures

### CreditProfile

```rust
pub struct CreditProfile {
    pub agent_did: String,
    pub score: u32,                      // 0-1000
    pub total_transactions: u64,
    pub successful_transactions: u64,
    pub defaults: u64,
    pub total_volume: i128,              // in stroops
    pub account_age: u64,                // in seconds
    pub last_updated: u64,               // timestamp
}
```

### TransactionLimits

```rust
pub struct TransactionLimits {
    pub max_buy_amount: i128,            // in stroops
    pub max_sell_amount: i128,
    pub max_loan_amount: i128,
    pub max_borrow_amount: i128,
    pub daily_transaction_limit: i128,
}
```

### TransactionOutcome

```rust
pub enum TransactionOutcome {
    Success,
    Default,
    Partial,
}
```

## Building

```bash
cd contracts/credit-scoring
cargo build --target wasm32-unknown-unknown --release
```

Or use the Makefile:

```bash
make build-contracts
```

## Testing

Run the test suite:

```bash
cargo test
```

The contract includes comprehensive tests:
- Profile initialization
- Score updates (success/default/partial)
- Credit score retrieval
- Transaction limits calculation
- Multiple transaction scenarios
- Edge cases (duplicate profiles, nonexistent profiles)

## Deployment

Deploy to Stellar testnet:

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/credit_scoring.wasm \
  --source alice \
  --network testnet
```

Or use the automated deployment script:

```bash
make deploy-testnet
```

## Usage Example

```rust
// Initialize a new agent profile
let agent_did = String::from_str(&env, "did:stellar:agent1");
let profile = client.initialize_profile(&agent_did);

// Record a successful transaction
let amount = 5_000_000; // 0.5 XLM
let new_score = client.update_score(
    &agent_did,
    &TransactionOutcome::Success,
    &amount
);

// Get current credit score
let score = client.get_credit_score(&agent_did);

// Get transaction limits
let limits = client.get_transaction_limits(&agent_did);
println!("Max buy: {} stroops", limits.max_buy_amount);
```

## Integration

This contract integrates with:
- **Loan Contract**: Checks borrower creditworthiness
- **Escrow Contract**: Updates scores after trade completion
- **Agent Runtime**: Enforces transaction limits
- **Masumi Network**: Links to agent DIDs

## Security Considerations

1. **Access Control**: Currently, any address can update scores. In production, implement proper authorization.
2. **Score Manipulation**: Consider adding time-based decay or verification mechanisms.
3. **Storage Costs**: Profile data is stored in instance storage for persistence.
4. **Overflow Protection**: Uses checked arithmetic for score calculations.

## Future Enhancements

- [ ] Multi-signature score updates
- [ ] Time-based score decay
- [ ] Reputation staking
- [ ] Cross-chain credit history
- [ ] Machine learning-based scoring
- [ ] Dispute resolution mechanism

## License

MIT
