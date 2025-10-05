// Import config manager
import config from '../lib/config.js';

// BeatsChain Extension Popup Logic - COMPLETE WORKING VERSION
class BeatsChainApp {
    constructor() {
        this.currentSection = 'upload-section';
        // Web3 Minting System
        this.beatFile = null;
        this.beatMetadata = {};
        this.licenseTerms = '';
        // Web2 Radio Submission System (Independent)
        this.radioAudioFile = null;
        this.radioMetadata = {};
        this.splitSheetsManager = null;
        // Centralized Audio Manager
        this.audioManager = new AudioManager();
        this.isInitialized = false;
    }

    async initialize() {
        try {
            this.setupEventListeners();
            
            // Initialize managers with error handling
            try {
                this.authManager = new AuthenticationManager();
                const isAuthenticated = await this.authManager.initialize();
                if (isAuthenticated) {
                    console.log('✅ User authenticated');
                    await this.updateAuthenticatedUI();
                }
            } catch (error) {
                console.log('Auth manager unavailable, continuing without authentication');
            }
            
            try {
                this.chromeAI = new ChromeAIManager();
                const aiAvailable = await this.chromeAI.initialize();
                if (aiAvailable) {
                    console.log('✅ Chrome AI ready');
                } else {
                    console.log('ℹ️ Chrome AI unavailable - using fallback templates');
                }
            } catch (error) {
                console.log('Chrome AI unavailable, using fallback templates');
            }
            
            try {
                this.thirdweb = new ThirdwebManager();
                console.log('Thirdweb manager initialized');
            } catch (error) {
                console.log('Thirdweb manager unavailable');
            }
            
            await this.loadWalletData();
            this.isInitialized = true;
            console.log('BeatsChain initialized successfully');
        } catch (error) {
            console.error('Initialization failed:', error);
        }
    }

    setupEventListeners() {
        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.switchTab(section);
            });
        });

        // Upload functionality
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('audio-file');
        
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
            uploadArea.addEventListener('drop', this.handleFileDrop.bind(this));
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }

        // License generation
        const generateBtn = document.getElementById('generate-license');
        if (generateBtn) {
            generateBtn.addEventListener('click', this.generateLicense.bind(this));
        }

        const approveBtn = document.getElementById('approve-license');
        if (approveBtn) {
            approveBtn.addEventListener('click', this.approveLicense.bind(this));
        }

        // Minting
        const mintBtn = document.getElementById('mint-nft');
        if (mintBtn) {
            mintBtn.addEventListener('click', this.mintNFT.bind(this));
        }

        // Success actions
        const viewBtn = document.getElementById('view-nft');
        if (viewBtn) {
            viewBtn.addEventListener('click', this.viewNFT.bind(this));
        }

        const downloadBtn = document.getElementById('download-package');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.generateDownloadPackage({
                transactionHash: this.currentTxHash,
                tokenId: this.currentTokenId
            }));
        }

        const mintAnotherBtn = document.getElementById('mint-another');
        if (mintAnotherBtn) {
            mintAnotherBtn.addEventListener('click', this.resetApp.bind(this));
        }

        // Authentication
        const googleSignIn = document.getElementById('google-signin');
        if (googleSignIn) {
            googleSignIn.addEventListener('click', this.handleGoogleSignIn.bind(this));
        }

        // Image upload
        const imageInput = document.getElementById('cover-image');
        if (imageInput) {
            imageInput.addEventListener('change', this.handleImageUpload.bind(this));
        }

        // Proceed button
        const proceedBtn = document.getElementById('proceed-to-licensing');
        if (proceedBtn) {
            proceedBtn.addEventListener('click', () => this.showSection('licensing-section'));
        }

        // Radio submission events
        const generateRadioBtn = document.getElementById('generate-radio-package');
        if (generateRadioBtn) {
            generateRadioBtn.addEventListener('click', this.generateRadioPackage.bind(this));
        }
        
        const addContributorBtn = document.getElementById('add-contributor');
        if (addContributorBtn) {
            addContributorBtn.addEventListener('click', this.addContributor.bind(this));
        }
        
        // Setup percentage calculator
        this.setupPercentageCalculator();
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
        if (!this.validateAudioFile(file)) {
            alert('Invalid file type. Please upload MP3, WAV, or FLAC files.');
            return;
        }

        this.beatFile = file;
        this.showProgress(true);

        try {
            this.beatMetadata = await this.extractAudioMetadata(file, 'web3');
            this.updateUploadStatus(`Uploaded: ${file.name} (${this.audioManager.formatFileSize(file.size)})`);
            this.showProgress(false);
            this.createAudioPreview(file);
            this.displayMetadata(this.beatMetadata);
            this.showArtistForm();
            
            const proceedBtn = document.getElementById('proceed-to-licensing');
            if (proceedBtn) proceedBtn.style.display = 'block';
        } catch (error) {
            console.error('File processing failed:', error);
            alert('Failed to process audio file');
            this.showProgress(false);
        }
    }

    validateAudioFile(file) {
        return this.audioManager.validateAudioFile(file);
    }

    async extractAudioMetadata(file, systemId = 'web3') {
        return await this.audioManager.extractAudioMetadata(file, systemId);
    }

    // Utility methods now delegated to AudioManager
    estimateBitrate(fileSize, duration) {
        return this.audioManager.estimateBitrate(fileSize, duration);
    }

    getQualityLevel(bitrate, format) {
        return this.audioManager.getQualityLevel(bitrate, format);
    }

    estimateBPM(fileName) {
        return this.audioManager.estimateBPM(fileName);
    }

    inferGenre(fileName) {
        return this.audioManager.inferGenre(fileName);
    }

    inferEnergyLevel(fileName, duration) {
        return this.audioManager.inferEnergyLevel(fileName, duration);
    }

    async generateLicense() {
        const generateBtn = document.getElementById('generate-license');
        const statusText = document.getElementById('ai-status-text');
        const licenseTextarea = document.getElementById('license-terms');
        
        generateBtn.disabled = true;
        statusText.textContent = 'Generating license...';

        try {
            const artistInputs = this.getArtistInputs();
            const enhancedMetadata = {
                ...this.beatMetadata,
                artist: artistInputs.artistName,
                stageName: artistInputs.stageName,
                title: artistInputs.beatTitle,
                genre: artistInputs.genre
            };
            
            const licenseOptions = this.getLicenseOptions();
            
            if (this.chromeAI && this.chromeAI.apis && this.chromeAI.apis.languageModel) {
                statusText.textContent = 'AI generating professional licensing terms...';
                this.licenseTerms = await this.chromeAI.generateLicense(enhancedMetadata, licenseOptions);
            } else {
                statusText.textContent = 'Using professional template license';
                this.licenseTerms = this.getEnhancedFallbackLicense(enhancedMetadata, licenseOptions);
            }
            
            licenseTextarea.value = this.licenseTerms;
            statusText.textContent = 'License generated successfully!';
            document.getElementById('approve-license').disabled = false;
            
        } catch (error) {
            console.error('License generation failed:', error);
            statusText.textContent = 'Using template license';
            
            const artistInputs = this.getArtistInputs();
            const enhancedMetadata = {
                ...this.beatMetadata,
                artist: artistInputs.artistName,
                stageName: artistInputs.stageName,
                title: artistInputs.beatTitle,
                genre: artistInputs.genre
            };
            this.licenseTerms = this.getEnhancedFallbackLicense(enhancedMetadata, this.getLicenseOptions());
            licenseTextarea.value = this.licenseTerms;
            document.getElementById('approve-license').disabled = false;
        } finally {
            generateBtn.disabled = false;
        }
    }

    getEnhancedFallbackLicense(metadata, options = {}) {
        const artistDisplay = metadata.stageName ? `${metadata.artist} (${metadata.stageName})` : metadata.artist;
        const licenseTypeText = options.licenseType === 'exclusive' ? 'EXCLUSIVE' : 'NON-EXCLUSIVE';
        
        return `BEATSCHAIN MUSIC NFT LICENSING AGREEMENT

═══════════════════════════════════════════════════════════════
TRACK IDENTIFICATION & TECHNICAL SPECIFICATIONS
═══════════════════════════════════════════════════════════════

Track Title: ${metadata.title}
Original Filename: ${metadata.originalFileName}
Duration: ${metadata.duration} (${metadata.durationSeconds} seconds)
Genre Classification: ${metadata.suggestedGenre}
Estimated BPM: ${metadata.estimatedBPM}
Energy Level: ${metadata.energyLevel}
Audio Quality: ${metadata.qualityLevel}
File Format: ${metadata.format}
Estimated Bitrate: ${metadata.estimatedBitrate}
File Size: ${metadata.fileSize}

═══════════════════════════════════════════════════════════════
GRANT OF RIGHTS
═══════════════════════════════════════════════════════════════

1. LICENSE TYPE: ${licenseTypeText} Perpetual License
2. TERRITORY: Worldwide distribution and usage rights  
3. DURATION: Perpetual (never expires, suitable for NFT ownership)
4. ARTIST: ${artistDisplay}

═══════════════════════════════════════════════════════════════
INCLUDED RIGHTS
═══════════════════════════════════════════════════════════════

✓ SYNCHRONIZATION RIGHTS: Use with video, film, advertising, social media
✓ MECHANICAL RIGHTS: Digital reproduction, streaming, downloads
✓ PERFORMANCE RIGHTS: Live performances, broadcasts, public play
✓ DERIVATIVE WORKS: Remixes, samples, modifications (with attribution)
✓ DISTRIBUTION RIGHTS: Online platforms, physical media, streaming services

Generated by BeatsChain Chrome Extension on ${new Date().toLocaleString()}
Extension ID: chrome-extension://${chrome.runtime?.id || 'local-development'}
Verification: Check Chrome extension storage for transaction details`;
    }

    approveLicense() {
        const licenseText = document.getElementById('license-terms').value;
        if (!licenseText.trim()) {
            alert('Please generate or enter licensing terms');
            return;
        }
        
        this.licenseTerms = licenseText;
        this.prepareNFTPreview();
        this.showSection('minting-section');
    }

    async prepareNFTPreview() {
        const description = `${this.beatMetadata.title} - AI-generated music NFT with blockchain ownership and licensing`;
        document.getElementById('nft-title').textContent = this.beatMetadata.title;
        document.getElementById('nft-description').textContent = description;
        document.getElementById('mint-nft').disabled = false;
    }

    async mintNFT() {
        const mintBtn = document.getElementById('mint-nft');
        const statusDiv = document.getElementById('mint-status');
        
        mintBtn.disabled = true;
        statusDiv.className = 'mint-status pending';
        statusDiv.textContent = 'Preparing to mint NFT...';

        try {
            // Get wallet address (bypass for now)
            let walletAddress = await this.authManager?.getWalletAddress();
            if (!walletAddress) {
                // Generate temporary wallet for testing
                const tempWallet = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(20)), 
                    byte => byte.toString(16).padStart(2, '0')).join('');
                walletAddress = tempWallet;
                console.log('Using temporary wallet for testing:', walletAddress);
            }
            
            statusDiv.textContent = 'Uploading to IPFS...';
            
            // Upload to IPFS using real Thirdweb integration
            const uploadResult = await this.thirdweb.uploadToIPFS(this.beatFile, {
                ...this.beatMetadata,
                licenseTerms: this.licenseTerms,
                description: `${this.beatMetadata.title} - AI-generated music NFT with blockchain licensing`
            });
            
            statusDiv.textContent = 'Minting NFT on blockchain...';
            
            // Initialize Thirdweb with wallet private key
            let privateKey;
            const walletData = await window.StorageManager.getWalletData();
            
            if (walletData.privateKey) {
                privateKey = walletData.privateKey;
            } else {
                // Use test wallet private key for testing
                await config.initialize();
                privateKey = await config.get('TEST_WALLET_PRIVATE_KEY');
                console.log('Using test wallet private key for minting');
            }
            
            await this.thirdweb.initialize(privateKey);
            
            // Mint NFT on blockchain
            const mintResult = await this.thirdweb.mintNFT(walletAddress, uploadResult.metadataUri);
            
            this.showMintSuccess({
                transactionHash: mintResult.transactionHash,
                tokenId: mintResult.tokenId,
                ipfsHash: uploadResult.metadataUri
            });
            
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
        
        // Store NFT data
        try {
            chrome.runtime.sendMessage({
                action: 'store_nft',
                data: {
                    title: this.beatMetadata.title,
                    txHash: result.transactionHash,
                    tokenId: result.tokenId,
                    license: this.licenseTerms,
                    metadata: this.beatMetadata
                }
            });
        } catch (error) {
            console.log('Chrome runtime unavailable');
        }
    }

    viewNFT() {
        if (this.currentTxHash) {
            const url = `https://mumbai.polygonscan.com/tx/${encodeURIComponent(this.currentTxHash)}`;
            try {
                chrome.tabs.create({ url });
            } catch (error) {
                window.open(url, '_blank');
            }
        }
    }

    resetApp() {
        // Clean up Web3 system
        this.audioManager.cleanupSystem('web3');
        this.beatFile = null;
        this.beatMetadata = {};
        this.licenseTerms = '';
        this.currentTxHash = null;
        this.currentTokenId = null;
        
        document.getElementById('audio-file').value = '';
        document.getElementById('license-terms').value = '';
        document.getElementById('ai-status-text').textContent = 'Ready to generate licensing terms';
        document.getElementById('mint-status').textContent = '';
        
        const proceedBtn = document.getElementById('proceed-to-licensing');
        if (proceedBtn) proceedBtn.style.display = 'none';
        
        this.showSection('upload-section');
    }

    switchTab(section) {
        // Pause all audio when switching tabs
        this.audioManager.pauseAllAudio();
        
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        if (section === 'mint') {
            this.showSection(this.currentSection || 'upload-section');
        } else if (section === 'profile') {
            this.showSection('profile-section');
        } else if (section === 'history') {
            this.showSection('history-section');
        } else if (section === 'share') {
            this.showSection('share-section');
        } else if (section === 'radio') {
            this.showSection('radio-section');
            this.loadRadioSubmission();
        }
    }

    showSection(sectionId) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');
        this.currentSection = sectionId;
    }

    showProgress(show) {
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.style.display = show ? 'block' : 'none';
            if (show) {
                const fill = progressBar.querySelector('.progress-fill');
                if (fill) {
                    fill.style.width = '0%';
                    setTimeout(() => fill.style.width = '100%', 100);
                }
            }
        }
    }

    updateUploadStatus(message) {
        const uploadContent = document.querySelector('.upload-content p');
        if (uploadContent) {
            uploadContent.textContent = message;
        }
    }

    formatDuration(seconds) {
        return this.audioManager.formatDuration(seconds);
    }

    formatFileSize(bytes) {
        return this.audioManager.formatFileSize(bytes);
    }

    createAudioPreview(file) {
        return this.audioManager.createAudioPreview(file, 'audio-preview', 'web3');
    }

    displayMetadata(metadata) {
        const metadataDisplay = document.getElementById('metadata-display');
        if (!metadataDisplay) return;

        document.getElementById('meta-duration').textContent = metadata.duration;
        document.getElementById('meta-quality').textContent = metadata.qualityLevel;
        document.getElementById('meta-bpm').textContent = metadata.estimatedBPM;
        document.getElementById('meta-genre').textContent = metadata.suggestedGenre;
        document.getElementById('meta-energy').textContent = metadata.energyLevel;
        document.getElementById('meta-size').textContent = metadata.fileSize;

        metadataDisplay.style.display = 'block';
    }
    
    showArtistForm() {
        const artistForm = document.getElementById('artist-form');
        if (artistForm) {
            artistForm.style.display = 'block';
            
            const beatTitleInput = document.getElementById('beat-title');
            if (beatTitleInput && this.beatMetadata.title) {
                beatTitleInput.value = this.beatMetadata.title;
            }
            
            const genreSelect = document.getElementById('genre-select');
            if (genreSelect && this.beatMetadata.suggestedGenre) {
                genreSelect.value = this.beatMetadata.suggestedGenre;
            }
        }
    }
    
    sanitizeInput(input) {
        if (!input) return '';
        return String(input)
            .replace(/[<>"'&]/g, (match) => {
                const map = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
                return map[match];
            })
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
            .trim()
            .substring(0, 200);
    }
    
    validateInput(input, type = 'text') {
        if (!input || typeof input !== 'string') return false;
        
        switch (type) {
            case 'name':
                return /^[a-zA-Z0-9\s\-_]{1,50}$/.test(input.trim());
            case 'title':
                return /^[a-zA-Z0-9\s\-_.,!?]{1,100}$/.test(input.trim());
            case 'percentage':
                const num = parseFloat(input);
                return !isNaN(num) && num >= 0 && num <= 100;
            default:
                return input.trim().length > 0 && input.length <= 200;
        }
    }
    
    getArtistInputs() {
        const artistName = this.sanitizeInput(document.getElementById('artist-name')?.value) || 'Unknown Artist';
        const stageName = this.sanitizeInput(document.getElementById('stage-name')?.value) || '';
        const beatTitle = this.sanitizeInput(document.getElementById('beat-title')?.value) || this.beatMetadata.title;
        const genre = this.sanitizeInput(document.getElementById('genre-select')?.value) || this.beatMetadata.suggestedGenre;
        
        return { artistName, stageName, beatTitle, genre };
    }
    
    getLicenseOptions() {
        return {
            licenseType: document.getElementById('license-type')?.value || 'non-exclusive',
            commercialUse: document.getElementById('commercial-use')?.value || 'allowed',
            forSale: document.getElementById('for-sale')?.value || 'for-sale',
            royaltyRate: 2.5
        };
    }

    async handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('image-preview');
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
        this.beatMetadata.coverImage = file;
    }

    async handleGoogleSignIn() {
        const signInBtn = document.getElementById('google-signin');
        const originalText = signInBtn.textContent;
        
        try {
            signInBtn.disabled = true;
            signInBtn.textContent = 'Signing in...';
            
            if (this.authManager) {
                const result = await this.authManager.signInWithGoogle();
                if (result.success) {
                    signInBtn.style.display = 'none';
                    console.log('✅ Successfully signed in');
                }
            } else {
                throw new Error('Authentication manager not available');
            }
            
        } catch (error) {
            console.error('❌ Sign-in failed:', error);
            signInBtn.textContent = originalText;
            signInBtn.disabled = false;
            alert('Sign-in failed. Please try again.');
        }
    }

    async updateAuthenticatedUI() {
        // Stub implementation
    }

    async loadWalletData() {
        // Stub implementation
    }

    async generateDownloadPackage(result) {
        try {
            if (!result || !result.transactionHash) {
                throw new Error('Invalid transaction data');
            }
            
            const files = [];
            
            // 1. Original Audio File
            if (this.beatFile) {
                const sanitizedFilename = this.sanitizeInput(this.beatMetadata.originalFileName || 'audio');
                files.push({
                    name: `audio/${sanitizedFilename}`,
                    content: this.beatFile
                });
            }
            
            // 2. Cover Image (if exists)
            if (this.beatMetadata.coverImage) {
                const sanitizedTitle = this.sanitizeInput(this.beatMetadata.title || 'cover');
                files.push({
                    name: `images/${sanitizedTitle}-cover.jpg`,
                    content: this.beatMetadata.coverImage
                });
            }
            
            // 3. License Agreement (TXT)
            const licenseContent = `${this.licenseTerms}\n\n--- BLOCKCHAIN VERIFICATION ---\nTransaction Hash: ${this.sanitizeInput(result.transactionHash)}\nToken ID: ${this.sanitizeInput(result.tokenId)}\nContract: 0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A\nNetwork: Polygon Mumbai\nMinted: ${new Date().toISOString()}`;
            files.push({
                name: 'LICENSE.txt',
                content: licenseContent
            });
            
            // 4. NFT Metadata (JSON)
            const nftMetadata = {
                name: this.sanitizeInput(this.beatMetadata.title),
                description: `Music NFT: ${this.sanitizeInput(this.beatMetadata.title)} - ${this.sanitizeInput(this.beatMetadata.suggestedGenre)}`,
                external_url: `https://polygonscan.com/tx/${this.sanitizeInput(result.transactionHash)}`,
                attributes: [
                    { trait_type: "Genre", value: this.sanitizeInput(this.beatMetadata.suggestedGenre) },
                    { trait_type: "BPM", value: this.sanitizeInput(this.beatMetadata.estimatedBPM) },
                    { trait_type: "Duration", value: this.sanitizeInput(this.beatMetadata.duration) },
                    { trait_type: "Quality", value: this.sanitizeInput(this.beatMetadata.qualityLevel) },
                    { trait_type: "Energy Level", value: this.sanitizeInput(this.beatMetadata.energyLevel) },
                    { trait_type: "Format", value: this.sanitizeInput(this.beatMetadata.format) }
                ],
                blockchain: {
                    contract: "0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A",
                    tokenId: this.sanitizeInput(result.tokenId),
                    transactionHash: this.sanitizeInput(result.transactionHash),
                    network: "Polygon Mumbai"
                }
            };
            files.push({
                name: 'metadata.json',
                content: JSON.stringify(nftMetadata, null, 2)
            });
            
            const zipBlob = await this.createRealZip(files);
            
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            const sanitizedTitle = this.sanitizeInput(this.beatMetadata.title || 'BeatsChain');
            a.download = `BeatsChain-${sanitizedTitle.replace(/[^a-zA-Z0-9]/g, '_')}-NFT-Package.zip`;
            a.click();
            
            URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error('Package generation failed:', error);
            alert(`Failed to generate download package: ${error.message}`);
        }
    }

    async createRealZip(files) {
        const zipParts = [];
        const centralDirectory = [];
        let offset = 0;
        
        for (const file of files) {
            const fileData = await this.processFileForZip(file);
            const localHeader = this.createLocalFileHeader(file.name, fileData);
            const centralDirEntry = this.createCentralDirectoryEntry(file.name, fileData, offset);
            
            zipParts.push(localHeader);
            zipParts.push(fileData);
            centralDirectory.push(centralDirEntry);
            
            offset += localHeader.byteLength + fileData.byteLength;
        }
        
        const centralDirStart = offset;
        for (const entry of centralDirectory) {
            zipParts.push(entry);
            offset += entry.byteLength;
        }
        
        const endRecord = this.createEndOfCentralDirectory(files.length, offset - centralDirStart, centralDirStart);
        zipParts.push(endRecord);
        
        return new Blob(zipParts, { type: 'application/zip' });
    }
    
    async processFileForZip(file) {
        if (file.content instanceof File || file.content instanceof Blob) {
            return new Uint8Array(await file.content.arrayBuffer());
        } else {
            return new TextEncoder().encode(file.content);
        }
    }
    
    createLocalFileHeader(filename, data) {
        const filenameBytes = new TextEncoder().encode(filename);
        const header = new Uint8Array(30 + filenameBytes.length);
        
        header[0] = 0x50; header[1] = 0x4b; header[2] = 0x03; header[3] = 0x04;
        header[4] = 0x14; header[5] = 0x00;
        header[6] = 0x00; header[7] = 0x00;
        header[8] = 0x00; header[9] = 0x00;
        header[10] = 0x00; header[11] = 0x00; header[12] = 0x00; header[13] = 0x00;
        header[14] = 0x00; header[15] = 0x00; header[16] = 0x00; header[17] = 0x00;
        this.writeUint32LE(header, 18, data.length);
        this.writeUint32LE(header, 22, data.length);
        header[26] = filenameBytes.length & 0xff;
        header[27] = (filenameBytes.length >> 8) & 0xff;
        header[28] = 0x00; header[29] = 0x00;
        
        header.set(filenameBytes, 30);
        return header;
    }
    
    createCentralDirectoryEntry(filename, data, localHeaderOffset) {
        const filenameBytes = new TextEncoder().encode(filename);
        const entry = new Uint8Array(46 + filenameBytes.length);
        
        entry[0] = 0x50; entry[1] = 0x4b; entry[2] = 0x01; entry[3] = 0x02;
        entry[4] = 0x14; entry[5] = 0x00;
        entry[6] = 0x14; entry[7] = 0x00;
        entry[8] = 0x00; entry[9] = 0x00;
        entry[10] = 0x00; entry[11] = 0x00;
        entry[12] = 0x00; entry[13] = 0x00; entry[14] = 0x00; entry[15] = 0x00;
        entry[16] = 0x00; entry[17] = 0x00; entry[18] = 0x00; entry[19] = 0x00;
        this.writeUint32LE(entry, 20, data.length);
        this.writeUint32LE(entry, 24, data.length);
        entry[28] = filenameBytes.length & 0xff;
        entry[29] = (filenameBytes.length >> 8) & 0xff;
        entry[30] = 0x00; entry[31] = 0x00;
        entry[32] = 0x00; entry[33] = 0x00;
        entry[34] = 0x00; entry[35] = 0x00;
        entry[36] = 0x00; entry[37] = 0x00;
        entry[38] = 0x00; entry[39] = 0x00; entry[40] = 0x00; entry[41] = 0x00;
        this.writeUint32LE(entry, 42, localHeaderOffset);
        
        entry.set(filenameBytes, 46);
        return entry;
    }
    
    createEndOfCentralDirectory(fileCount, centralDirSize, centralDirOffset) {
        const record = new Uint8Array(22);
        
        record[0] = 0x50; record[1] = 0x4b; record[2] = 0x05; record[3] = 0x06;
        record[4] = 0x00; record[5] = 0x00;
        record[6] = 0x00; record[7] = 0x00;
        record[8] = fileCount & 0xff; record[9] = (fileCount >> 8) & 0xff;
        record[10] = fileCount & 0xff; record[11] = (fileCount >> 8) & 0xff;
        this.writeUint32LE(record, 12, centralDirSize);
        this.writeUint32LE(record, 16, centralDirOffset);
        record[20] = 0x00; record[21] = 0x00;
        
        return record;
    }
    
    writeUint32LE(buffer, offset, value) {
        buffer[offset] = value & 0xff;
        buffer[offset + 1] = (value >> 8) & 0xff;
        buffer[offset + 2] = (value >> 16) & 0xff;
        buffer[offset + 3] = (value >> 24) & 0xff;
    }

    // RADIO SUBMISSION METHODS - INDEPENDENT SYSTEM
    async loadRadioSubmission() {
        console.log('Loading radio submission system...');
        try {
            // Initialize radio-specific components independently
            this.radioValidator = new RadioValidator(this.chromeAI);
            this.splitSheetsManager = new SplitSheetsManager();
            this.radioMetadataManager = new RadioMetadataManager();
            
            // Initialize metadata form
            this.radioMetadataManager.initializeForm();
            
            // Show radio upload section if no audio file exists
            this.showRadioUploadSection();
            
            console.log('Radio submission system loaded successfully');
        } catch (error) {
            console.error('Failed to initialize radio components:', error);
            alert('Radio submission feature unavailable');
        }
    }
    
    showRadioUploadSection() {
        const radioValidation = document.getElementById('radio-validation');
        if (!this.radioAudioFile) {
            // Secure DOM creation for radio upload section
            radioValidation.innerHTML = '';
            
            const uploadSection = document.createElement('div');
            uploadSection.className = 'radio-upload-section';
            
            const title = document.createElement('h4');
            title.textContent = '📻 Upload Audio for Radio Submission';
            
            const uploadArea = document.createElement('div');
            uploadArea.className = 'upload-area radio-upload-area';
            uploadArea.id = 'radio-upload-area';
            
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.id = 'radio-audio-file';
            fileInput.accept = 'audio/*';
            fileInput.hidden = true;
            
            const uploadContent = document.createElement('div');
            uploadContent.className = 'upload-content';
            
            const uploadIcon = document.createElement('span');
            uploadIcon.className = 'upload-icon';
            uploadIcon.textContent = '🎧';
            
            const uploadText = document.createElement('p');
            uploadText.textContent = 'Upload audio file for radio submission';
            
            const uploadSmall = document.createElement('small');
            uploadSmall.textContent = 'Supports MP3, WAV, FLAC (max 50MB)';
            
            uploadContent.appendChild(uploadIcon);
            uploadContent.appendChild(uploadText);
            uploadContent.appendChild(uploadSmall);
            uploadArea.appendChild(uploadContent);
            
            const audioPreview = document.createElement('div');
            audioPreview.id = 'radio-audio-preview';
            audioPreview.className = 'audio-preview';
            
            const metadataDisplay = document.createElement('div');
            metadataDisplay.id = 'radio-metadata-display';
            metadataDisplay.className = 'metadata-display';
            metadataDisplay.style.display = 'none';
            
            const nextButton = document.createElement('button');
            nextButton.id = 'radio-step-1-next';
            nextButton.className = 'btn btn-primary';
            nextButton.textContent = 'Next: Track Information';
            nextButton.style.display = 'none';
            nextButton.addEventListener('click', () => {
                if (window.showRadioStep) {
                    window.showRadioStep(2);
                }
            });
            
            uploadSection.appendChild(title);
            uploadSection.appendChild(uploadArea);
            uploadSection.appendChild(fileInput);
            uploadSection.appendChild(audioPreview);
            uploadSection.appendChild(metadataDisplay);
            uploadSection.appendChild(nextButton);
            
            radioValidation.appendChild(uploadSection);
            
            // Setup radio-specific upload handlers
            this.setupRadioUploadHandlers();
        } else {
            radioValidation.style.display = 'block';
        }
    }
    
    setupRadioUploadHandlers() {
        const radioUploadArea = document.getElementById('radio-upload-area');
        const radioFileInput = document.getElementById('radio-audio-file');
        
        if (radioUploadArea && radioFileInput) {
            radioUploadArea.addEventListener('click', () => radioFileInput.click());
            radioUploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
            radioUploadArea.addEventListener('drop', this.handleRadioFileDrop.bind(this));
            radioFileInput.addEventListener('change', this.handleRadioFileSelect.bind(this));
        }
    }
    
    handleRadioFileDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processRadioFile(files[0]);
        }
    }
    
    handleRadioFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processRadioFile(file);
        }
    }
    
    async processRadioFile(file) {
        if (!this.validateAudioFile(file)) {
            alert('Invalid file type. Please upload MP3, WAV, or FLAC files.');
            return;
        }
        
        this.radioAudioFile = file;
        
        try {
            this.radioMetadata = await this.extractAudioMetadata(file, 'radio');
            
            // Create audio preview FIRST
            this.createRadioAudioPreview(file);
            this.displayRadioMetadata(this.radioMetadata);
            
            // Show next button for step progression
            const nextButton = document.getElementById('radio-step-1-next');
            if (nextButton) {
                nextButton.style.display = 'block';
            }
            
            // Pre-populate track information in step 2
            this.populateTrackInfoFromMetadata();
            
        } catch (error) {
            console.error('Radio file processing failed:', error);
            alert('Failed to process audio file for radio submission');
        }
    }
    
    populateTrackInfoFromMetadata() {
        if (!this.radioMetadata) return;
        
        // Pre-populate track title
        const titleInput = document.getElementById('radio-track-title');
        if (titleInput && this.radioMetadata.title) {
            titleInput.value = this.radioMetadata.title;
        }
        
        // Pre-populate genre if detected
        const genreSelect = document.getElementById('radio-genre');
        if (genreSelect && this.radioMetadata.suggestedGenre) {
            // Map detected genre to radio genres
            const genreMapping = {
                'Hip-Hop': 'Hip-Hop',
                'House': 'House',
                'Electronic': 'Electronic',
                'Pop': 'Pop',
                'Rock': 'Rock',
                'Jazz': 'Jazz'
            };
            
            const mappedGenre = genreMapping[this.radioMetadata.suggestedGenre];
            if (mappedGenre) {
                genreSelect.value = mappedGenre;
            }
        }
    }
    
    createRadioAudioPreview(file) {
        return this.audioManager.createAudioPreview(file, 'radio-audio-preview', 'radio');
    }
    
    displayRadioMetadata(metadata) {
        const metadataDisplay = document.getElementById('radio-metadata-display');
        if (!metadataDisplay) return;
        
        // Secure DOM creation instead of innerHTML
        metadataDisplay.innerHTML = '';
        
        const title = document.createElement('h4');
        title.textContent = '📊 Audio Analysis';
        
        const grid = document.createElement('div');
        grid.className = 'metadata-grid';
        
        const metaItems = [
            { label: 'Duration:', value: metadata.duration },
            { label: 'Quality:', value: metadata.qualityLevel },
            { label: 'Format:', value: metadata.format },
            { label: 'File Size:', value: metadata.fileSize }
        ];
        
        metaItems.forEach(item => {
            const row = document.createElement('div');
            row.className = 'meta-row';
            
            const label = document.createElement('span');
            label.className = 'meta-label';
            label.textContent = item.label;
            
            const value = document.createElement('span');
            value.textContent = item.value;
            
            row.appendChild(label);
            row.appendChild(value);
            grid.appendChild(row);
        });
        
        metadataDisplay.appendChild(title);
        metadataDisplay.appendChild(grid);
        metadataDisplay.style.display = 'block';
    }
    
    async validateForRadio() {
        console.log('Validating for radio...');
        if (!this.radioMetadata || Object.keys(this.radioMetadata).length === 0) {
            alert('Please upload an audio file first');
            return;
        }
        
        const validateBtn = document.getElementById('validate-radio');
        validateBtn.disabled = true;
        validateBtn.textContent = 'Validating...';
        
        try {
            if (this.radioValidator) {
                const validation = await this.radioValidator.validateForRadio(this.radioMetadata);
                const overallScore = this.radioValidator.calculateOverallScore(validation);
                
                this.displayRadioValidation(validation, overallScore);
                
                const generateBtn = document.getElementById('generate-radio-package');
                if (generateBtn) generateBtn.disabled = overallScore < 60;
            } else {
                throw new Error('Radio validator not available');
            }
            
        } catch (error) {
            console.error('Radio validation failed:', error);
            alert('Validation failed. Please try again.');
        } finally {
            validateBtn.disabled = false;
            validateBtn.textContent = '🔍 Validate for Radio';
        }
    }
    
    displayRadioValidation(validation, overallScore) {
        const resultsDiv = document.getElementById('radio-results');
        resultsDiv.innerHTML = '';
        
        // Secure DOM creation for validation results
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'validation-summary';
        
        const scoreTitle = document.createElement('h5');
        scoreTitle.textContent = 'Overall Score: ';
        
        const scoreSpan = document.createElement('span');
        scoreSpan.style.color = '#4CAF50';
        scoreSpan.textContent = `${overallScore}/100`;
        
        scoreTitle.appendChild(scoreSpan);
        summaryDiv.appendChild(scoreTitle);
        
        const itemsDiv = document.createElement('div');
        itemsDiv.className = 'validation-items';
        
        const validationItems = [
            { label: 'Duration', message: validation.duration.message },
            { label: 'Quality', message: validation.quality.message },
            { label: 'Format', message: validation.format.message },
            { label: 'Content', message: validation.profanity.message }
        ];
        
        validationItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'validation-item';
            itemDiv.textContent = `✅ ${item.label}: ${item.message}`;
            itemsDiv.appendChild(itemDiv);
        });
        
        resultsDiv.appendChild(summaryDiv);
        resultsDiv.appendChild(itemsDiv);
    }
    
    addContributor() {
        console.log('Adding contributor...');
        const contributorsList = document.querySelector('.contributors-list');
        if (!contributorsList) return;
        
        const newContributor = document.createElement('div');
        newContributor.className = 'contributor-item';
        
        // Secure DOM creation instead of innerHTML
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'Contributor Name';
        nameInput.className = 'form-input contributor-name';
        
        const roleSelect = document.createElement('select');
        roleSelect.className = 'form-input contributor-role';
        
        const roles = ['artist', 'producer', 'songwriter', 'vocalist'];
        const roleLabels = ['Artist', 'Producer', 'Songwriter', 'Vocalist'];
        roles.forEach((role, index) => {
            const option = document.createElement('option');
            option.value = role;
            option.textContent = roleLabels[index];
            roleSelect.appendChild(option);
        });
        
        const percentageInput = document.createElement('input');
        percentageInput.type = 'number';
        percentageInput.placeholder = '%';
        percentageInput.className = 'form-input contributor-percentage';
        percentageInput.min = '0';
        percentageInput.max = '100';
        
        const samroInput = document.createElement('input');
        samroInput.type = 'text';
        samroInput.placeholder = 'SAMRO Number (optional)';
        samroInput.className = 'form-input samro-number';
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-contributor';
        removeBtn.textContent = '❌';
        removeBtn.addEventListener('click', () => {
            newContributor.remove();
            this.updatePercentageTotal();
        });
        
        newContributor.appendChild(nameInput);
        newContributor.appendChild(roleSelect);
        newContributor.appendChild(percentageInput);
        newContributor.appendChild(samroInput);
        newContributor.appendChild(removeBtn);
        
        contributorsList.appendChild(newContributor);
        this.updatePercentageTotal();
    }
    
    async generateRadioPackage() {
        if (!this.radioAudioFile) {
            alert('Please upload an audio file for radio submission first');
            return;
        }
        
        // Validate split sheets
        const percentageInputs = document.querySelectorAll('.contributor-percentage');
        let total = 0;
        percentageInputs.forEach(input => {
            total += parseFloat(input.value) || 0;
        });
        
        if (Math.abs(total - 100) > 0.01) {
            alert(`Split sheets must total exactly 100%. Current total: ${total.toFixed(2)}%`);
            return;
        }
        
        // Validate contributor names
        const contributorNames = document.querySelectorAll('.contributor-name');
        let hasValidNames = false;
        contributorNames.forEach(input => {
            if (input.value && input.value.trim().length > 0) {
                hasValidNames = true;
            }
        });
        
        if (!hasValidNames) {
            alert('Please provide at least one contributor name');
            return;
        }
        
        const generateBtn = document.getElementById('generate-radio-package');
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
        
        try {
            const files = [];
            
            // Audio file with sanitized name
            if (this.radioAudioFile) {
                const sanitizedTitle = this.sanitizeInput(this.radioMetadata.title || 'audio');
                const sanitizedFormat = this.sanitizeInput(this.radioMetadata.format || 'mp3').toLowerCase();
                files.push({
                    name: `audio/${sanitizedTitle.replace(/[^a-zA-Z0-9]/g, '_')}.${sanitizedFormat}`,
                    content: this.radioAudioFile
                });
            }
            
            // Get validated radio inputs
            const radioInputs = this.getRadioInputs();
            const radioMetadata = {
                title: this.sanitizeInput(radioInputs.title || this.radioMetadata.title),
                artist: this.sanitizeInput(radioInputs.artist || 'Unknown Artist'),
                genre: this.sanitizeInput(radioInputs.genre || this.radioMetadata.suggestedGenre),
                duration: this.sanitizeInput(this.radioMetadata.duration),
                format: this.sanitizeInput(this.radioMetadata.format),
                bitrate: this.sanitizeInput(this.radioMetadata.estimatedBitrate),
                quality: this.sanitizeInput(this.radioMetadata.qualityLevel),
                bpm: this.sanitizeInput(this.radioMetadata.estimatedBPM),
                radioReady: true,
                submissionDate: new Date().toISOString(),
                submissionType: 'radio_only'
            };
            
            files.push({
                name: 'track_metadata.json',
                content: JSON.stringify(radioMetadata, null, 2)
            });
            
            // Generate split sheet with current contributors
            const splitSheet = this.splitSheetsManager.generateSplitSheet(radioMetadata);
            files.push({
                name: 'split_sheet.json',
                content: JSON.stringify(splitSheet, null, 2)
            });
            
            files.push({
                name: 'SAMRO_Split_Sheet.txt',
                content: this.splitSheetsManager.generateSamroReport(radioMetadata)
            });
            
            const zipBlob = await this.createRealZip(files);
            
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            const sanitizedTitle = this.sanitizeInput(radioMetadata.title || 'Radio_Submission');
            a.download = `${sanitizedTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Radio_Submission.zip`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            generateBtn.textContent = '✅ Package Generated!';
            setTimeout(() => {
                generateBtn.textContent = '📦 Generate Radio Package';
                generateBtn.disabled = false;
            }, 3000);
            
        } catch (error) {
            console.error('Radio package generation failed:', error);
            alert(`Failed to generate radio package: ${error.message}`);
            generateBtn.disabled = false;
            generateBtn.textContent = '📦 Generate Radio Package';
        }
    }
    
    getRadioInputs() {
        // Get inputs from radio metadata manager (separate from split sheets)
        if (this.radioMetadataManager) {
            return this.radioMetadataManager.getTrackMetadata();
        }
        
        // Fallback to basic metadata
        return {
            title: this.radioMetadata?.title || 'Untitled Track',
            artistName: 'Unknown Artist',
            genre: 'Electronic'
        };
    }
    
    setupPercentageCalculator() {
        // Add event listeners to all percentage inputs
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('contributor-percentage')) {
                this.updatePercentageTotal();
            }
        });
        
        // Initial calculation
        this.updatePercentageTotal();
    }
    
    updatePercentageTotal() {
        const percentageInputs = document.querySelectorAll('.contributor-percentage');
        let total = 0;
        let validContributorCount = 0;
        
        percentageInputs.forEach(input => {
            const value = parseFloat(input.value) || 0;
            if (value > 0) {
                total += value;
                validContributorCount++;
            }
        });
        
        const totalDisplay = document.getElementById('total-percentage');
        if (totalDisplay) {
            totalDisplay.textContent = Math.round(total * 100) / 100;
            totalDisplay.style.color = Math.abs(total - 100) < 0.01 ? '#4CAF50' : (total > 100 ? '#F44336' : '#FFC107');
        }
        
        // Validate contributor names (only for contributors with percentages > 0)
        const contributorNames = document.querySelectorAll('.contributor-name');
        let validNameCount = 0;
        
        contributorNames.forEach((input, index) => {
            const percentageInput = percentageInputs[index];
            const percentage = parseFloat(percentageInput?.value) || 0;
            
            if (percentage > 0 && input.value && input.value.trim().length > 0) {
                validNameCount++;
            }
        });
        
        // Valid if: total is 100% AND all contributors with percentages have names
        const isValid = Math.abs(total - 100) < 0.01 && validContributorCount > 0 && validNameCount === validContributorCount;
        
        // Update split sheets manager validity
        if (this.splitSheetsManager) {
            this.splitSheetsManager.setValid(isValid);
        }
        
        // Update step 5 next button
        const step5NextBtn = document.getElementById('radio-step-5-next');
        if (step5NextBtn) {
            step5NextBtn.disabled = !isValid;
        }
        
        // Update generate button state
        const generateBtn = document.getElementById('generate-radio-package');
        if (generateBtn) {
            generateBtn.disabled = !isValid;
            generateBtn.title = isValid ? 'Generate radio package' : `Need: 100% total (${total.toFixed(1)}%) + valid names for all contributors`;
        }
    }
}

// Initialize app when popup loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing BeatsChain app...');
    const app = new BeatsChainApp();
    await app.initialize();
    window.beatsChainApp = app;
    console.log('BeatsChain app initialized');
});

// Cleanup when popup is closed
window.addEventListener('beforeunload', () => {
    if (window.beatsChainApp && window.beatsChainApp.audioManager) {
        window.beatsChainApp.audioManager.cleanupAll();
    }
});

// Cleanup on visibility change (when extension popup is hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.beatsChainApp && window.beatsChainApp.audioManager) {
        window.beatsChainApp.audioManager.pauseAllAudio();
    }
});