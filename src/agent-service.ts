/**
 * Agent Service
 * 
 * Manages the autonomous agent lifecycle and integrates with the HTTP server.
 */

import { AutonomousAgent } from '../agents/AutonomousAgent.js';
import { CygnusServer } from './server.js';
import type { AgentConfig } from '../agents/runtime/types.js';

export interface AgentServiceConfig {
  agent: AgentConfig;
  server: {
    port: number;
    host: string;
  };
}

/**
 * Agent Service - manages agent and server lifecycle
 */
export class AgentService {
  private agent: AutonomousAgent | null = null;
  private server: CygnusServer;
  private config: AgentServiceConfig;
  private isRunning: boolean = false;

  constructor(config: AgentServiceConfig) {
    this.config = config;
    this.server = new CygnusServer(config.server);
  }

  /**
   * Start the agent service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[AgentService] Already running');
      return;
    }

    console.log('[AgentService] Starting...');

    try {
      // Start HTTP server
      await this.server.start();

      // Initialize and start autonomous agent
      console.log('[AgentService] Initializing autonomous agent...');
      this.agent = new AutonomousAgent(this.config.agent);
      await this.agent.initialize();
      
      console.log('[AgentService] Starting autonomous agent...');
      await this.agent.start();

      this.isRunning = true;
      console.log('[AgentService] Started successfully');
      console.log('[AgentService] Agent is now running autonomously');
    } catch (error) {
      console.error('[AgentService] Failed to start:', error);
      await this.stop();
      throw error;
    }
  }

  /**
   * Stop the agent service
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('[AgentService] Stopping...');

    try {
      // Stop agent
      if (this.agent) {
        await this.agent.stop();
        this.agent = null;
      }

      // Stop server
      await this.server.stop();

      this.isRunning = false;
      console.log('[AgentService] Stopped successfully');
    } catch (error) {
      console.error('[AgentService] Error during shutdown:', error);
      throw error;
    }
  }

  /**
   * Get agent instance
   */
  getAgent(): AutonomousAgent | null {
    return this.agent;
  }

  /**
   * Get server instance
   */
  getServer(): CygnusServer {
    return this.server;
  }

  /**
   * Check if service is running
   */
  isServiceRunning(): boolean {
    return this.isRunning;
  }
}
