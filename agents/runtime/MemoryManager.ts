/**
 * Memory Manager
 * 
 * Manages persistent storage for agent memory including transaction history,
 * decisions, and learned behaviors.
 */

import {
  Transaction,
  TxOutcome,
  HistoryFilter,
  MemoryEntry,
  TradingOpportunity,
  Decision,
  AgentDID,
  EvaluationResult,
} from './types.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Memory manager for agent persistence
 */
export class MemoryManager {
  private memoryPath: string;
  private transactions: Map<string, { tx: Transaction; outcome: TxOutcome }> = new Map();
  private decisions: MemoryEntry[] = [];
  private learnings: EvaluationResult[] = [];
  private counterpartyHistory: Map<AgentDID, any[]> = new Map();

  constructor(memoryPath: string = './data/memory') {
    this.memoryPath = memoryPath;
  }

  /**
   * Initialize memory manager
   */
  async initialize(): Promise<void> {
    // Create memory directory if it doesn't exist
    if (!fs.existsSync(this.memoryPath)) {
      fs.mkdirSync(this.memoryPath, { recursive: true });
    }

    // Load existing memory
    await this.load();
  }

  /**
   * Record a transaction
   */
  async recordTransaction(tx: Transaction, outcome: TxOutcome): Promise<void> {
    const txId = this.generateTxId(tx);
    this.transactions.set(txId, { tx, outcome });

    // Update counterparty history if applicable
    if (tx.operations.length > 0) {
      const op = tx.operations[0];
      if (op.body.data.destination) {
        const counterparty = op.body.data.destination;
        if (!this.counterpartyHistory.has(counterparty)) {
          this.counterpartyHistory.set(counterparty, []);
        }
        this.counterpartyHistory.get(counterparty)!.push({
          tx,
          outcome,
          timestamp: outcome.timestamp,
        });
      }
    }

    // Persist to disk
    await this.save();
  }

  /**
   * Record a decision
   */
  async recordDecision(opportunity: TradingOpportunity, decision: Decision): Promise<void> {
    const entry: MemoryEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      type: 'decision',
      data: { opportunity, decision },
      tags: [opportunity.type, decision.action],
    };

    this.decisions.push(entry);
    await this.save();
  }

  /**
   * Record a learning
   */
  async recordLearning(evaluation: EvaluationResult): Promise<void> {
    this.learnings.push(evaluation);
    await this.save();
  }

  /**
   * Query transaction history
   */
  async queryHistory(filter: HistoryFilter): Promise<Transaction[]> {
    const results: Transaction[] = [];

    for (const [_, entry] of this.transactions) {
      const { tx, outcome } = entry;

      // Apply filters
      if (filter.startDate && outcome.timestamp < filter.startDate.getTime()) {
        continue;
      }
      if (filter.endDate && outcome.timestamp > filter.endDate.getTime()) {
        continue;
      }
      if (filter.status === 'success' && !outcome.result.success) {
        continue;
      }
      if (filter.status === 'failed' && outcome.result.success) {
        continue;
      }

      results.push(tx);
    }

    return results;
  }

  /**
   * Get counterparty history
   */
  async getCounterpartyHistory(counterparty: AgentDID): Promise<any[]> {
    return this.counterpartyHistory.get(counterparty) || [];
  }

  /**
   * Get recent decisions
   */
  async getRecentDecisions(count: number = 10): Promise<MemoryEntry[]> {
    return this.decisions.slice(-count);
  }

  /**
   * Get learnings
   */
  async getLearnings(): Promise<EvaluationResult[]> {
    return [...this.learnings];
  }

  /**
   * Clear all memory
   */
  async clear(): Promise<void> {
    this.transactions.clear();
    this.decisions = [];
    this.learnings = [];
    this.counterpartyHistory.clear();
    await this.save();
  }

  /**
   * Flush memory to disk
   */
  async flush(): Promise<void> {
    await this.save();
  }

  // Private methods

  /**
   * Load memory from disk
   */
  private async load(): Promise<void> {
    try {
      const transactionsPath = path.join(this.memoryPath, 'transactions.json');
      const decisionsPath = path.join(this.memoryPath, 'decisions.json');
      const learningsPath = path.join(this.memoryPath, 'learnings.json');

      if (fs.existsSync(transactionsPath)) {
        const data = fs.readFileSync(transactionsPath, 'utf-8');
        const txArray = JSON.parse(data);
        this.transactions = new Map(txArray);
      }

      if (fs.existsSync(decisionsPath)) {
        const data = fs.readFileSync(decisionsPath, 'utf-8');
        this.decisions = JSON.parse(data);
      }

      if (fs.existsSync(learningsPath)) {
        const data = fs.readFileSync(learningsPath, 'utf-8');
        this.learnings = JSON.parse(data);
      }

      // Rebuild counterparty history from transactions
      this.rebuildCounterpartyHistory();
    } catch (error) {
      console.error('Failed to load memory:', error);
    }
  }

  /**
   * Save memory to disk
   */
  private async save(): Promise<void> {
    try {
      const transactionsPath = path.join(this.memoryPath, 'transactions.json');
      const decisionsPath = path.join(this.memoryPath, 'decisions.json');
      const learningsPath = path.join(this.memoryPath, 'learnings.json');

      // Convert Map to array for JSON serialization
      const txArray = Array.from(this.transactions.entries());
      fs.writeFileSync(transactionsPath, JSON.stringify(txArray, null, 2));
      fs.writeFileSync(decisionsPath, JSON.stringify(this.decisions, null, 2));
      fs.writeFileSync(learningsPath, JSON.stringify(this.learnings, null, 2));
    } catch (error) {
      console.error('Failed to save memory:', error);
    }
  }

  /**
   * Rebuild counterparty history from transactions
   */
  private rebuildCounterpartyHistory(): void {
    this.counterpartyHistory.clear();

    for (const [_, entry] of this.transactions) {
      const { tx, outcome } = entry;
      if (tx.operations.length > 0) {
        const op = tx.operations[0];
        if (op.body.data.destination) {
          const counterparty = op.body.data.destination;
          if (!this.counterpartyHistory.has(counterparty)) {
            this.counterpartyHistory.set(counterparty, []);
          }
          this.counterpartyHistory.get(counterparty)!.push({
            tx,
            outcome,
            timestamp: outcome.timestamp,
          });
        }
      }
    }
  }

  /**
   * Generate transaction ID
   */
  private generateTxId(tx: Transaction): string {
    return `${tx.sourceAccount}-${tx.seqNum}`;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
