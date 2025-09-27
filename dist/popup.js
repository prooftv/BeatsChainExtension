
// === lib/storage.js ===
// Chrome Storage API Wrapper
class StorageManager {
    static async set(key, value) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [key]: value }, resolve);
        });
    }

    static async get(key) {
        return new Promise((resolve) => {
            chrome.storage.local.get([key], (result) => {
                resolve(result[key]);
            });
        });
    }

    static async remove(key) {
        return new Promise((resolve) => {
            chrome.storage.local.remove([key], resolve);
        });
    }

    static async clear() {
        return new Promise((resolve) => {
            chrome.storage.local.clear(resolve);
        });
    }

    static async getAllNFTs() {
        const nfts = await this.get('user_nfts');
        return nfts || [];
    }

    static async addNFT(nftData) {
        const nfts = await this.getAllNFTs();
        nfts.push({
            ...nftData,
            timestamp: Date.now(),
            id: Date.now().toString()
        });
        await this.set('user_nfts', nfts);
        return nftData;
    }

    static async getWalletData() {
        return {
            privateKey: await this.get('wallet_private_key'),
            address: await this.get('wallet_address'),
            balance: await this.get('wallet_balance') || '0'
        };
    }

    static async setWalletData(data) {
        if (data.privateKey) await this.set('wallet_private_key', data.privateKey);
        if (data.address) await this.set('wallet_address', data.address);
        if (data.balance) await this.set('wallet_balance', data.balance);
    }
}



// === lib/wallet.js ===
// Simplified Wallet Management for MVP

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



// === lib/chrome-ai.js ===
// Chrome Built-in AI APIs Manager - All 5 APIs Integration
class ChromeAIManager {
    constructor() {
        this.isAvailable = false;
        this.apis = {
            prompt: null,
            writer: null,
            rewriter: null,
            summarizer: null,
            translator: null
        };
    }

    async initialize() {
        try {
            // Check AI availability
            if (!window.ai) {
                throw new Error('Chrome AI not available');
            }

            // Initialize Prompt API
            if (window.ai.languageModel) {
                this.apis.prompt = await window.ai.languageModel.create();
            }

            // Initialize Writer API
            if (window.ai.writer) {
                this.apis.writer = await window.ai.writer.create();
            }

            // Initialize Rewriter API
            if (window.ai.rewriter) {
                this.apis.rewriter = await window.ai.rewriter.create();
            }

            // Initialize Summarizer API
            if (window.ai.summarizer) {
                this.apis.summarizer = await window.ai.summarizer.create();
            }

            // Initialize Translator API
            if (window.ai.translator) {
                this.apis.translator = await window.ai.translator.create();
            }

            this.isAvailable = true;
            return true;
        } catch (error) {
            console.error('Chrome AI initialization failed:', error);
            return false;
        }
    }

    async generateLicense(beatMetadata) {
        try {
            const prompt = `Generate professional music licensing terms for:
Title: ${beatMetadata.title}
Genre: ${beatMetadata.genre || 'Electronic'}
Duration: ${beatMetadata.duration}
Artist: ${beatMetadata.artist}

Create clear, enforceable licensing terms including usage rights, attribution requirements, and commercial permissions.`;

            let licenseText = '';

            // Use Prompt API for initial generation
            if (this.apis.prompt) {
                licenseText = await this.apis.prompt.prompt(prompt);
            }

            // Enhance with Writer API for professional polish
            if (this.apis.writer && licenseText) {
                licenseText = await this.apis.writer.write(licenseText, {
                    tone: 'professional',
                    format: 'legal-document'
                });
            }

            return licenseText || this.getFallbackLicense(beatMetadata);
        } catch (error) {
            console.error('License generation failed:', error);
            return this.getFallbackLicense(beatMetadata);
        }
    }

    async optimizeLicense(licenseText) {
        try {
            if (!this.apis.rewriter) return licenseText;

            return await this.apis.rewriter.rewrite(licenseText, {
                tone: 'professional',
                length: 'shorter'
            });
        } catch (error) {
            console.error('License optimization failed:', error);
            return licenseText;
        }
    }

    async summarizeTerms(longText) {
        try {
            if (!this.apis.summarizer) return longText;

            return await this.apis.summarizer.summarize(longText, {
                type: 'key-points',
                length: 'short'
            });
        } catch (error) {
            console.error('Summarization failed:', error);
            return longText;
        }
    }

    async translateContent(text, targetLanguage = 'es') {
        try {
            if (!this.apis.translator) return text;

            return await this.apis.translator.translate(text, {
                sourceLanguage: 'en',
                targetLanguage: targetLanguage
            });
        } catch (error) {
            console.error('Translation failed:', error);
            return text;
        }
    }

    async generateNFTDescription(beatMetadata) {
        try {
            const prompt = `Create an engaging NFT marketplace description for:
Title: ${beatMetadata.title}
Genre: ${beatMetadata.genre}
Key features: AI-generated licensing, blockchain ownership
Make it compelling for collectors and music enthusiasts.`;

            if (this.apis.prompt) {
                return await this.apis.prompt.prompt(prompt);
            }

            return `${beatMetadata.title} - A unique music NFT with AI-generated licensing terms, ensuring clear ownership and usage rights on the blockchain.`;
        } catch (error) {
            console.error('NFT description generation failed:', error);
            return `${beatMetadata.title} - Music NFT with blockchain ownership`;
        }
    }

    getFallbackLicense(metadata) {
        return `MUSIC LICENSING AGREEMENT

Track: ${metadata.title}
Artist: ${metadata.artist}
Duration: ${metadata.duration}

USAGE RIGHTS:
- Non-exclusive license for personal and commercial use
- Attribution required: "${metadata.artist} - ${metadata.title}"
- No resale or redistribution of original audio file
- Derivative works permitted with attribution

TERMS:
- License valid indefinitely
- No warranty provided
- Governed by blockchain smart contract
- Generated by BeatsChain AI on ${new Date().toLocaleDateString()}`;
    }

    getAvailableAPIs() {
        return Object.entries(this.apis)
            .filter(([_, api]) => api !== null)
            .map(([name, _]) => name);
    }
}



// === lib/thirdweb.js ===
// Thirdweb SDK Integration for BeatsChain

class ThirdwebManager {
    constructor() {
        this.sdk = null;
        this.contract = null;
        this.storage = new ThirdwebStorage();
        this.isInitialized = false;
    }

    async initialize(privateKey) {
        try {
            // Initialize SDK with private key
            this.sdk = ThirdwebSDK.fromPrivateKey(
                privateKey,
                "polygon-mumbai", // Testnet
                {
                    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
                }
            );

            // Get NFT contract
            this.contract = await this.sdk.getContract(
                process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
            );

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error("Thirdweb initialization failed:", error);
            return false;
        }
    }

    async uploadToIPFS(file, metadata) {
        try {
            // Upload audio file to IPFS
            const audioUri = await this.storage.upload(file);
            
            // Create NFT metadata
            const nftMetadata = {
                name: metadata.title,
                description: metadata.description,
                image: metadata.coverImage || "ipfs://default-music-cover",
                animation_url: audioUri,
                attributes: [
                    {
                        trait_type: "Genre",
                        value: metadata.genre || "Electronic"
                    },
                    {
                        trait_type: "Duration",
                        value: metadata.duration
                    },
                    {
                        trait_type: "License Type",
                        value: metadata.licenseType
                    },
                    {
                        trait_type: "Created With",
                        value: "BeatsChain AI"
                    }
                ],
                properties: {
                    license_terms: metadata.licenseTerms,
                    artist: metadata.artist,
                    created_at: new Date().toISOString(),
                    file_type: file.type,
                    file_size: file.size
                }
            };

            // Upload metadata to IPFS
            const metadataUri = await this.storage.upload(nftMetadata);
            return { audioUri, metadataUri, nftMetadata };
        } catch (error) {
            console.error("IPFS upload failed:", error);
            throw error;
        }
    }

    async mintNFT(recipientAddress, metadataUri) {
        try {
            if (!this.isInitialized) {
                throw new Error("Thirdweb not initialized");
            }

            // Mint NFT to recipient
            const tx = await this.contract.erc721.mintTo(recipientAddress, metadataUri);
            
            return {
                transactionHash: tx.receipt.transactionHash,
                tokenId: tx.id.toString(),
                blockNumber: tx.receipt.blockNumber
            };
        } catch (error) {
            console.error("NFT minting failed:", error);
            throw error;
        }
    }

    async getUserNFTs(walletAddress) {
        try {
            if (!this.isInitialized) {
                return [];
            }

            const nfts = await this.contract.erc721.getOwned(walletAddress);
            return nfts.map(nft => ({
                tokenId: nft.metadata.id,
                name: nft.metadata.name,
                description: nft.metadata.description,
                image: nft.metadata.image,
                animationUrl: nft.metadata.animation_url,
                attributes: nft.metadata.attributes,
                properties: nft.metadata.properties
            }));
        } catch (error) {
            console.error("Failed to fetch user NFTs:", error);
            return [];
        }
    }

    async getWalletBalance(walletAddress) {
        try {
            if (!this.sdk) return "0";
            
            const balance = await this.sdk.getBalance(walletAddress);
            return balance.displayValue;
        } catch (error) {
            console.error("Failed to get wallet balance:", error);
            return "0";
        }
    }

    getExplorerUrl(transactionHash) {
        // Mumbai testnet explorer
        return `https://mumbai.polygonscan.com/tx/${transactionHash}`;
    }

    getNFTUrl(tokenId) {
        // OpenSea testnet URL
        return `https://testnets.opensea.io/assets/mumbai/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}/${tokenId}`;
    }
}



// === popup/popup.js ===
// BeatsChain Extension Popup Logic

class BeatsChainApp {
    constructor() {
        this.aiManager = new ChromeAIManager();
        this.thirdwebManager = new ThirdwebManager();
        this.walletManager = new WalletManager();
        this.currentSection = 'upload-section';
        this.beatFile = null;
        this.beatMetadata = {};
        this.licenseTerms = '';
        this.isInitialized = false;
    }

    async initialize() {
        try {
            // Initialize wallet first
            await this.walletManager.initialize();
            
            // Initialize AI APIs
            await this.aiManager.initialize();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load wallet data
            await this.loadWalletData();
            
            this.isInitialized = true;
            console.log('BeatsChain initialized successfully');
        } catch (error) {
            console.error('Initialization failed:', error);
            this.showError('Failed to initialize BeatsChain');
        }
    }

    setupEventListeners() {
        // File upload
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('audio-file');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('drop', this.handleFileDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // AI licensing
        document.getElementById('generate-license').addEventListener('click', this.generateLicense.bind(this));
        document.getElementById('approve-license').addEventListener('click', this.approveLicense.bind(this));

        // Minting
        document.getElementById('mint-nft').addEventListener('click', this.mintNFT.bind(this));

        // Success actions
        document.getElementById('view-nft').addEventListener('click', this.viewNFT.bind(this));
        document.getElementById('mint-another').addEventListener('click', this.resetApp.bind(this));

        // Wallet toggle
        document.getElementById('toggle-wallet').addEventListener('click', this.toggleWallet.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleFileDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    async processFile(file) {
        // Validate file
        if (!this.validateAudioFile(file)) {
            this.showError('Invalid file type. Please upload MP3, WAV, or FLAC files.');
            return;
        }

        this.beatFile = file;
        this.showProgress(true);

        try {
            // Extract metadata
            this.beatMetadata = await this.extractAudioMetadata(file);
            
            // Update UI
            this.updateUploadStatus(`Uploaded: ${file.name}`);
            this.showProgress(false);
            
            // Move to licensing section
            this.showSection('licensing-section');
            
        } catch (error) {
            console.error('File processing failed:', error);
            this.showError('Failed to process audio file');
            this.showProgress(false);
        }
    }

    validateAudioFile(file) {
        const validTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp3'];
        const maxSize = 50 * 1024 * 1024; // 50MB
        
        return validTypes.includes(file.type) && file.size <= maxSize;
    }

    async extractAudioMetadata(file) {
        return new Promise((resolve) => {
            const audio = new Audio();
            const url = URL.createObjectURL(file);
            
            audio.addEventListener('loadedmetadata', () => {
                const metadata = {
                    title: file.name.replace(/\.[^/.]+$/, ""),
                    duration: this.formatDuration(audio.duration),
                    size: file.size,
                    type: file.type,
                    artist: 'Unknown Artist', // Could be enhanced with ID3 parsing
                    genre: 'Electronic'
                };
                
                URL.revokeObjectURL(url);
                resolve(metadata);
            });
            
            audio.src = url;
        });
    }

    async generateLicense() {
        const generateBtn = document.getElementById('generate-license');
        const statusText = document.getElementById('ai-status-text');
        const licenseTextarea = document.getElementById('license-terms');
        
        generateBtn.disabled = true;
        statusText.textContent = 'AI generating licensing terms...';

        try {
            // Generate license with AI
            this.licenseTerms = await this.aiManager.generateLicense(this.beatMetadata);
            
            // Optimize for clarity
            this.licenseTerms = await this.aiManager.optimizeLicense(this.licenseTerms);
            
            // Update UI
            licenseTextarea.value = this.licenseTerms;
            statusText.textContent = 'License generated successfully!';
            document.getElementById('approve-license').disabled = false;
            
        } catch (error) {
            console.error('License generation failed:', error);
            statusText.textContent = 'AI generation failed, using template';
            licenseTextarea.value = this.aiManager.getFallbackLicense(this.beatMetadata);
            document.getElementById('approve-license').disabled = false;
        } finally {
            generateBtn.disabled = false;
        }
    }

    approveLicense() {
        const licenseText = document.getElementById('license-terms').value;
        if (!licenseText.trim()) {
            this.showError('Please generate or enter licensing terms');
            return;
        }
        
        this.licenseTerms = licenseText;
        this.prepareNFTPreview();
        this.showSection('minting-section');
    }

    async prepareNFTPreview() {
        // Generate NFT description with AI
        const description = await this.aiManager.generateNFTDescription(this.beatMetadata);
        
        // Update preview
        document.getElementById('nft-title').textContent = this.beatMetadata.title;
        document.getElementById('nft-description').textContent = description;
        
        // Enable minting
        document.getElementById('mint-nft').disabled = false;
    }

    async mintNFT() {
        const mintBtn = document.getElementById('mint-nft');
        const statusDiv = document.getElementById('mint-status');
        
        mintBtn.disabled = true;
        statusDiv.className = 'mint-status pending';
        statusDiv.textContent = 'Preparing to mint NFT...';

        try {
            // Initialize Thirdweb if needed
            if (!this.thirdwebManager.isInitialized) {
                const privateKey = await this.getOrCreateWallet();
                await this.thirdwebManager.initialize(privateKey);
            }

            statusDiv.textContent = 'Uploading to IPFS...';
            
            // Upload to IPFS
            const { metadataUri } = await this.thirdwebManager.uploadToIPFS(this.beatFile, {
                ...this.beatMetadata,
                licenseTerms: this.licenseTerms,
                licenseType: 'AI-Generated'
            });

            statusDiv.textContent = 'Minting NFT on blockchain...';
            
            // Mint NFT
            const walletAddress = await this.getWalletAddress();
            const result = await this.thirdwebManager.mintNFT(walletAddress, metadataUri);
            
            // Show success
            this.showMintSuccess(result);
            
        } catch (error) {
            console.error('Minting failed:', error);
            statusDiv.className = 'mint-status error';
            statusDiv.textContent = `Minting failed: ${error.message}`;
            mintBtn.disabled = false;
        }
    }

    showMintSuccess(result) {
        document.getElementById('tx-hash').textContent = result.transactionHash;
        this.currentTxHash = result.transactionHash;
        this.currentTokenId = result.tokenId;
        
        this.showSection('success-section');
        this.updateWalletData();
    }

    async getOrCreateWallet() {
        return this.walletManager.getPrivateKey();
    }

    async getWalletAddress() {
        return this.walletManager.getAddress();
    }

    viewNFT() {
        if (this.currentTokenId) {
            const url = this.thirdwebManager.getNFTUrl(this.currentTokenId);
            chrome.tabs.create({ url });
        }
    }

    resetApp() {
        this.beatFile = null;
        this.beatMetadata = {};
        this.licenseTerms = '';
        this.currentTxHash = null;
        this.currentTokenId = null;
        
        // Reset UI
        document.getElementById('audio-file').value = '';
        document.getElementById('license-terms').value = '';
        document.getElementById('ai-status-text').textContent = 'Ready to generate licensing terms';
        document.getElementById('mint-status').textContent = '';
        
        this.showSection('upload-section');
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        document.getElementById(sectionId).classList.add('active');
        this.currentSection = sectionId;
    }

    showProgress(show) {
        const progressBar = document.getElementById('progress-bar');
        progressBar.style.display = show ? 'block' : 'none';
        
        if (show) {
            // Animate progress
            const fill = progressBar.querySelector('.progress-fill');
            fill.style.width = '0%';
            setTimeout(() => fill.style.width = '100%', 100);
        }
    }

    updateUploadStatus(message) {
        const uploadContent = document.querySelector('.upload-content p');
        uploadContent.textContent = message;
    }

    showError(message) {
        // Simple error display - could be enhanced with toast notifications
        alert(message);
    }

    formatDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    toggleWallet() {
        const panel = document.getElementById('wallet-panel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }

    async loadWalletData() {
        // Load wallet balance and NFTs
        try {
            const walletAddress = await this.getWalletAddress();
            const balance = await this.thirdwebManager.getWalletBalance(walletAddress);
            document.getElementById('wallet-balance').textContent = `${balance} MATIC`;
        } catch (error) {
            console.error('Failed to load wallet data:', error);
        }
    }

    async updateWalletData() {
        await this.loadWalletData();
        // Refresh NFT collection display
    }

    // Storage helpers
    async storeData(key, value) {
        return StorageManager.set(key, value);
    }

    async getStoredData(key) {
        return StorageManager.get(key);
    }
}

// Initialize app when popup loads
document.addEventListener('DOMContentLoaded', async () => {
    const app = new BeatsChainApp();
    await app.initialize();
    
    // Make app globally available for debugging
    window.beatsChainApp = app;
});
