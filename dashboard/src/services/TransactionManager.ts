import { TransactionStatus } from '../types';

/**
 * TransactionManager service for managing multiple concurrent transactions
 * 
 * Tracks transaction queue, status updates, and transaction history
 * 
 * Requirements: 8.7
 */

export interface ManagedTransaction extends TransactionStatus {
  id: string;
  type: 'payment' | 'trade' | 'loan' | 'repayment' | 'liquidation';
  description: string;
  createdAt: number;
}

export class TransactionManager {
  private transactions: Map<string, ManagedTransaction>;
  private listeners: Set<(transactions: ManagedTransaction[]) => void>;
  private nextId: number;

  constructor() {
    this.transactions = new Map();
    this.listeners = new Set();
    this.nextId = 1;
  }

  /**
   * Register a new transaction
   * 
   * @param type - Transaction type
   * @param description - Human-readable description
   * @param status - Initial transaction status
   * @returns Transaction ID
   */
  registerTransaction(
    type: ManagedTransaction['type'],
    description: string,
    status: TransactionStatus
  ): string {
    const id = `tx_${this.nextId++}`;
    
    const transaction: ManagedTransaction = {
      id,
      type,
      description,
      ...status,
      createdAt: Date.now(),
    };

    this.transactions.set(id, transaction);
    this.notifyListeners();

    return id;
  }

  /**
   * Update transaction status
   * 
   * @param id - Transaction ID
   * @param status - Updated status
   */
  updateTransaction(id: string, status: Partial<TransactionStatus>): void {
    const transaction = this.transactions.get(id);
    
    if (!transaction) {
      console.warn(`Transaction ${id} not found`);
      return;
    }

    this.transactions.set(id, {
      ...transaction,
      ...status,
      timestamp: Date.now(),
    });

    this.notifyListeners();
  }

  /**
   * Get transaction by ID
   * 
   * @param id - Transaction ID
   * @returns Transaction or undefined
   */
  getTransaction(id: string): ManagedTransaction | undefined {
    return this.transactions.get(id);
  }

  /**
   * Get all transactions
   * 
   * @returns Array of all transactions
   */
  getAllTransactions(): ManagedTransaction[] {
    return Array.from(this.transactions.values()).sort(
      (a, b) => b.createdAt - a.createdAt
    );
  }

  /**
   * Get active transactions (pending or recently completed)
   * 
   * @param maxAge - Maximum age in milliseconds (default: 5 minutes)
   * @returns Array of active transactions
   */
  getActiveTransactions(maxAge: number = 5 * 60 * 1000): ManagedTransaction[] {
    const now = Date.now();
    
    return this.getAllTransactions().filter(tx => {
      // Include pending transactions
      if (tx.status === 'pending') {
        return true;
      }
      
      // Include recently completed/failed transactions
      const age = now - tx.timestamp;
      return age < maxAge;
    });
  }

  /**
   * Get transactions by type
   * 
   * @param type - Transaction type
   * @returns Array of transactions of specified type
   */
  getTransactionsByType(type: ManagedTransaction['type']): ManagedTransaction[] {
    return this.getAllTransactions().filter(tx => tx.type === type);
  }

  /**
   * Get transactions by status
   * 
   * @param status - Transaction status
   * @returns Array of transactions with specified status
   */
  getTransactionsByStatus(status: TransactionStatus['status']): ManagedTransaction[] {
    return this.getAllTransactions().filter(tx => tx.status === status);
  }

  /**
   * Get transaction history (completed and failed transactions)
   * 
   * @param limit - Maximum number of transactions to return
   * @returns Array of historical transactions
   */
  getTransactionHistory(limit: number = 50): ManagedTransaction[] {
    return this.getAllTransactions()
      .filter(tx => tx.status === 'confirmed' || tx.status === 'failed')
      .slice(0, limit);
  }

  /**
   * Remove transaction from tracking
   * 
   * @param id - Transaction ID
   */
  removeTransaction(id: string): void {
    this.transactions.delete(id);
    this.notifyListeners();
  }

  /**
   * Clear old transactions
   * 
   * @param maxAge - Maximum age in milliseconds (default: 1 hour)
   */
  clearOldTransactions(maxAge: number = 60 * 60 * 1000): void {
    const now = Date.now();
    const toRemove: string[] = [];

    this.transactions.forEach((tx, id) => {
      // Only clear completed/failed transactions
      if (tx.status !== 'pending') {
        const age = now - tx.timestamp;
        if (age > maxAge) {
          toRemove.push(id);
        }
      }
    });

    toRemove.forEach(id => this.transactions.delete(id));
    
    if (toRemove.length > 0) {
      this.notifyListeners();
    }
  }

  /**
   * Clear all transactions
   */
  clearAllTransactions(): void {
    this.transactions.clear();
    this.notifyListeners();
  }

  /**
   * Subscribe to transaction updates
   * 
   * @param listener - Callback function
   * @returns Unsubscribe function
   */
  subscribe(listener: (transactions: ManagedTransaction[]) => void): () => void {
    this.listeners.add(listener);
    
    // Immediately call with current state
    listener(this.getAllTransactions());

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of transaction updates
   */
  private notifyListeners(): void {
    const transactions = this.getAllTransactions();
    this.listeners.forEach(listener => listener(transactions));
  }

  /**
   * Get transaction statistics
   * 
   * @returns Transaction statistics
   */
  getStatistics(): {
    total: number;
    pending: number;
    confirmed: number;
    failed: number;
    byType: Record<ManagedTransaction['type'], number>;
  } {
    const transactions = this.getAllTransactions();
    
    const stats = {
      total: transactions.length,
      pending: 0,
      confirmed: 0,
      failed: 0,
      byType: {
        payment: 0,
        trade: 0,
        loan: 0,
        repayment: 0,
        liquidation: 0,
      } as Record<ManagedTransaction['type'], number>,
    };

    transactions.forEach(tx => {
      // Count by status
      if (tx.status === 'pending') stats.pending++;
      else if (tx.status === 'confirmed') stats.confirmed++;
      else if (tx.status === 'failed') stats.failed++;

      // Count by type
      stats.byType[tx.type]++;
    });

    return stats;
  }
}

// Singleton instance
let transactionManagerInstance: TransactionManager | null = null;

/**
 * Get the singleton TransactionManager instance
 */
export function getTransactionManager(): TransactionManager {
  if (!transactionManagerInstance) {
    transactionManagerInstance = new TransactionManager();
  }
  return transactionManagerInstance;
}
