// Simplified Wallet Management for MVP
import StorageManager from './storage.js';

class WalletManager {
    constructor() {
        this.privateKey = null;
        this.address = null;
    }

    async initialize() {
        const walletData = await StorageManager.getWalletData();
        
        if (walletData.privateKey && walletData.address) {
            this.privateKey = walletData.privateKey;
            this.address = walletData.address;
            return true;
        }
        
        return await this.createWallet();
    }

    async createWallet() {
        try {
            // Generate a simple private key (for MVP - use proper crypto in production)
            this.privateKey = '0x' + this.generateRandomHex(64);
            
            // Generate address from private key (simplified for MVP)
            this.address = '0x' + this.generateRandomHex(40);
            
            // Store wallet data
            await StorageManager.setWalletData({
                privateKey: this.privateKey,
                address: this.address,
                balance: '0'
            });
            
            console.log('New wallet created:', this.address);
            return true;
        } catch (error) {
            console.error('Wallet creation failed:', error);
            return false;
        }
    }

    generateRandomHex(length) {
        return Array.from({length}, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    getAddress() {
        return this.address;
    }

    getPrivateKey() {
        return this.privateKey;
    }

    async updateBalance(balance) {
        await StorageManager.setWalletData({ balance });
    }

    async exportPrivateKey() {
        if (!this.privateKey) {
            throw new Error('No wallet available');
        }
        return this.privateKey;
    }

    async importPrivateKey(privateKey) {
        if (!privateKey || !privateKey.startsWith('0x')) {
            throw new Error('Invalid private key format');
        }
        
        this.privateKey = privateKey;
        // In production, derive address from private key properly
        this.address = '0x' + this.generateRandomHex(40);
        
        await StorageManager.setWalletData({
            privateKey: this.privateKey,
            address: this.address
        });
        
        return true;
    }

    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
}

export default WalletManager;