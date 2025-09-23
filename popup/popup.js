// BeatsChain Extension Popup Logic
import ChromeAIManager from '../lib/chrome-ai.js';
import ThirdwebManager from '../lib/thirdweb.js';
import WalletManager from '../lib/wallet.js';
import StorageManager from '../lib/storage.js';

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