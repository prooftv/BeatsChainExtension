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
        'THIRDWEB_CLIENT_ID',
        'WALLET_ENCRYPTION_KEY',
        'TEST_WALLET_PRIVATE_KEY',
        'RPC_URL',
        'CONTRACT_ADDRESS'
      ]);

      // Set defaults if not configured
      const defaults = {
        RPC_URL: 'https://rpc-mumbai.maticvigil.com',
        CONTRACT_ADDRESS: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A',
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