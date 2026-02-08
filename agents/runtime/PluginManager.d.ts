/**
 * Plugin Manager
 *
 * Manages dynamic loading and lifecycle of agent plugins.
 */
import { Plugin, PluginConfig } from './types.js';
/**
 * Plugin manager for dynamic plugin loading
 */
export declare class PluginManager {
    private plugins;
    private pluginConfigs;
    /**
     * Load a plugin
     */
    loadPlugin(config: PluginConfig, runtime: any): Promise<void>;
    /**
     * Unload a plugin
     */
    unloadPlugin(name: string): Promise<void>;
    /**
     * Get a plugin
     */
    getPlugin(name: string): Plugin | undefined;
    /**
     * Get all loaded plugins
     */
    getAllPlugins(): Plugin[];
    /**
     * Check if plugin is loaded
     */
    isLoaded(name: string): boolean;
    /**
     * Start all plugins
     */
    startAll(): Promise<void>;
    /**
     * Stop all plugins
     */
    stopAll(): Promise<void>;
    /**
     * Get plugin capabilities
     */
    getCapabilities(): Map<string, string[]>;
}
//# sourceMappingURL=PluginManager.d.ts.map