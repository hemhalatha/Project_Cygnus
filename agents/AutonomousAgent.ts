/**
 * Autonomous Agent
 * 
 * Fully autonomous agent integrating all protocols and logic.
 */

import { AgentRuntime } from './runtime/AgentRuntime.js';
import { CharacterEngine } from './runtime/CharacterEngine.js';
import { MemoryManager } from './runtime/MemoryManager.js';
import { PluginManager } from './runtime/PluginManager.js';
import {
  AgentConfig,
  CharacterConfig,
  TradingOpportunity,
  Decision,
  RiskAssessment,
  TxParams,
  TxResult,
} from './runtime/types.js';

import { StellarClient } from '../src/stellar/StellarClient.js';
import { PolicySigner } from '../src/stellar/PolicySigner.js';

import { DIDManager, CredentialManager, AgentRegistry } from '../protocols/masumi/index.js';
import { SokosumiCoordinator } from '../protocols/sokosumi/index.js';
import { X402Client } from '../protocols/x402/X402Client.js';
import { ChannelManager } from '../protocols/x402-flash/ChannelManager.js';

import {
  OpportunityEvaluator,
  RiskAssessor,
  TransactionExecutor,
  LoanNegotiator,
  TradingManager,
} from './logic/index.js';

import { DID, AgentMetadata } from '../protocols/masumi/types.js';

/**
 * Autonomous Agent - fully integrated agent
 */
export class AutonomousAgent {
  // Core components
  private runtime: AgentRuntime;
  private characterEngine: CharacterEngine;
  private memoryManager: MemoryManager;
  private pluginManager: PluginManager;

  // Blockchain
  private stellarClient: StellarClient;
  private policySigner: PolicySigner;

  // Identity & Coordination
  private didManager: DIDManager;
  private credentialManager: CredentialManager;
  private agentRegistry: AgentRegistry;
  private coordinator: SokosumiCoordinator;

  // Payments
  private x402Client: X402Client;
  private channelManager: ChannelManager;

  // Logic
  private opportunityEvaluator: OpportunityEvaluator;
  private riskAssessor: RiskAssessor;
  private transactionExecutor: TransactionExecutor;
  private loanNegotiator: LoanNegotiator;
  private tradingManager: TradingManager;

  // State
  private myDID?: DID;
  private isInitialized: boolean = false;
  private isRunning: boolean = false;

  constructor(
    config: AgentConfig,
    stellarClient: StellarClient,
    didManager: DIDManager,
    coordinator: SokosumiCoordinator
  ) {
    // Initialize core components
    this.stellarClient = stellarClient;
    this.didManager = didManager;
    this.coordinator = coordinator;

    // Initialize runtime components
    this.memoryManager = new MemoryManager('./data/memory');
    this.pluginManager = new PluginManager();
    this.characterEngine = new CharacterEngine();
    this.runtime = new AgentRuntime(
      config,
      this.characterEngine,
      this.memoryManager,
      this.pluginManager,
      stellarClient
    );

    // Initialize policy signer
    this.policySigner = new PolicySigner();

    // Initialize credential manager and registry
    this.credentialManager = new CredentialManager(
      { didMethod: 'stellar', trustedIssuers: [], stellarNetwork: config.stellarNetwork },
      didManager
    );
    this.agentRegistry = new AgentRegistry(
      { didMethod: 'stellar', trustedIssuers: [], stellarNetwork: config.stellarNetwork },
      stellarClient
    );

    // Initialize payment components
    this.channelManager = new ChannelManager(
      {
        stellarNetwork: config.stellarNetwork,
        defaultTimeout: 3600,
        maxChannelCapacity: 10000,
        minChannelCapacity: 1,
      },
      stellarClient,
      config.publicKey!,
      config.secretKey!
    );

    this.x402Client = new X402Client(
      {
        stellarNetwork: config.stellarNetwork,
        secretKey: config.secretKey,
        preferChannels: true,
        paymentTimeout: 60000,
      },
      stellarClient,
      this.channelManager
    );

    // Load character
    const character = this.loadCharacter(config.characterFile);

    // Initialize logic components
    this.opportunityEvaluator = new OpportunityEvaluator(character);
    this.riskAssessor = new RiskAssessor(character);
    this.transactionExecutor = new TransactionExecutor(
      stellarClient,
      this.policySigner,
      this.memoryManager,
      config.spendingLimits,
      config.publicKey!,
      config.secretKey!
    );
    this.loanNegotiator = new LoanNegotiator(
      character,
      coordinator,
      stellarClient,
      '', // Will be set after DID creation
      config.secretKey!
    );
    this.tradingManager = new TradingManager(
      character,
      coordinator,
      stellarClient,
      '', // Will be set after DID creation
      config.secretKey!
    );
  }

  /**
   * Initialize agent
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Initialize runtime
    await this.runtime.initialize();

    // Create DID
    const publicKey = this.runtime.getConfig().publicKey!;
    const didDocument = await this.didManager.createDID(publicKey);
    this.myDID = didDocument.id;

    // Register agent
    const metadata: AgentMetadata = {
      name: this.characterEngine.getCharacter().name,
      description: `Autonomous agent with ${this.characterEngine.getCharacter().tradingStrategy.buySignals.length} trading strategies`,
      capabilities: ['trading', 'lending', 'borrowing'],
      endpoints: {
        x402: 'https://agent.example.com/x402',
        sokosumi: 'https://agent.example.com/sokosumi',
      },
      reputation: {
        score: 500,
        reviews: 0,
        successRate: 1.0,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.agentRegistry.registerAgent(
      this.myDID,
      metadata,
      publicKey,
      this.runtime.getConfig().secretKey!
    );

    // Advertise services
    await this.coordinator.advertiseService({
      serviceId: `${this.myDID}-trading`,
      agentDID: this.myDID,
      serviceType: 'trading',
      endpoint: metadata.endpoints.x402!,
      pricing: { type: 'dynamic', dynamicFactors: ['market', 'reputation'] },
      capabilities: metadata.capabilities,
      availability: {
        status: 'available',
        capacity: 100,
        currentLoad: 0,
        responseTime: 100,
      },
    });

    this.isInitialized = true;
  }

  /**
   * Start agent
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    await this.runtime.start();
    this.isRunning = true;

    // Start autonomous loops
    this.startOpportunityDiscovery();
    this.startLoanMonitoring();
    this.startEscrowMonitoring();
  }

  /**
   * Stop agent
   */
  async stop(): Promise<void> {
    await this.runtime.stop();
    this.isRunning = false;
  }

  /**
   * Evaluate opportunity
   */
  async evaluateOpportunity(opportunity: TradingOpportunity): Promise<Decision> {
    // Get counterparty info if available
    let reputation = null;
    let metadata = null;

    if (opportunity.counterparty) {
      reputation = await this.coordinator.getReputation(opportunity.counterparty);
      const registryEntry = await this.agentRegistry.lookupAgent(opportunity.counterparty);
      metadata = registryEntry?.metadata || null;
    }

    // Evaluate opportunity
    return await this.opportunityEvaluator.evaluateOpportunity(opportunity, {
      counterpartyReputation: reputation || undefined,
      counterpartyMetadata: metadata || undefined,
    });
  }

  /**
   * Assess risk
   */
  async assessRisk(
    counterpartyDID: DID,
    transactionAmount: number
  ): Promise<RiskAssessment> {
    const reputation = await this.coordinator.getReputation(counterpartyDID);
    const registryEntry = await this.agentRegistry.lookupAgent(counterpartyDID);
    const metadata = registryEntry?.metadata || null;

    return await this.riskAssessor.assessRisk(
      counterpartyDID,
      reputation,
      metadata,
      transactionAmount
    );
  }

  /**
   * Execute transaction
   */
  async executeTransaction(params: TxParams): Promise<TxResult> {
    return await this.transactionExecutor.executeTransaction(params);
  }

  /**
   * Get loan
   */
  async getLoan(amount: number, collateral: number) {
    const lenders = await this.loanNegotiator.searchLenders(amount);
    
    if (lenders.length === 0) {
      return null;
    }

    // Try first lender
    return await this.loanNegotiator.negotiateLoan(
      lenders[0],
      amount,
      collateral
    );
  }

  /**
   * Buy item
   */
  async buyItem(item: string, quantity: number, maxPrice: number) {
    const sellers = await this.tradingManager.searchSellers(item);
    
    if (sellers.length === 0) {
      return null;
    }

    // Try first seller
    return await this.tradingManager.initiateBuy(sellers[0], {
      item,
      quantity,
      price: maxPrice,
      deliveryTerms: 'Standard delivery',
      deliveryDeadline: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  /**
   * Sell item
   */
  async sellItem(item: string, quantity: number, price: number) {
    const buyers = await this.tradingManager.searchBuyers(item);
    
    if (buyers.length === 0) {
      return null;
    }

    // Try first buyer
    return await this.tradingManager.initiateSell(buyers[0], {
      item,
      quantity,
      price,
      deliveryTerms: 'Standard delivery',
      deliveryDeadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      did: this.myDID,
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      balance: 0, // Would query from Stellar
      activeLoans: this.loanNegotiator.getActiveLoans().length,
      activeEscrows: this.tradingManager.getActiveEscrows().length,
      spending: this.transactionExecutor.getSpendingStatus(),
    };
  }

  // Private methods

  /**
   * Load character configuration
   */
  private loadCharacter(characterFile: string): CharacterConfig {
    // In production, load from file
    // For now, return default
    return {
      name: 'Autonomous Trader',
      personality: {
        riskTolerance: 0.6,
        negotiationStyle: 'balanced',
        learningRate: 0.1,
      },
      economicGoals: {
        targetReturn: 10,
        maxLossThreshold: 5,
        preferredAssets: ['XLM', 'USDC'],
      },
      tradingStrategy: {
        buySignals: [
          { indicator: 'price_momentum', threshold: 0.7, weight: 0.4 },
          { indicator: 'volume', threshold: 0.6, weight: 0.3 },
        ],
        sellSignals: [
          { indicator: 'price_momentum', threshold: 0.3, weight: 0.4 },
        ],
        positionSizing: 'proportional',
      },
      lendingStrategy: {
        minCreditScore: 600,
        maxLoanToValue: 0.7,
        preferredDuration: 30 * 24 * 60 * 60, // 30 days
        interestRateModel: {
          baseRate: 500, // 5%
          creditScoreMultiplier: 0.5,
          durationMultiplier: 0.1,
          collateralDiscount: 0.2,
        },
      },
      spendingLimits: {
        maxSingleTransaction: 1000,
        dailyLimit: 5000,
        weeklyLimit: 20000,
      },
    };
  }

  /**
   * Start opportunity discovery loop
   */
  private startOpportunityDiscovery(): void {
    // In production, this would continuously discover opportunities
    // For now, just a placeholder
  }

  /**
   * Start loan monitoring loop
   */
  private startLoanMonitoring(): void {
    setInterval(async () => {
      if (!this.isRunning) return;

      const duePayments = await this.loanNegotiator.checkDuePayments();
      for (const contractId of duePayments) {
        // Make payment
        const loan = this.loanNegotiator.getLoan(contractId);
        if (loan) {
          await this.loanNegotiator.makeRepayment(contractId, loan.terms.principal / 12);
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Start escrow monitoring loop
   */
  private startEscrowMonitoring(): void {
    setInterval(async () => {
      if (!this.isRunning) return;

      const expired = await this.tradingManager.checkExpiredEscrows();
      for (const contractId of expired) {
        // Request refund
        await this.tradingManager.requestRefund(contractId);
      }
    }, 60000); // Check every minute
  }
}
