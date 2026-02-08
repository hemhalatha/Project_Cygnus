#!/usr/bin/env node
/**
 * Project Cygnus CLI
 */

import { initialize, getStatus, VERSION, NAME } from './index.js';
import { AgentService } from './agent-service.js';

let agentService: AgentService | null = null;

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';

  console.log(`\n${NAME} v${VERSION}\n`);

  switch (command) {
    case 'init':
      await initialize({
        network: (args[1] as 'testnet' | 'mainnet') || 'testnet',
        logLevel: 'info',
      });
      break;

    case 'start':
    case 'serve':
      const network = (args[1] as 'testnet' | 'mainnet') || 'testnet';
      
      // Initialize system
      await initialize({
        network,
        logLevel: 'info',
      });

      // Start agent service
      console.log('\n[CLI] Starting agent service...\n');
      
      agentService = new AgentService({
        agent: {
          characterFile: './agents/characters/example-trader.json',
          plugins: [],
          stellarNetwork: network,
          riskTolerance: 0.6,
          spendingLimits: {
            maxSingleTransaction: 1000,
            dailyLimit: 5000,
            weeklyLimit: 20000,
          },
        },
        server: {
          port: parseInt(process.env.PORT || '3402'),
          host: process.env.HOST || '0.0.0.0',
        },
      });

      await agentService.start();

      console.log('\n✓ Agent service is running');
      console.log(`✓ HTTP server: http://localhost:3402`);
      console.log(`✓ Health check: http://localhost:3402/health`);
      console.log(`✓ Metrics: http://localhost:3402/metrics`);
      console.log('\nPress Ctrl+C to stop\n');

      // Keep process alive
      await new Promise(() => {});
      break;

    case 'status':
      const status = getStatus();
      console.log('System Status:');
      console.log(`  Version: ${status.version}`);
      console.log(`  Name: ${status.name}`);
      console.log('\nComponents:');
      Object.entries(status.components).forEach(([name, enabled]) => {
        console.log(`  ${enabled ? '✓' : '✗'} ${name}`);
      });
      break;

    case 'help':
    default:
      console.log('Usage: npm run dev [command] [options]\n');
      console.log('Commands:');
      console.log('  status    Show system status (default)');
      console.log('  init      Initialize the system');
      console.log('  start     Start the autonomous agent service');
      console.log('  serve     Alias for start');
      console.log('  help      Show this help message');
      console.log('\nExamples:');
      console.log('  npm run dev');
      console.log('  npm run dev status');
      console.log('  npm run dev init testnet');
      console.log('  npm run dev start testnet');
      console.log('\nEnvironment Variables:');
      console.log('  PORT      HTTP server port (default: 3402)');
      console.log('  HOST      HTTP server host (default: 0.0.0.0)');
      break;
  }

  if (command !== 'start' && command !== 'serve') {
    console.log('');
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n[CLI] Received SIGINT, shutting down gracefully...');
  
  if (agentService) {
    await agentService.stop();
  }
  
  console.log('[CLI] Shutdown complete');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n[CLI] Received SIGTERM, shutting down gracefully...');
  
  if (agentService) {
    await agentService.stop();
  }
  
  console.log('[CLI] Shutdown complete');
  process.exit(0);
});

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
