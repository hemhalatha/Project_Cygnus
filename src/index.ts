/**
 * Project Cygnus - Machine Economy Stack
 *
 * Main entry point for the autonomous agentic ecosystem on Stellar blockchain.
 */

// Export XDR utilities
export * from './stellar/xdr/index.js';

// Export utilities (Phase 7)
export * from './utils';
export * from './config';
export * from './monitoring';

// Version info
export const VERSION = '0.7.0';
export const NAME = 'Project Cygnus';

/**
 * Initialize the Project Cygnus system
 */
export async function initialize(config?: {
  network?: 'testnet' | 'mainnet';
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}): Promise<void> {
  const network = config?.network || 'testnet';
  const logLevel = config?.logLevel || 'info';

  console.log(`Initializing ${NAME} v${VERSION}`);
  console.log(`Network: ${network}`);
  console.log(`Log Level: ${logLevel}`);

  // Initialize configuration
  const { ConfigManager } = await import('./config');
  const configManager = new ConfigManager(network);
  await configManager.load();

  // Initialize error logging
  const { ErrorLogger } = await import('./utils');
  const _errorLogger = new ErrorLogger({
    logDirectory: './logs',
    enableConsole: true,
    enableFile: true,
  });

  // Initialize metrics collection
  const { MetricsCollector } = await import('./monitoring');
  const _metrics = new MetricsCollector();

  console.log(`${NAME} initialized successfully`);
}

/**
 * Get system status
 */
export function getStatus(): {
  version: string;
  name: string;
  components: Record<string, boolean>;
} {
  return {
    version: VERSION,
    name: NAME,
    components: {
      xdr: true,
      agentRuntime: true,
      x402Protocol: true,
      x402Flash: true,
      masumiIdentity: true,
      sokosumiCoordination: true,
      smartContracts: true,
      errorHandling: true,
      configuration: true,
      monitoring: true,
    },
  };
}
