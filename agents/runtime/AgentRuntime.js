/**
 * Agent Runtime
 *
 * Core runtime for autonomous agents with lifecycle management,
 * plugin coordination, and decision-making capabilities.
 */
import { MemoryManager } from './MemoryManager.js';
import { PluginManager } from './PluginManager.js';
import { CharacterEngine } from './CharacterEngine.js';
import * as fs from 'fs';
/**
 * Main agent runtime class
 */
export class AgentRuntime {
    config;
    character = null;
    memoryManager;
    pluginManager;
    characterEngine;
    state;
    providers = new Map();
    actions = new Map();
    evaluators = new Map();
    constructor(config) {
        this.config = config;
        this.memoryManager = new MemoryManager();
        this.pluginManager = new PluginManager();
        this.characterEngine = new CharacterEngine();
        this.state = {
            isRunning: false,
            balance: 0,
            creditScore: 500,
            transactionCount: 0,
            lastActivity: Date.now(),
            activeLoans: 0,
            activeEscrows: 0,
        };
    }
    /**
     * Initialize the agent runtime
     */
    async initialize() {
        console.log('Initializing Agent Runtime...');
        // Load character configuration
        this.character = await this.loadCharacter(this.config.characterFile);
        console.log(`Character loaded: ${this.character.name}`);
        // Initialize character engine
        await this.characterEngine.initialize(this.character);
        // Initialize memory manager
        await this.memoryManager.initialize();
        // Load and initialize plugins
        for (const pluginConfig of this.config.plugins) {
            if (pluginConfig.enabled) {
                await this.pluginManager.loadPlugin(pluginConfig, this);
            }
        }
        console.log('Agent Runtime initialized successfully');
    }
    /**
     * Start the agent
     */
    async start() {
        if (this.state.isRunning) {
            throw new Error('Agent is already running');
        }
        console.log('Starting agent...');
        this.state.isRunning = true;
        this.state.lastActivity = Date.now();
        // Start plugins
        await this.pluginManager.startAll();
        console.log('Agent started successfully');
    }
    /**
     * Stop the agent
     */
    async stop() {
        if (!this.state.isRunning) {
            throw new Error('Agent is not running');
        }
        console.log('Stopping agent...');
        this.state.isRunning = false;
        // Stop plugins
        await this.pluginManager.stopAll();
        // Save memory
        await this.memoryManager.flush();
        console.log('Agent stopped successfully');
    }
    /**
     * Evaluate a trading opportunity
     */
    async evaluateOpportunity(opportunity) {
        if (!this.character) {
            throw new Error('Character not loaded');
        }
        // Compose state from providers
        const state = await this.composeState();
        // Use character engine to make decision
        const decision = await this.characterEngine.evaluateOpportunity(opportunity, state, this.character);
        // Record decision in memory
        await this.memoryManager.recordDecision(opportunity, decision);
        return decision;
    }
    /**
     * Assess risk for a counterparty
     */
    async assessRisk(counterparty) {
        if (!this.character) {
            throw new Error('Character not loaded');
        }
        // Get counterparty history from memory
        const history = await this.memoryManager.getCounterpartyHistory(counterparty);
        // Use character engine to assess risk
        const assessment = await this.characterEngine.assessRisk(counterparty, history, this.character);
        return assessment;
    }
    /**
     * Construct a transaction
     */
    async constructTransaction(params) {
        // Validate spending limits
        if (params.amount) {
            this.validateSpendingLimits(params.amount);
        }
        // Use Stellar client to construct transaction
        // This will be implemented by the Stellar SDK integration
        throw new Error('Transaction construction not yet implemented');
    }
    /**
     * Sign a transaction
     */
    async signTransaction(tx) {
        // Use policy signer to sign transaction
        // This will be implemented by the Policy Signer module
        throw new Error('Transaction signing not yet implemented');
    }
    /**
     * Broadcast a transaction
     */
    async broadcastTransaction(signedTx) {
        // Use Stellar client to broadcast transaction
        // This will be implemented by the Stellar SDK integration
        throw new Error('Transaction broadcasting not yet implemented');
    }
    /**
     * Record a transaction in memory
     */
    async recordTransaction(tx, outcome) {
        await this.memoryManager.recordTransaction(tx, outcome);
        // Update state
        this.state.transactionCount++;
        this.state.lastActivity = Date.now();
        // Run evaluators
        for (const evaluator of this.evaluators.values()) {
            const evaluation = await evaluator.evaluate(outcome);
            if (evaluation.shouldLearn) {
                await this.memoryManager.recordLearning(evaluation);
            }
        }
    }
    /**
     * Query transaction history
     */
    async queryHistory(filter) {
        return await this.memoryManager.queryHistory(filter);
    }
    /**
     * Get current agent state
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Register a provider
     */
    registerProvider(provider) {
        this.providers.set(provider.name, provider);
    }
    /**
     * Register an action
     */
    registerAction(action) {
        this.actions.set(action.name, action);
    }
    /**
     * Register an evaluator
     */
    registerEvaluator(evaluator) {
        this.evaluators.set(evaluator.name, evaluator);
    }
    /**
     * Execute an action
     */
    async executeAction(actionName, params) {
        const action = this.actions.get(actionName);
        if (!action) {
            throw new Error(`Action not found: ${actionName}`);
        }
        if (!action.validate(params)) {
            throw new Error(`Invalid parameters for action: ${actionName}`);
        }
        return await action.execute(params);
    }
    /**
     * Get character configuration
     */
    getCharacter() {
        return this.character;
    }
    /**
     * Get memory manager
     */
    getMemoryManager() {
        return this.memoryManager;
    }
    // Private methods
    /**
     * Load character configuration from file
     */
    async loadCharacter(filePath) {
        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            const character = JSON.parse(data);
            // Validate character configuration
            this.validateCharacter(character);
            return character;
        }
        catch (error) {
            throw new Error(`Failed to load character: ${error}`);
        }
    }
    /**
     * Validate character configuration
     */
    validateCharacter(character) {
        if (!character.name) {
            throw new Error('Character name is required');
        }
        if (!character.personality) {
            throw new Error('Character personality is required');
        }
        if (character.personality.riskTolerance < 0 || character.personality.riskTolerance > 1) {
            throw new Error('Risk tolerance must be between 0 and 1');
        }
    }
    /**
     * Compose state from all providers
     */
    async composeState() {
        const state = {
            agent: this.state,
            character: this.character,
        };
        for (const [name, provider] of this.providers) {
            try {
                state[name] = await provider.getData();
            }
            catch (error) {
                console.error(`Failed to get data from provider ${name}:`, error);
            }
        }
        return state;
    }
    /**
     * Validate spending limits
     */
    validateSpendingLimits(amount) {
        if (!this.character) {
            throw new Error('Character not loaded');
        }
        const limits = this.character.spendingLimits;
        if (amount > limits.maxSingleTransaction) {
            throw new Error(`Transaction amount exceeds single transaction limit: ${limits.maxSingleTransaction}`);
        }
        // Check daily and weekly limits
        // This would require tracking recent transactions
        // Implementation depends on memory manager
    }
}
//# sourceMappingURL=AgentRuntime.js.map