/**
 * Memory Manager
 *
 * Manages persistent storage for agent memory including transaction history,
 * decisions, and learned behaviors.
 */
import * as fs from 'fs';
import * as path from 'path';
/**
 * Memory manager for agent persistence
 */
export class MemoryManager {
    memoryPath;
    transactions = new Map();
    decisions = [];
    learnings = [];
    counterpartyHistory = new Map();
    constructor(memoryPath = './data/memory') {
        this.memoryPath = memoryPath;
    }
    /**
     * Initialize memory manager
     */
    async initialize() {
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
    async recordTransaction(tx, outcome) {
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
                this.counterpartyHistory.get(counterparty).push({
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
    async recordDecision(opportunity, decision) {
        const entry = {
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
    async recordLearning(evaluation) {
        this.learnings.push(evaluation);
        await this.save();
    }
    /**
     * Query transaction history
     */
    async queryHistory(filter) {
        const results = [];
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
    async getCounterpartyHistory(counterparty) {
        return this.counterpartyHistory.get(counterparty) || [];
    }
    /**
     * Get recent decisions
     */
    async getRecentDecisions(count = 10) {
        return this.decisions.slice(-count);
    }
    /**
     * Get learnings
     */
    async getLearnings() {
        return [...this.learnings];
    }
    /**
     * Clear all memory
     */
    async clear() {
        this.transactions.clear();
        this.decisions = [];
        this.learnings = [];
        this.counterpartyHistory.clear();
        await this.save();
    }
    /**
     * Flush memory to disk
     */
    async flush() {
        await this.save();
    }
    // Private methods
    /**
     * Load memory from disk
     */
    async load() {
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
        }
        catch (error) {
            console.error('Failed to load memory:', error);
        }
    }
    /**
     * Save memory to disk
     */
    async save() {
        try {
            const transactionsPath = path.join(this.memoryPath, 'transactions.json');
            const decisionsPath = path.join(this.memoryPath, 'decisions.json');
            const learningsPath = path.join(this.memoryPath, 'learnings.json');
            // Convert Map to array for JSON serialization
            const txArray = Array.from(this.transactions.entries());
            fs.writeFileSync(transactionsPath, JSON.stringify(txArray, null, 2));
            fs.writeFileSync(decisionsPath, JSON.stringify(this.decisions, null, 2));
            fs.writeFileSync(learningsPath, JSON.stringify(this.learnings, null, 2));
        }
        catch (error) {
            console.error('Failed to save memory:', error);
        }
    }
    /**
     * Rebuild counterparty history from transactions
     */
    rebuildCounterpartyHistory() {
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
                    this.counterpartyHistory.get(counterparty).push({
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
    generateTxId(tx) {
        return `${tx.sourceAccount}-${tx.seqNum}`;
    }
    /**
     * Generate unique ID
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
//# sourceMappingURL=MemoryManager.js.map