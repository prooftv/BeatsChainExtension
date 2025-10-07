/**
 * Chrome Extension Configuration Manager
 * Replaces process.env with Chrome storage API for secure credential management
 */

class ConfigManager {
  constructor() {
    this.cache = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Load .env file if not already loaded
      const existingConfig = await chrome.storage.local.get(['CONFIG_LOADED']);
      if (!existingConfig.CONFIG_LOADED && typeof EnvLoader !== 'undefined') {
        await EnvLoader.loadEnvToStorage();
        await chrome.storage.local.set({ CONFIG_LOADED: true });
      }
      
      const stored = await chrome.storage.local.get([
        'PINATA_API_KEY',
        'PINATA_SECRET_KEY', 
        'NEXT_PUBLIC_THIRDWEB_CLIENT_ID',
        'THIRDWEB_CLIENT_ID',
        'WALLET_ENCRYPTION_KEY',
        'TEST_WALLET_PRIVATE_KEY',
        'NEXT_PUBLIC_RPC_URL',
        'RPC_URL',
        'NEXT_PUBLIC_CONTRACT_ADDRESS',
        'CONTRACT_ADDRESS'
      ]);

      // Set defaults with multiple RPC fallbacks
      const defaults = {
        RPC_URL: stored['NEXT_PUBLIC_RPC_URL'] || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
        RPC_FALLBACK_1: 'https://rpc.sepolia.org',
        RPC_FALLBACK_2: 'https://sepolia.gateway.tenderly.co',
        RPC_FALLBACK_3: 'https://ethereum-sepolia.publicnode.com',
        CONTRACT_ADDRESS: stored['NEXT_PUBLIC_CONTRACT_ADDRESS'] || '0xafa5c58566de312dda145bc8c83709b845d7eb94', // Sepolia deployment
        THIRDWEB_CLIENT_ID: stored['NEXT_PUBLIC_THIRDWEB_CLIENT_ID'] || stored['THIRDWEB_CLIENT_ID'],
        TEST_WALLET_PRIVATE_KEY: 'c0c71ecd72b802ba8f19cbe188b7e191f62889bf6adf3bb18265a626a5829171'
      };

      Object.entries(defaults).forEach(([key, value]) => {
        if (!stored[key]) {
          stored[key] = value;
        }
      });

      this.cache = new Map(Object.entries(stored));
      this.initialized = true;
    } catch (error) {
      console.error('Config initialization failed:', error);
      throw error;
    }
  }

  async get(key) {
    if (!this.initialized) await this.initialize();
    return this.cache.get(key);
  }

  async set(key, value) {
    if (!this.initialized) await this.initialize();
    
    this.cache.set(key, value);
    await chrome.storage.local.set({ [key]: value });
  }

  async getAll() {
    if (!this.initialized) await this.initialize();
    return Object.fromEntries(this.cache);
  }
}

// Singleton instance
const config = new ConfigManager();

export default config;