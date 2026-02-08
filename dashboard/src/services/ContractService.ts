import * as StellarSdk from '@stellar/stellar-sdk';
import {
  CreditProfile,
  TransactionLimits,
  LoanTerms,
  LoanState,
  TransactionOutcome,
} from '../types';
import { STELLAR_CONFIG, CONTRACT_ADDRESSES } from '../config/stellar';

/**
 * ContractService interfaces with deployed Stellar smart contracts
 * 
 * Provides methods for interacting with Credit Scoring, Loan, and Escrow contracts
 * on the Stellar testnet.
 */
export class ContractService {
  private server: StellarSdk.Horizon.Server;
  private sorobanServer: StellarSdk.SorobanRpc.Server;
  private networkPassphrase: string;

  constructor() {
    this.server = new StellarSdk.Horizon.Server(STELLAR_CONFIG.horizonUrl);
    this.sorobanServer = new StellarSdk.SorobanRpc.Server(STELLAR_CONFIG.sorobanRpcUrl);
    this.networkPassphrase = STELLAR_CONFIG.networkPassphrase;
  }

  /**
   * Get the Horizon server instance
   */
  getServer(): StellarSdk.Horizon.Server {
    return this.server;
  }

  /**
   * Get the Soroban RPC server instance
   */
  getSorobanServer(): StellarSdk.SorobanRpc.Server {
    return this.sorobanServer;
  }

  /**
   * Get the network passphrase
   */
  getNetworkPassphrase(): string {
    return this.networkPassphrase;
  }

  /**
   * Get contract address by name
   */
  getContractAddress(contractName: 'creditScoring' | 'loan' | 'escrow'): string {
    return CONTRACT_ADDRESSES[contractName];
  }

  // Credit Scoring Contract Methods

  /**
   * Get credit score for an agent
   * 
   * @param agentDid - Agent's DID
   * @returns Credit score (0-1000)
   */
  async getCreditScore(agentDid: string): Promise<number> {
    try {
      const contract = new StellarSdk.Contract(CONTRACT_ADDRESSES.creditScoring);
      
      // Build the contract call operation
      const operation = contract.call(
        'get_credit_score',
        StellarSdk.nativeToScVal(agentDid, { type: 'string' })
      );

      // Create a transaction
      const account = await this.server.loadAccount(agentDid);
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      // Simulate the transaction
      const simulated = await this.sorobanServer.simulateTransaction(transaction);
      
      if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated)) {
        const result = simulated.result?.retval;
        if (result) {
          return StellarSdk.scValToNative(result) as number;
        }
      }

      throw new Error('Failed to simulate credit score query');
    } catch (error) {
      console.error('Failed to get credit score:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        throw new Error('Credit profile not found');
      }
      
      throw new Error('Failed to get credit score');
    }
  }

  /**
   * Get transaction limits for an agent based on credit score
   * 
   * @param agentDid - Agent's DID
   * @returns Transaction limits
   */
  async getTransactionLimits(agentDid: string): Promise<TransactionLimits> {
    try {
      const contract = new StellarSdk.Contract(CONTRACT_ADDRESSES.creditScoring);
      
      const operation = contract.call(
        'get_transaction_limits',
        StellarSdk.nativeToScVal(agentDid, { type: 'string' })
      );

      const account = await this.server.loadAccount(agentDid);
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const simulated = await this.sorobanServer.simulateTransaction(transaction);
      
      if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated)) {
        const result = simulated.result?.retval;
        if (result) {
          return StellarSdk.scValToNative(result) as TransactionLimits;
        }
      }

      throw new Error('Failed to simulate transaction limits query');
    } catch (error) {
      console.error('Failed to get transaction limits:', error);
      throw new Error('Failed to get transaction limits');
    }
  }

  /**
   * Get complete credit profile for an agent
   * 
   * @param agentDid - Agent's DID
   * @returns Credit profile
   */
  async getCreditProfile(agentDid: string): Promise<CreditProfile> {
    try {
      const contract = new StellarSdk.Contract(CONTRACT_ADDRESSES.creditScoring);
      
      const operation = contract.call(
        'get_credit_profile',
        StellarSdk.nativeToScVal(agentDid, { type: 'string' })
      );

      const account = await this.server.loadAccount(agentDid);
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const simulated = await this.sorobanServer.simulateTransaction(transaction);
      
      if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated)) {
        const result = simulated.result?.retval;
        if (result) {
          return StellarSdk.scValToNative(result) as CreditProfile;
        }
      }

      throw new Error('Failed to simulate credit profile query');
    } catch (error) {
      console.error('Failed to get credit profile:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        throw new Error('Credit profile not found');
      }
      
      throw new Error('Failed to get credit profile');
    }
  }

  /**
   * Update credit score based on transaction outcome
   * 
   * @param agentDid - Agent's DID
   * @param outcome - Transaction outcome (Success, Default, Partial)
   * @param amount - Transaction amount in stroops
   * @returns Updated credit score
   */
  async updateCreditScore(
    agentDid: string,
    outcome: TransactionOutcome,
    amount: string
  ): Promise<number> {
    try {
      const contract = new StellarSdk.Contract(CONTRACT_ADDRESSES.creditScoring);
      
      const operation = contract.call(
        'update_credit_score',
        StellarSdk.nativeToScVal(agentDid, { type: 'string' }),
        StellarSdk.nativeToScVal(outcome, { type: 'string' }),
        StellarSdk.nativeToScVal(amount, { type: 'string' })
      );

      const account = await this.server.loadAccount(agentDid);
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      // This requires authorization and submission
      // For now, we simulate to get the expected result
      const simulated = await this.sorobanServer.simulateTransaction(transaction);
      
      if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated)) {
        const result = simulated.result?.retval;
        if (result) {
          return StellarSdk.scValToNative(result) as number;
        }
      }

      throw new Error('Failed to simulate credit score update');
    } catch (error) {
      console.error('Failed to update credit score:', error);
      throw new Error('Failed to update credit score');
    }
  }

  /**
   * Initialize credit profile for a new agent
   * 
   * @param agentDid - Agent's DID
   * @returns Initialized credit profile
   */
  async initializeCreditProfile(agentDid: string): Promise<CreditProfile> {
    try {
      const contract = new StellarSdk.Contract(CONTRACT_ADDRESSES.creditScoring);
      
      const operation = contract.call(
        'initialize_credit_profile',
        StellarSdk.nativeToScVal(agentDid, { type: 'string' })
      );

      const account = await this.server.loadAccount(agentDid);
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      // This requires authorization and submission
      const simulated = await this.sorobanServer.simulateTransaction(transaction);
      
      if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated)) {
        const result = simulated.result?.retval;
        if (result) {
          return StellarSdk.scValToNative(result) as CreditProfile;
        }
      }

      throw new Error('Failed to simulate credit profile initialization');
    } catch (error) {
      console.error('Failed to initialize credit profile:', error);
      throw new Error('Failed to initialize credit profile');
    }
  }

  // Loan Contract Methods

  /**
   * Create a new loan
   * 
   * @param lender - Lender's address
   * @param borrower - Borrower's address
   * @param terms - Loan terms
   * @returns Loan ID
   */
  async createLoan(
    lender: string,
    borrower: string,
    terms: LoanTerms
  ): Promise<number> {
    try {
      const contract = new StellarSdk.Contract(CONTRACT_ADDRESSES.loan);
      
      const operation = contract.call(
        'create_loan',
        StellarSdk.nativeToScVal(lender, { type: 'address' }),
        StellarSdk.nativeToScVal(borrower, { type: 'address' }),
        StellarSdk.nativeToScVal(terms.principal, { type: 'string' }),
        StellarSdk.nativeToScVal(terms.interestRate, { type: 'u32' }),
        StellarSdk.nativeToScVal(terms.duration, { type: 'u64' }),
        StellarSdk.nativeToScVal(terms.collateralAmount, { type: 'string' }),
        StellarSdk.nativeToScVal(terms.collateralAsset, { type: 'address' }),
        StellarSdk.nativeToScVal(terms.installments, { type: 'u32' })
      );

      const account = await this.server.loadAccount(lender);
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const simulated = await this.sorobanServer.simulateTransaction(transaction);
      
      if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated)) {
        const result = simulated.result?.retval;
        if (result) {
          return StellarSdk.scValToNative(result) as number;
        }
      }

      throw new Error('Failed to simulate loan creation');
    } catch (error) {
      console.error('Failed to create loan:', error);
      throw new Error('Failed to create loan');
    }
  }

  /**
   * Make a repayment on a loan
   * 
   * @param loanId - Loan ID
   * @param borrower - Borrower's address
   * @param amount - Repayment amount in stroops
   * @returns Transaction hash
   */
  async makeRepayment(
    loanId: number,
    borrower: string,
    amount: string
  ): Promise<string> {
    try {
      const contract = new StellarSdk.Contract(CONTRACT_ADDRESSES.loan);
      
      const operation = contract.call(
        'make_repayment',
        StellarSdk.nativeToScVal(loanId, { type: 'u64' }),
        StellarSdk.nativeToScVal(borrower, { type: 'address' }),
        StellarSdk.nativeToScVal(amount, { type: 'string' })
      );

      const account = await this.server.loadAccount(borrower);
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const simulated = await this.sorobanServer.simulateTransaction(transaction);
      
      if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated)) {
        // Return a placeholder hash for now
        return 'repayment_tx_hash';
      }

      throw new Error('Failed to simulate repayment');
    } catch (error) {
      console.error('Failed to make repayment:', error);
      throw new Error('Failed to make repayment');
    }
  }

  /**
   * Liquidate collateral for an overdue loan
   * 
   * @param loanId - Loan ID
   * @param lender - Lender's address
   * @returns Transaction hash
   */
  async liquidateCollateral(loanId: number, lender: string): Promise<string> {
    try {
      const contract = new StellarSdk.Contract(CONTRACT_ADDRESSES.loan);
      
      const operation = contract.call(
        'liquidate_collateral',
        StellarSdk.nativeToScVal(loanId, { type: 'u64' }),
        StellarSdk.nativeToScVal(lender, { type: 'address' })
      );

      const account = await this.server.loadAccount(lender);
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const simulated = await this.sorobanServer.simulateTransaction(transaction);
      
      if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated)) {
        return 'liquidation_tx_hash';
      }

      throw new Error('Failed to simulate liquidation');
    } catch (error) {
      console.error('Failed to liquidate collateral:', error);
      throw new Error('Failed to liquidate collateral');
    }
  }

  /**
   * Get loan status
   * 
   * @param loanId - Loan ID
   * @returns Loan status string
   */
  async getLoanStatus(loanId: number): Promise<string> {
    try {
      const contract = new StellarSdk.Contract(CONTRACT_ADDRESSES.loan);
      
      const operation = contract.call(
        'get_loan_status',
        StellarSdk.nativeToScVal(loanId, { type: 'u64' })
      );

      // Use a dummy account for read-only operations
      const dummyKeypair = StellarSdk.Keypair.random();
      const dummyAccount = new StellarSdk.Account(dummyKeypair.publicKey(), '0');
      
      const transaction = new StellarSdk.TransactionBuilder(dummyAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const simulated = await this.sorobanServer.simulateTransaction(transaction);
      
      if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated)) {
        const result = simulated.result?.retval;
        if (result) {
          return StellarSdk.scValToNative(result) as string;
        }
      }

      throw new Error('Failed to simulate loan status query');
    } catch (error) {
      console.error('Failed to get loan status:', error);
      throw new Error('Failed to get loan status');
    }
  }

  /**
   * Get complete loan state
   * 
   * @param loanId - Loan ID
   * @returns Loan state
   */
  async getLoan(loanId: number): Promise<LoanState> {
    try {
      const contract = new StellarSdk.Contract(CONTRACT_ADDRESSES.loan);
      
      const operation = contract.call(
        'get_loan',
        StellarSdk.nativeToScVal(loanId, { type: 'u64' })
      );

      const dummyKeypair = StellarSdk.Keypair.random();
      const dummyAccount = new StellarSdk.Account(dummyKeypair.publicKey(), '0');
      
      const transaction = new StellarSdk.TransactionBuilder(dummyAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const simulated = await this.sorobanServer.simulateTransaction(transaction);
      
      if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated)) {
        const result = simulated.result?.retval;
        if (result) {
          return StellarSdk.scValToNative(result) as LoanState;
        }
      }

      throw new Error('Failed to simulate loan query');
    } catch (error) {
      console.error('Failed to get loan:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        throw new Error('Loan not found');
      }
      
      throw new Error('Failed to get loan');
    }
  }

  /**
   * Check if a loan is overdue
   * 
   * @param loanId - Loan ID
   * @returns True if loan is overdue
   */
  async isLoanOverdue(loanId: number): Promise<boolean> {
    try {
      const contract = new StellarSdk.Contract(CONTRACT_ADDRESSES.loan);
      
      const operation = contract.call(
        'is_loan_overdue',
        StellarSdk.nativeToScVal(loanId, { type: 'u64' })
      );

      const dummyKeypair = StellarSdk.Keypair.random();
      const dummyAccount = new StellarSdk.Account(dummyKeypair.publicKey(), '0');
      
      const transaction = new StellarSdk.TransactionBuilder(dummyAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const simulated = await this.sorobanServer.simulateTransaction(transaction);
      
      if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated)) {
        const result = simulated.result?.retval;
        if (result) {
          return StellarSdk.scValToNative(result) as boolean;
        }
      }

      throw new Error('Failed to simulate overdue check');
    } catch (error) {
      console.error('Failed to check if loan is overdue:', error);
      throw new Error('Failed to check if loan is overdue');
    }
  }

  /**
   * Get all loans for a user (as lender or borrower)
   * 
   * @param userAddress - User's Stellar address
   * @returns Array of loan states
   */
  async getUserLoans(userAddress: string): Promise<LoanState[]> {
    try {
      const contract = new StellarSdk.Contract(CONTRACT_ADDRESSES.loan);
      
      const operation = contract.call(
        'get_user_loans',
        StellarSdk.nativeToScVal(userAddress, { type: 'address' })
      );

      const dummyKeypair = StellarSdk.Keypair.random();
      const dummyAccount = new StellarSdk.Account(dummyKeypair.publicKey(), '0');
      
      const transaction = new StellarSdk.TransactionBuilder(dummyAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const simulated = await this.sorobanServer.simulateTransaction(transaction);
      
      if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulated)) {
        const result = simulated.result?.retval;
        if (result) {
          return StellarSdk.scValToNative(result) as LoanState[];
        }
      }

      throw new Error('Failed to simulate user loans query');
    } catch (error) {
      console.error('Failed to get user loans:', error);
      throw new Error('Failed to get user loans');
    }
  }
}
