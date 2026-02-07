/**
 * Plugin Manager
 * 
 * Manages dynamic loading and lifecycle of agent plugins.
 */

import { Plugin, PluginConfig } from './types.js';

/**
 * Plugin manager for dynamic plugin loading
 */
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private pluginConfigs: Map<string, PluginConfig> = new Map();

  /**
   * Load a plugin
   */
  async loadPlugin(config: PluginConfig, runtime: any): Promise<void> {
    console.log(`Loading plugin: ${config.name}`);

    try {
      // Dynamic import of plugin
      const pluginModule = await import(`../plugins/${config.name}/index.js`);
      const PluginClass = pluginModule.default;
      
      const plugin: Plugin = new PluginClass(config.config);
      
      // Initialize plugin
      await plugin.initialize(runtime);
      
      this.plugins.set(config.name, plugin);
      this.pluginConfigs.set(config.name, config);
      
      console.log(`Plugin loaded: ${config.name} v${plugin.version}`);
      console.log(`Capabilities: ${plugin.getCapabilities().join(', ')}`);
    } catch (error) {
      console.error(`Failed to load plugin ${config.name}:`, error);
      throw error;
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin not found: ${name}`);
    }

    await plugin.shutdown();
    this.plugins.delete(name);
    this.pluginConfigs.delete(name);
    
    console.log(`Plugin unloaded: ${name}`);
  }

  /**
   * Get a plugin
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all loaded plugins
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Check if plugin is loaded
   */
  isLoaded(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Start all plugins
   */
  async startAll(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      // Plugins don't have explicit start method in base interface
      // This is a placeholder for future extension
      console.log(`Plugin ${plugin.name} ready`);
    }
  }

  /**
   * Stop all plugins
   */
  async stopAll(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      try {
        await plugin.shutdown();
      } catch (error) {
        console.error(`Error stopping plugin ${plugin.name}:`, error);
      }
    }
  }

  /**
   * Get plugin capabilities
   */
  getCapabilities(): Map<string, string[]> {
    const capabilities = new Map<string, string[]>();
    
    for (const [name, plugin] of this.plugins) {
      capabilities.set(name, plugin.getCapabilities());
    }
    
    return capabilities;
  }
}
