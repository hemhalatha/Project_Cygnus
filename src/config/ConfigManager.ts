/**
 * Configuration Management System
 * 
 * Provides environment-specific configuration loading and validation
 * with support for testnet and mainnet environments.
 */

import * as fs from 'fs';
import * as path from 'path';

export type Environment = 'testnet' | 'mainnet' | 'development';

export interface StellarConfig {
  networkPassphrase: string;
  horizonUrl: string;
  sorobanRpcUrl: string;
  friendbotUrl?: string;
}

export interface AgentConfig {
  maxConcurrentOperations: number;
  opportunityCheckInterval: number; // ms
  loanMonitoringInterval: number; // ms
  escrowMonitoringInterval: number; // ms
  defaultRiskTolerance: number; // 0-1
}

export interface PaymentConfig {
  x402: {
    serverPort: number;
    timeout: number; // ms
    maxPaymentAge: number; // ms
  };
  channels: {
    defaultTimeout: number; // seconds
    minDeposit: number; // stroops
    maxChannels: number;
  };
}

export interface SecurityConfig {
  rateLimiting: {
    enabled: boolean;
    maxRequests: number;
    windowMs: number;
  };
  circuitBreaker: {
    enabled: boolean;
    failureThreshold: number;
    timeout: number; // ms
  };
  encryption: {
    algorithm: string;
    keyLength: number;
  };
}

export interface MonitoringConfig {
  metricsEnabled: boolean;
  metricsInterval: number; // ms
  alerting: {
    enabled: boolean;
    criticalThreshold: number;
    alertEndpoint?: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    directory: string;
    maxFileSize: number; // bytes
    maxFiles: number;
  };
}

export interface SystemConfig {
  environment: Environment;
  stellar: StellarConfig;
  agent: AgentConfig;
  payment: PaymentConfig;
  security: SecurityConfig;
  monitoring: MonitoringConfig;
}

export class ConfigManager {
  private config: SystemConfig | null = null;
  private configPath: string;

  constructor(environment?: Environment) {
    const env = environment || this.detectEnvironment();
    this.configPath = this.getConfigPath(env);
  }

  /**
   * Load configuration
   */
  async load(): Promise<SystemConfig> {
    // Try to load from file
    if (fs.existsSync(this.configPath)) {
      const fileContent = fs.readFileSync(this.configPath, 'utf-8');
      const fileConfig = JSON.parse(fileContent);
      this.config = this.mergeWithDefaults(fileConfig);
    } else {
      // Use defaults
      this.config = this.getDefaultConfig();
    }

    // Override with environment variables
    this.applyEnvironmentVariables();

    // Validate configuration
    this.validate();

    console.log(
      `[ConfigManager] Configuration loaded for ${this.config.environment}`
    );

    return this.config;
  }

  /**
   * Get configuration
   */
  get(): SystemConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    return this.config;
  }

  /**
   * Get Stellar configuration
   */
  getStellar(): StellarConfig {
    return this.get().stellar;
  }

  /**
   * Get agent configuration
   */
  getAgent(): AgentConfig {
    return this.get().agent;
  }

  /**
   * Get payment configuration
   */
  getPayment(): PaymentConfig {
    return this.get().payment;
  }

  /**
   * Get security configuration
   */
  getSecurity(): SecurityConfig {
    return this.get().security;
  }

  /**
   * Get monitoring configuration
   */
  getMonitoring(): MonitoringConfig {
    return this.get().monitoring;
  }

  /**
   * Save configuration to file
   */
  async save(config?: SystemConfig): Promise<void> {
    const configToSave = config || this.config;
    if (!configToSave) {
      throw new Error('No configuration to save');
    }

    const configDir = path.dirname(this.configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(
      this.configPath,
      JSON.stringify(configToSave, null, 2),
      'utf-8'
    );

    console.log(`[ConfigManager] Configuration saved to ${this.configPath}`);
  }

  /**
   * Validate configuration
   */
  private validate(): void {
    if (!this.config) {
      throw new Error('Configuration is null');
    }

    const config = this.config;

    // Validate Stellar config
    if (!config.stellar.networkPassphrase) {
      throw new Error('Stellar network passphrase is required');
    }
    if (!config.stellar.horizonUrl) {
      throw new Error('Stellar Horizon URL is required');
    }
    if (!config.stellar.sorobanRpcUrl) {
      throw new Error('Soroban RPC URL is required');
    }

    // Validate agent config
    if (config.agent.maxConcurrentOperations <= 0) {
      throw new Error('Max concurrent operations must be positive');
    }
    if (
      config.agent.defaultRiskTolerance < 0 ||
      config.agent.defaultRiskTolerance > 1
    ) {
      throw new Error('Default risk tolerance must be between 0 and 1');
    }

    // Validate payment config
    if (config.payment.x402.serverPort <= 0 || config.payment.x402.serverPort > 65535) {
      throw new Error('Invalid x402 server port');
    }
    if (config.payment.channels.minDeposit <= 0) {
      throw new Error('Minimum channel deposit must be positive');
    }

    console.log('[ConfigManager] Configuration validated successfully');
  }

  /**
   * Detect environment from NODE_ENV
   */
  private detectEnvironment(): Environment {
    const nodeEnv = process.env.NODE_ENV;
    const stellarNetwork = process.env.STELLAR_NETWORK;

    if (stellarNetwork === 'mainnet') return 'mainnet';
    if (stellarNetwork === 'testnet') return 'testnet';
    if (nodeEnv === 'production') return 'mainnet';
    if (nodeEnv === 'test') return 'testnet';

    return 'development';
  }

  /**
   * Get configuration file path
   */
  private getConfigPath(environment: Environment): string {
    const configDir = process.env.CONFIG_DIR || './config';
    return path.join(configDir, `${environment}.json`);
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): SystemConfig {
    const env = this.detectEnvironment();

    return {
      environment: env,
      stellar: this.getDefaultStellarConfig(env),
      agent: {
        maxConcurrentOperations: 10,
        opportunityCheckInterval: 30000, // 30 seconds
        loanMonitoringInterval: 60000, // 1 minute
        escrowMonitoringInterval: 60000, // 1 minute
        defaultRiskTolerance: 0.5,
      },
      payment: {
        x402: {
          serverPort: 3402,
          timeout: 30000, // 30 seconds
          maxPaymentAge: 86400000, // 24 hours
        },
        channels: {
          defaultTimeout: 3600, // 1 hour
          minDeposit: 1000000, // 0.1 XLM
          maxChannels: 100,
        },
      },
      security: {
        rateLimiting: {
          enabled: true,
          maxRequests: 100,
          windowMs: 60000, // 1 minute
        },
        circuitBreaker: {
          enabled: true,
          failureThreshold: 5,
          timeout: 60000, // 1 minute
        },
        encryption: {
          algorithm: 'aes-256-gcm',
          keyLength: 32,
        },
      },
      monitoring: {
        metricsEnabled: true,
        metricsInterval: 60000, // 1 minute
        alerting: {
          enabled: env === 'mainnet',
          criticalThreshold: 0.9,
        },
        logging: {
          level: env === 'development' ? 'debug' : 'info',
          directory: './logs',
          maxFileSize: 10485760, // 10MB
          maxFiles: 10,
        },
      },
    };
  }

  /**
   * Get default Stellar configuration for environment
   */
  private getDefaultStellarConfig(environment: Environment): StellarConfig {
    switch (environment) {
      case 'mainnet':
        return {
          networkPassphrase: 'Public Global Stellar Network ; September 2015',
          horizonUrl: 'https://horizon.stellar.org',
          sorobanRpcUrl: 'https://soroban-rpc.stellar.org',
        };

      case 'testnet':
        return {
          networkPassphrase: 'Test SDF Network ; September 2015',
          horizonUrl: 'https://horizon-testnet.stellar.org',
          sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
          friendbotUrl: 'https://friendbot.stellar.org',
        };

      case 'development':
      default:
        return {
          networkPassphrase: 'Test SDF Network ; September 2015',
          horizonUrl: 'https://horizon-testnet.stellar.org',
          sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
          friendbotUrl: 'https://friendbot.stellar.org',
        };
    }
  }

  /**
   * Merge file config with defaults
   */
  private mergeWithDefaults(fileConfig: Partial<SystemConfig>): SystemConfig {
    const defaults = this.getDefaultConfig();
    return {
      ...defaults,
      ...fileConfig,
      stellar: { ...defaults.stellar, ...fileConfig.stellar },
      agent: { ...defaults.agent, ...fileConfig.agent },
      payment: {
        x402: { ...defaults.payment.x402, ...fileConfig.payment?.x402 },
        channels: {
          ...defaults.payment.channels,
          ...fileConfig.payment?.channels,
        },
      },
      security: {
        rateLimiting: {
          ...defaults.security.rateLimiting,
          ...fileConfig.security?.rateLimiting,
        },
        circuitBreaker: {
          ...defaults.security.circuitBreaker,
          ...fileConfig.security?.circuitBreaker,
        },
        encryption: {
          ...defaults.security.encryption,
          ...fileConfig.security?.encryption,
        },
      },
      monitoring: {
        ...defaults.monitoring,
        ...fileConfig.monitoring,
        alerting: {
          ...defaults.monitoring.alerting,
          ...fileConfig.monitoring?.alerting,
        },
        logging: {
          ...defaults.monitoring.logging,
          ...fileConfig.monitoring?.logging,
        },
      },
    };
  }

  /**
   * Apply environment variables
   */
  private applyEnvironmentVariables(): void {
    if (!this.config) return;

    // Stellar configuration
    if (process.env.STELLAR_NETWORK_PASSPHRASE) {
      this.config.stellar.networkPassphrase =
        process.env.STELLAR_NETWORK_PASSPHRASE;
    }
    if (process.env.STELLAR_HORIZON_URL) {
      this.config.stellar.horizonUrl = process.env.STELLAR_HORIZON_URL;
    }
    if (process.env.STELLAR_SOROBAN_RPC_URL) {
      this.config.stellar.sorobanRpcUrl = process.env.STELLAR_SOROBAN_RPC_URL;
    }

    // Payment configuration
    if (process.env.X402_SERVER_PORT) {
      this.config.payment.x402.serverPort = parseInt(
        process.env.X402_SERVER_PORT,
        10
      );
    }

    // Security configuration
    if (process.env.RATE_LIMITING_ENABLED) {
      this.config.security.rateLimiting.enabled =
        process.env.RATE_LIMITING_ENABLED === 'true';
    }

    // Monitoring configuration
    if (process.env.LOG_LEVEL) {
      this.config.monitoring.logging.level = process.env.LOG_LEVEL as any;
    }
  }
}

/**
 * Global configuration instance
 */
export const globalConfig = new ConfigManager();
