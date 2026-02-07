#!/usr/bin/env node
/**
 * Project Cygnus CLI
 */

import { initialize, getStatus, VERSION, NAME } from './index.js';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';

  console.log(`\n${NAME} v${VERSION}\n`);

  switch (command) {
    case 'init':
    case 'start':
      await initialize({
        network: (args[1] as 'testnet' | 'mainnet') || 'testnet',
        logLevel: 'info',
      });
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
      console.log('  start     Start the system');
      console.log('  help      Show this help message');
      console.log('\nExamples:');
      console.log('  npm run dev');
      console.log('  npm run dev status');
      console.log('  npm run dev init testnet');
      break;
  }

  console.log('');
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
