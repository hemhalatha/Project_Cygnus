import * as StellarSdk from '@stellar/stellar-sdk';
import {
  TransactionParams,
  TransactionStatus,
  TradingOperation,
} from '../types';
import { STELLAR_CONFIG } from '../config/stellar';
import { WalletService } from './WalletService';
import { ContractService } from './ContractService';

/**
 * TransactionService handles transaction creation, signing, submission, and status tracking
 * 
 * Provides methods for creating payments, trading operations, and monitoring transaction status
 * on the Stellar testnet.
 */
export class TransactionService {
  private server: StellarSdk.Horizon.Server;
  private networkPassphrase: string;
  private walletService: WalletService;
  private contractService: ContractService;

  constructor(walletService: WalletService, contractService: ContractService) {
    this.server = new StellarSdk.Horizon.Server(STELLAR_CONFIG.horizonUrl);
    this.networkPassphrase = STELLAR_CONFIG.networkPassphrase;
    this.walletService = walletService;
    this.contractService = contractService;
  }

  /**
   * Create a payment transaction
   * 
   * @param params - Transaction parameters
   * @returns Built transaction
   */
  async createPayment(params: TransactionParams): Promise<StellarSdk.Transaction> {
    try {
      // Load source account
      const sourceAccount = await this.server.loadAccount(params.source);

      // Build payment operation
      const payment = StellarSdk.Operation.payment({
        destination: params.destination,
        asset: StellarSdk.Asset.native(),
        amount: this.stroopsToXlm(params.amount),
      });

      // Build transaction
      const transactionBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      }).addOperation(payment);

      // Add memo if provided
      if (params.memo) {
        transactionBuilder.addMemo(StellarSdk.Memo.text(params.memo));
      }

      const transaction = transactionBuilder.setTimeout(30).build();

      return transaction;
    } catch (error) {
      console.error('Failed to create payment:', error);
      throw new Error('Failed to create payment transaction');
    }
  }

  /**
   * Sign transaction using connected wallet
   * 
   * @param transaction - Transaction to sign
   * @returns Signed transaction
   */
  async signTransaction(transaction: StellarSdk.Transaction): Promise<StellarSdk.Transaction> {
    try {
      const provider = this.walletService.getCurrentProvider();
      
      if (!provider) {
        throw new Error('No wallet connected');
      }

      // Get transaction XDR
      const xdr = transaction.toXDR();

      // Sign with wallet
      const signedXdr = await provider.signTransaction(xdr);

      // Parse signed transaction
      const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
        signedXdr,
        this.networkPassphrase
      ) as StellarSdk.Transaction;

      return signedTransaction;
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      
      if (error instanceof Error && error.message.includes('rejected')) {
        throw new Error('Transaction rejected by user');
      }
      
      throw new Error('Failed to sign transaction');
    }
  }

  /**
   * Submit signed transaction to network
   * 
   * @param transaction - Signed transaction
   * @returns Transaction status
   */
  async submitTransaction(transaction: StellarSdk.Transaction): Promise<TransactionStatus> {
    try {
      const result = await this.server.submitTransaction(transaction);

      return {
        hash: result.hash,
        status: 'confirmed',
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Failed to submit transaction:', error);

      // Try to get transaction hash even on failure
      let hash = '';
      try {
        hash = transaction.hash().toString('hex');
      } catch {
        hash = 'unknown';
      }

      if (error instanceof Error) {
        return {
          hash,
          status: 'failed',
          error: error.message,
          timestamp: Date.now(),
        };
      }

      return {
        hash,
        status: 'failed',
        error: 'Transaction submission failed',
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Poll for transaction confirmation
   * 
   * @param hash - Transaction hash
   * @param maxAttempts - Maximum polling attempts (default: 10)
   * @param interval - Polling interval in ms (default: 2000)
   * @returns Transaction status
   */
  async pollTransactionStatus(
    hash: string,
    maxAttempts: number = 10,
    interval: number = 2000
  ): Promise<TransactionStatus> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const transaction = await this.server.transactions().transaction(hash).call();

        if (transaction.successful) {
          return {
            hash,
            status: 'confirmed',
            timestamp: Date.now(),
          };
        } else {
          return {
            hash,
            status: 'failed',
            error: 'Transaction failed',
            timestamp: Date.now(),
          };
        }
      } catch (error) {
        // Transaction not found yet, continue polling
        if (attempt < maxAttempts - 1) {
          await this.sleep(interval);
        }
      }
    }

    // Timeout
    return {
      hash,
      status: 'pending',
      error: 'Transaction confirmation timeout',
      timestamp: Date.now(),
    };
  }

  /**
   * Create and execute a trading operation
   * 
   * @param operation - Trading operation details
   * @returns Transaction status
   */
  async executeTrade(operation: TradingOperation): Promise<TransactionStatus> {
    try {
      const walletState = this.walletService.getState();
      
      if (!walletState.isConnected || !walletState.connection) {
        throw new Error('Wallet not connected');
      }

      // Validate against credit limits
      const isValid = await this.validateTransaction(
        operation.agentDid,
        operation.amount,
        operation.type
      );

      if (!isValid) {
        throw new Error(`Transaction exceeds ${operation.type} limit`);
      }

      // Create payment transaction
      // For trading operations, we'll create a payment to the agent
      const transaction = await this.createPayment({
        source: walletState.connection.publicKey,
        destination: operation.agentDid,
        amount: operation.amount,
        memo: `${operation.type.toUpperCase()}_${operation.asset || 'XLM'}`,
      });

      // Sign transaction
      const signedTransaction = await this.signTransaction(transaction);

      // Submit transaction
      const status = await this.submitTransaction(signedTransaction);

      // Update credit score on success
      if (status.status === 'confirmed') {
        try {
          await this.contractService.updateCreditScore(
            operation.agentDid,
            'Success',
            operation.amount
          );
        } catch (error) {
          console.warn('Failed to update credit score:', error);
          // Don't fail the transaction if credit score update fails
        }
      }

      return status;
    } catch (error) {
      console.error('Failed to execute trade:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Failed to execute trade');
    }
  }

  /**
   * Validate transaction against credit limits
   * 
   * @param agentDid - Agent's DID
   * @param amount - Transaction amount in stroops
   * @param type - Transaction type
   * @returns True if transaction is valid
   */
  async validateTransaction(
    agentDid: string,
    amount: string,
    type: string
  ): Promise<boolean> {
    try {
      const limits = await this.contractService.getTransactionLimits(agentDid);
      const amountNum = BigInt(amount);

      switch (type) {
        case 'buy':
          return amountNum <= BigInt(limits.maxBuyAmount);
        case 'sell':
          return amountNum <= BigInt(limits.maxSellAmount);
        case 'swap':
          return amountNum <= BigInt(limits.dailyTransactionLimit);
        default:
          return false;
      }
    } catch (error) {
      console.error('Failed to validate transaction:', error);
      // If we can't get limits, reject the transaction for safety
      return false;
    }
  }

  /**
   * Validate amount is positive, non-zero, and user has sufficient balance
   * 
   * @param amount - Amount in stroops
   * @param userBalance - User's balance in stroops
   * @returns True if amount is valid
   */
  validateAmount(amount: string, userBalance: string): boolean {
    try {
      const amountNum = BigInt(amount);
      const balanceNum = BigInt(userBalance);

      // Check positive and non-zero
      if (amountNum <= BigInt(0)) {
        return false;
      }

      // Check sufficient balance
      if (amountNum > balanceNum) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to validate amount:', error);
      return false;
    }
  }

  /**
   * Validate transaction against credit limits
   * 
   * @param agentDid - Agent's DID
   * @param amount - Transaction amount in stroops
   * @param type - Transaction type (buy, sell, swap)
   * @returns Object with validation result and limit info
   */
  async validateAgainstLimits(
    agentDid: string,
    amount: string,
    type: 'buy' | 'sell' | 'swap'
  ): Promise<{ valid: boolean; limit?: string; message?: string }> {
    try {
      const limits = await this.contractService.getTransactionLimits(agentDid);
      const amountNum = BigInt(amount);

      let limit: string;
      let limitName: string;

      switch (type) {
        case 'buy':
          limit = limits.maxBuyAmount;
          limitName = 'max buy limit';
          break;
        case 'sell':
          limit = limits.maxSellAmount;
          limitName = 'max sell limit';
          break;
        case 'swap':
          limit = limits.dailyTransactionLimit;
          limitName = 'daily transaction limit';
          break;
        default:
          return {
            valid: false,
            message: 'Invalid transaction type',
          };
      }

      const limitNum = BigInt(limit);

      if (amountNum > limitNum) {
        return {
          valid: false,
          limit,
          message: `Transaction exceeds ${limitName}. Max: ${this.stroopsToXlm(limit)} XLM, Attempted: ${this.stroopsToXlm(amount)} XLM`,
        };
      }

      return { valid: true };
    } catch (error) {
      console.error('Failed to validate against limits:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return {
          valid: false,
          message: 'Credit profile not found. Please initialize profile first.',
        };
      }
      
      return {
        valid: false,
        message: 'Failed to validate transaction limits',
      };
    }
  }

  /**
   * Convert stroops to XLM
   * 
   * @param stroops - Amount in stroops
   * @returns Amount in XLM as string
   */
  private stroopsToXlm(stroops: string): string {
    const stroopsNum = BigInt(stroops);
    const xlm = Number(stroopsNum) / 10_000_000;
    return xlm.toFixed(7);
  }

  /**
   * Sleep for specified milliseconds
   * 
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
