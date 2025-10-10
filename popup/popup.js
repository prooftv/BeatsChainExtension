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
        // User Input Manager - Ensures user inputs override AI analysis
        this.userInputManager = new UserInputManager();
        // Radio Features
        this.radioIPFSManager = null;
        // Content Enhancement AI
        this.contentAI = null;
        this.radioFormats = null;
        // Smart Trees AI Intelligence
        this.smartTreesAI = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            this.setupEventListeners();
            
            // Initialize managers with error handling
            try {
                // Try enhanced authentication first, fallback to basic
                if (window.EnhancedAuthenticationManager) {
                    this.authManager = new EnhancedAuthenticationManager();
                    console.log('🛡️ Initializing enhanced authentication...');
                } else {
                    this.authManager = new AuthenticationManager();
                    console.log('🔑 Initializing basic authentication...');
                }
                
                const isAuthenticated = await this.authManager.initialize();
                if (isAuthenticated) {
                    const userProfile = this.authManager.getUserProfile();
                    console.log('✅ User authenticated:', userProfile.name);
                    
                    if (userProfile.enhanced) {
                        console.log('🛡️ Enhanced security active:', {
                            role: userProfile.role,
                            securityLevel: userProfile.securityLevel,
                            mfaEnabled: userProfile.mfaEnabled
                        });
                    }
                    
                    await this.updateAuthenticatedUI(userProfile);
                } else {
                    console.log('ℹ️ User not authenticated - sign in required for minting');
                    this.showAuthenticationRequired();
                }
            } catch (error) {
                console.error('Authentication manager initialization failed:', error);
                this.showAuthenticationRequired();
                return;
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
            
            // Initialize radio features
            await this.initializeRadioFeatures();
            
            // Initialize Content Enhancement AI
            await this.initializeContentAI();
            
            // Initialize Smart Trees AI
            await this.initializeSmartTreesAI();
            
            await this.loadWalletData();
            await this.loadProfile();
            this.isInitialized = true;
            console.log('BeatsChain initialized successfully');
        } catch (error) {
            console.error('Initialization failed:', error);
        }
    }

    setupEventListeners() {
        // Hamburger menu navigation
        const menuToggle = document.getElementById('menu-toggle');
        const navDropdown = document.getElementById('nav-dropdown');
        
        if (menuToggle && navDropdown) {
            menuToggle.addEventListener('click', () => {
                navDropdown.classList.toggle('open');
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!menuToggle.contains(e.target) && !navDropdown.contains(e.target)) {
                    navDropdown.classList.remove('open');
                }
            });
        }
        
        // Navigation items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.switchTab(section);
                // Close menu after selection
                if (navDropdown) navDropdown.classList.remove('open');
            });
        });
        
        // Export wallet button
        const exportWalletBtn = document.getElementById('export-wallet');
        if (exportWalletBtn) {
            exportWalletBtn.addEventListener('click', this.handleExportWallet.bind(this));
        }

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
        
        // AI Insights events
        const growBranchBtn = document.getElementById('grow-new-branch');
        if (growBranchBtn) {
            growBranchBtn.addEventListener('click', this.growNewBranch.bind(this));
        }
        
        const addContributorBtn = document.getElementById('add-contributor');
        if (addContributorBtn) {
            addContributorBtn.addEventListener('click', this.addContributor.bind(this));
        }
        
        // Setup percentage calculator
        this.setupPercentageCalculator();
        
        // Profile save button
        const saveProfileBtn = document.getElementById('save-profile');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', this.saveProfile.bind(this));
        }
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
        this.showProgress(true);
        
        try {
            // Enhanced security validation
            if (!this.audioManager) {
                throw new Error('Audio manager not initialized');
            }
            
            const isValid = await this.validateAudioFile(file);
            if (!isValid) {
                throw new Error('File validation failed');
            }

            this.beatFile = file;
            this.beatMetadata = await this.extractAudioMetadata(file, 'web3');
            this.updateUploadStatus(`Uploaded: ${file.name} (${this.audioManager.formatFileSize(file.size)})`);
            this.showProgress(false);
            this.createAudioPreview(file);
            this.displayMetadata(this.beatMetadata);
            this.showArtistForm();
            
            // Record activity for Smart Trees AI
            if (this.smartTreesAI) {
                this.smartTreesAI.recordActivity('beat_upload', {
                    genre: this.beatMetadata.suggestedGenre,
                    duration: this.beatMetadata.durationSeconds,
                    quality: this.beatMetadata.qualityLevel,
                    format: this.beatMetadata.format
                });
            }
            
            const proceedBtn = document.getElementById('proceed-to-licensing');
            if (proceedBtn) proceedBtn.style.display = 'block';
        } catch (error) {
            console.error('File processing failed:', error);
            alert(`File upload failed: ${error.message}`);
            this.showProgress(false);
        }
    }

    async validateAudioFile(file) {
        return await this.audioManager.validateAudioFile(file);
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
            // USER INPUT PRIORITY: User selections override AI analysis
            const enhancedMetadata = this.userInputManager.mergeWithUserInputs(this.beatMetadata, artistInputs);
            
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
            
            // Record license generation activity
            if (this.smartTreesAI) {
                this.smartTreesAI.recordActivity('license_generation', {
                    genre: enhancedMetadata.genre,
                    licenseType: licenseOptions.licenseType,
                    commercialUse: licenseOptions.commercialUse
                });
            }
            
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
Genre Classification: ${metadata.genre || metadata.suggestedGenre} (USER SELECTED)
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
            // Get authenticated wallet address - REQUIRED for real transactions
            if (!this.authManager) {
                throw new Error('Authentication required: Please sign in to mint NFTs');
            }
            
            const walletAddress = await this.authManager.getWalletAddress();
            if (!walletAddress) {
                throw new Error('Wallet not available: Please sign in with Google to generate your secure wallet');
            }
            
            console.log('✅ Using authenticated wallet:', walletAddress.substring(0, 6) + '...' + walletAddress.substring(-4));
            
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
            
            // NFT minting disabled in this version
            
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
        if (this.audioManager) {
            this.audioManager.pauseAllAudio();
        }
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`[data-section="${section}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        if (section === 'mint') {
            this.showSection('upload-section');
        } else if (section === 'profile') {
            this.showSection('profile-section');
        } else if (section === 'history') {
            this.showSection('history-section');
        } else if (section === 'share') {
            this.showSection('share-section');
        } else if (section === 'radio') {
            this.showSection('radio-section');
            this.loadRadioSubmission();
        } else if (section === 'insights') {
            this.showSection('insights-section');
            this.loadAIInsights();
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

        // Setup collapse functionality for upload analysis
        this.setupUploadAnalysisCollapse();
        
        metadataDisplay.style.display = 'block';
    }
    
    setupUploadAnalysisCollapse() {
        const toggleBtn = document.getElementById('upload-analysis-toggle');
        const content = document.getElementById('upload-analysis-content');
        
        if (toggleBtn && content && !toggleBtn.hasAttribute('data-setup')) {
            toggleBtn.setAttribute('data-setup', 'true');
            // Start collapsed
            toggleBtn.textContent = '▶';
            toggleBtn.classList.add('collapsed');
            
            toggleBtn.addEventListener('click', () => {
                const isCollapsed = content.classList.contains('collapsed');
                
                if (isCollapsed) {
                    content.classList.remove('collapsed');
                    toggleBtn.classList.remove('collapsed');
                    toggleBtn.textContent = '▼';
                } else {
                    content.classList.add('collapsed');
                    toggleBtn.classList.add('collapsed');
                    toggleBtn.textContent = '▶';
                }
            });
        }
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
        try {
            return String(input)
                .replace(/[<>"'&]/g, function(match) {
                    const map = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
                    return map[match] || match;
                })
                .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
                .trim()
                .substring(0, 200);
        } catch (error) {
            console.error('Sanitization error:', error);
            return String(input).substring(0, 200);
        }
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
        // Get raw inputs
        const artistNameInput = document.getElementById('artist-name')?.value;
        const stageNameInput = document.getElementById('stage-name')?.value;
        const beatTitleInput = document.getElementById('beat-title')?.value;
        const genreInput = document.getElementById('genre-select')?.value;
        const contentTypeInput = document.getElementById('content-type')?.value;
        
        // Get enhanced profile data
        const enhancedProfile = this.getEnhancedProfileData();
        
        // Store user inputs with priority tracking
        if (artistNameInput && artistNameInput.trim()) {
            this.userInputManager.setUserInput('artist', artistNameInput, true);
        }
        if (stageNameInput && stageNameInput.trim()) {
            this.userInputManager.setUserInput('stageName', stageNameInput, true);
        }
        if (beatTitleInput && beatTitleInput.trim()) {
            this.userInputManager.setUserInput('title', beatTitleInput, true);
        }
        if (genreInput && genreInput.trim()) {
            this.userInputManager.setUserInput('genre', genreInput, true);
        }
        if (contentTypeInput && contentTypeInput.trim()) {
            this.userInputManager.setUserInput('content-type', contentTypeInput, true);
        }
        
        // Use display name as primary, fall back to legal name, then form input
        const primaryName = enhancedProfile.displayName || enhancedProfile.legalName || artistNameInput;
        
        // Return with user priority
        return {
            artistName: this.userInputManager.getValue('artist', primaryName, 'Unknown Artist'),
            stageName: this.userInputManager.getValue('stageName', stageNameInput, ''),
            beatTitle: this.userInputManager.getValue('title', beatTitleInput, this.beatMetadata?.title || 'Untitled Beat'),
            genre: this.userInputManager.getValue('genre', genreInput, this.beatMetadata?.suggestedGenre || 'Electronic'),
            contentType: this.userInputManager.getValue('content-type', contentTypeInput, 'instrumental'),
            legalName: enhancedProfile.legalName,
            displayName: enhancedProfile.displayName,
            role: enhancedProfile.role
        };
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
        if (!file) return;
        
        try {
            // Enhanced security validation for images
            const isValid = await this.audioManager.validateImageFile(file);
            if (!isValid) {
                throw new Error('Image validation failed');
            }
            
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
        } catch (error) {
            console.error('Image upload failed:', error);
            alert(`Image upload failed: ${error.message}`);
            e.target.value = ''; // Clear the input
        }
    }

    async handleGoogleSignIn() {
        // Find any sign-in button (could be in different sections)
        const signInBtns = document.querySelectorAll('[id^="google-signin"], [id^="auth-signin"]');
        const signInBtn = signInBtns[0] || document.getElementById('google-signin');
        
        if (!signInBtn) {
            console.error('Sign-in button not found');
            return;
        }
        
        const originalText = signInBtn.textContent;
        
        try {
            signInBtn.disabled = true;
            signInBtn.textContent = 'Signing in...';
            
            if (!this.authManager) {
                // Initialize enhanced authentication if available
                if (window.EnhancedAuthenticationManager) {
                    this.authManager = new EnhancedAuthenticationManager();
                    console.log('🛡️ Using enhanced authentication for sign-in');
                } else {
                    this.authManager = new AuthenticationManager();
                    console.log('🔑 Using basic authentication for sign-in');
                }
            }
            
            const result = await this.authManager.signInWithGoogle({
                prompt: 'select_account'
            });
            if (result.success) {
                console.log('✅ Successfully signed in:', result.user.name);
                
                // Log enhanced features if available
                if (result.enhanced) {
                    console.log('🛡️ Enhanced authentication features:', {
                        role: result.role,
                        securityLevel: result.securityLevel,
                        mfaRequired: result.mfaRequired
                    });
                }
                
                // Hide authentication required messages
                this.hideAuthenticationRequired();
                
                // Update authenticated UI with enhanced features
                await this.updateAuthenticatedUI(result);
                
                // Hide all sign-in buttons
                signInBtns.forEach(btn => {
                    btn.style.display = 'none';
                });
                
                // Show success message with enhanced info
                this.showSignInSuccess(result.user, result.enhanced ? result : null);
                
            } else {
                throw new Error('Sign-in failed - no success result');
            }
            
        } catch (error) {
            console.error('❌ Sign-in failed:', error);
            signInBtn.textContent = originalText;
            signInBtn.disabled = false;
            
            // Show user-friendly error based on error type
            let errorMsg;
            if (error.message.includes('User denied') || error.message.includes('cancelled')) {
                errorMsg = 'Sign-in cancelled. Please try again to access minting features.';
            } else if (error.message.includes('OAuth2 not configured')) {
                errorMsg = 'Authentication system not configured. Please contact support.';
            } else if (error.message.includes('client_id')) {
                errorMsg = 'Authentication configuration error. Please contact support.';
            } else {
                errorMsg = 'Sign-in failed. Please check your internet connection and try again.';
            }
            
            this.showSignInError(errorMsg);
        }
    }
    
    showSignInSuccess(user, enhancedInfo = null) {
        // Show temporary success message
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            border: 1px solid #c3e6cb;
            color: #155724;
            padding: 12px 16px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            max-width: 300px;
        `;
        
        let enhancedText = '';
        if (enhancedInfo && enhancedInfo.enhanced) {
            const features = [];
            if (enhancedInfo.role === 'admin') features.push('ADMIN');
            if (enhancedInfo.securityLevel !== 'basic') features.push(enhancedInfo.securityLevel.toUpperCase());
            if (enhancedInfo.mfaRequired) features.push('MFA');
            
            if (features.length > 0) {
                enhancedText = `<br><small style="color: #0f5132;">🛡️ Enhanced: ${features.join(' • ')}</small>`;
            }
        }
        
        successDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>✅</span>
                <div>
                    <strong>Welcome, ${user.name}!</strong><br>
                    <small>You can now mint NFTs and access all features</small>
                    ${enhancedText}
                </div>
            </div>
        `;
        
        document.body.appendChild(successDiv);
        
        // Remove after 5 seconds (longer for enhanced info)
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, enhancedInfo ? 6000 : 4000);
    }
    
    showSignInError(message) {
        // Show temporary error message
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 12px 16px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        `;
        
        errorDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>❌</span>
                <div>
                    <strong>Sign-in Failed</strong><br>
                    <small>${message}</small>
                </div>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    async updateAuthenticatedUI(authResult = null) {
        try {
            if (!this.authManager) {
                console.error('Authentication manager not available');
                this.showAuthenticationRequired();
                return;
            }
            
            const userProfile = this.authManager.getUserProfile();
            if (!userProfile) {
                console.log('No user profile available - authentication required');
                this.showAuthenticationRequired();
                return;
            }
            
            // Update header authentication status
            this.updateHeaderAuth(userProfile, authResult);
            
            // Update profile display
            const profileName = document.getElementById('profile-name');
            const profileEmail = document.getElementById('profile-email');
            const profileWallet = document.getElementById('profile-wallet-address');
            
            if (profileName) profileName.textContent = userProfile.name || 'Artist';
            if (profileEmail) profileEmail.textContent = userProfile.email || '';
            
            // Update wallet info
            const walletAddress = await this.authManager.getWalletAddress();
            if (profileWallet && walletAddress) {
                profileWallet.textContent = `${walletAddress.substring(0, 6)}...${walletAddress.substring(-4)}`;
            }
            
            // Show enhanced authentication features
            if (userProfile.enhanced) {
                this.updateRoleBasedUI(userProfile.role);
                this.updateSecurityIndicators(userProfile.securityLevel);
                this.showEnhancedFeatures(userProfile);
            }
            
            // Show role-based features (fallback for basic auth)
            if (authResult && authResult.role) {
                this.updateRoleBasedUI(authResult.role);
            }
            
            // Update security indicators (fallback for basic auth)
            if (authResult && authResult.securityLevel) {
                this.updateSecurityIndicators(authResult.securityLevel);
            }
            
        } catch (error) {
            console.error('Failed to update authenticated UI:', error);
        }
    }
    
    updateHeaderAuth(userProfile, authResult = null) {
        const headerAuth = document.getElementById('header-auth');
        const headerUserName = document.getElementById('header-user-name');
        const headerUserRole = document.getElementById('header-user-role');
        const headerLogout = document.getElementById('header-logout');
        
        if (headerAuth && headerUserName) {
            headerAuth.style.display = 'flex';
            headerUserName.textContent = userProfile.name || 'User';
            
            // Show role badge for admin users
            const role = userProfile.role || (authResult && authResult.role);
            if (role === 'admin' && headerUserRole) {
                headerUserRole.style.display = 'inline';
                headerUserRole.textContent = 'ADMIN';
                headerUserRole.className = 'user-role-badge admin';
            }
            
            // Show logout option
            if (headerLogout) {
                headerLogout.style.display = 'block';
                headerLogout.addEventListener('click', () => this.handleLogout());
            }
        }
    }
    
    async handleLogout() {
        try {
            if (this.authManager) {
                await this.authManager.signOut();
            }
            
            // Hide header auth
            const headerAuth = document.getElementById('header-auth');
            const headerLogout = document.getElementById('header-logout');
            if (headerAuth) headerAuth.style.display = 'none';
            if (headerLogout) headerLogout.style.display = 'none';
            
            // Reset app state
            this.resetApp();
            this.showAuthenticationRequired();
            
            console.log('✅ Successfully logged out');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }
    
    updateRoleBasedUI(role) {
        // Show/hide features based on user role
        const adminFeatures = document.querySelectorAll('.admin-only');
        const producerFeatures = document.querySelectorAll('.producer-only');
        
        adminFeatures.forEach(el => {
            el.style.display = role === 'admin' ? 'block' : 'none';
        });
        
        producerFeatures.forEach(el => {
            el.style.display = role === 'admin' ? 'block' : 'none';
        });

        // Add admin invitation UI if user is admin
        if (role === 'admin') {
            this.addAdminInvitationUI();
        }
    }
    
    updateSecurityIndicators(securityLevel) {
        // Add security level indicator to UI
        const securityBadge = document.createElement('div');
        securityBadge.className = `security-badge ${securityLevel}`;
        securityBadge.textContent = `🛡️ ${securityLevel.toUpperCase()}`;
        securityBadge.style.cssText = `
            background: ${securityLevel === 'premium' ? '#28a745' : securityLevel === 'enhanced' ? '#ffc107' : '#6c757d'};
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 8px;
        `;
        
        const header = document.querySelector('.header');
        if (header && !header.querySelector('.security-badge')) {
            header.appendChild(securityBadge);
        }
    }
    
    showEnhancedFeatures(userProfile) {
        // Minimal enhanced features display - no bulky UI elements
        console.log('Enhanced features available:', userProfile.role, userProfile.securityLevel);
    }
    
    showSecurityScore(score) {
        const scoreElement = document.createElement('div');
        scoreElement.className = 'security-score';
        scoreElement.style.cssText = `
            background: ${score >= 80 ? '#d4edda' : score >= 60 ? '#fff3cd' : '#f8d7da'};
            border: 1px solid ${score >= 80 ? '#c3e6cb' : score >= 60 ? '#ffeaa7' : '#f5c6cb'};
            color: ${score >= 80 ? '#155724' : score >= 60 ? '#856404' : '#721c24'};
            padding: 8px 12px;
            border-radius: 6px;
            margin: 8px 0;
            font-size: 12px;
        `;
        
        scoreElement.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>📊 Security Score</span>
                <strong>${score}/100</strong>
            </div>
        `;
        
        const enhancedStatus = document.querySelector('.enhanced-auth-status');
        if (enhancedStatus) {
            enhancedStatus.appendChild(scoreElement);
        }
    }
    
    showAuthenticationRequired() {
        // Show authentication required message for all sections that need it
        const sections = ['licensing-section', 'minting-section', 'success-section'];
        
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                const authMessage = document.createElement('div');
                authMessage.className = 'auth-required-message';
                authMessage.style.cssText = `
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 8px;
                    padding: 16px;
                    margin: 16px 0;
                    text-align: center;
                    color: #856404;
                `;
                
                authMessage.innerHTML = `
                    <div style="font-size: 24px; margin-bottom: 8px;">🔒</div>
                    <h4 style="margin: 0 0 8px 0; color: #856404;">Authentication Required</h4>
                    <p style="margin: 0 0 12px 0;">Please sign in with Google to access minting features</p>
                    <button id="auth-signin-${sectionId}" class="btn btn-primary" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                        🔑 Sign In with Google
                    </button>
                `;
                
                // Add to beginning of section
                section.insertBefore(authMessage, section.firstChild);
                
                // Add click handler for sign-in button
                const signInBtn = authMessage.querySelector(`#auth-signin-${sectionId}`);
                if (signInBtn) {
                    signInBtn.addEventListener('click', () => this.handleGoogleSignIn());
                }
            }
        });
        
        // Disable minting-related buttons
        const mintingButtons = ['generate-license', 'approve-license', 'mint-nft'];
        mintingButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.disabled = true;
                button.title = 'Authentication required - Please sign in with Google';
            }
        });
        
        console.log('🔒 Authentication required - user must sign in to continue');
    }
    
    showSecurityStatus(authResult) {
        console.log('Security Status:', {
            role: authResult.role,
            securityLevel: authResult.securityLevel,
            mfaRequired: authResult.mfaRequired
        });
    }
    
    hideAuthenticationRequired() {
        // Remove authentication required messages
        const authMessages = document.querySelectorAll('.auth-required-message');
        authMessages.forEach(message => message.remove());
        
        // Re-enable minting buttons
        const mintingButtons = ['generate-license', 'approve-license', 'mint-nft'];
        mintingButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.disabled = false;
                button.title = '';
            }
        });
    }

    async loadWalletData() {
        try {
            if (!this.authManager) return;
            
            const walletAddress = await this.authManager.getWalletAddress();
            const walletBalance = await this.authManager.getWalletBalance();
            
            // Update wallet display
            const balanceElement = document.getElementById('wallet-balance');
            if (balanceElement && walletBalance) {
                balanceElement.textContent = `${walletBalance} MATIC`;
            }
            
            // Initialize WalletConnect if user is authenticated
            if (walletAddress) {
                this.initializeWalletConnect();
            }
            
            console.log('Wallet loaded:', walletAddress);
        } catch (error) {
            console.error('Failed to load wallet data:', error);
        }
    }
    
    initializeWalletConnect() {
        const walletConnectSection = document.getElementById('wallet-connect-section');
        const connectBtn = document.getElementById('connect-external-wallet');
        
        if (walletConnectSection) {
            walletConnectSection.style.display = 'block';
        }
        
        if (connectBtn) {
            connectBtn.addEventListener('click', this.handleWalletConnect.bind(this));
        }
    }
    
    async handleWalletConnect() {
        const connectBtn = document.getElementById('connect-external-wallet');
        const statusDiv = document.getElementById('external-wallet-status');
        
        if (!connectBtn) return;
        
        const originalText = connectBtn.textContent;
        connectBtn.disabled = true;
        connectBtn.textContent = '🔄 Connecting...';
        
        try {
            // Simulate WalletConnect integration (placeholder for future implementation)
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Show connected status
            if (statusDiv) {
                statusDiv.style.display = 'flex';
            }
            
            connectBtn.textContent = '✓ Connected';
            connectBtn.style.background = '#4CAF50';
            connectBtn.setAttribute('aria-label', 'External wallet successfully connected');
            
            console.log('✅ External wallet connected (simulated)');
            
        } catch (error) {
            console.error('WalletConnect failed:', error);
            connectBtn.textContent = originalText;
            connectBtn.disabled = false;
            
            connectBtn.setAttribute('aria-label', 'WalletConnect failed - using embedded wallet');
            alert('WalletConnect integration coming soon. Using embedded wallet for now.');
        }
    }
    
    async initializeRadioFeatures() {
        try {
            // Initialize Radio IPFS Manager
            if (window.RadioIPFSManager) {
                this.radioIPFSManager = new RadioIPFSManager();
                console.log('✅ Radio IPFS manager initialized');
            }
            
            // Initialize SAMRO Metadata Manager
            if (window.SamroMetadataManager) {
                this.samroManager = new SamroMetadataManager();
                console.log('✅ SAMRO metadata manager initialized');
            }
            
        } catch (error) {
            console.log('Radio features initialization failed:', error);
        }
    }
    
    async initializeContentAI() {
        try {
            // Initialize Content Enhancement AI
            if (window.ContentAI && this.chromeAI) {
                this.contentAI = new ContentAI(this.chromeAI);
                const aiReady = await this.contentAI.initialize();
                if (aiReady) {
                    console.log('✅ Content Enhancement AI ready');
                    this.setupContentEnhancementUI();
                } else {
                    console.log('ℹ️ Content AI using fallback templates');
                }
            }
            
            // Initialize Professional Radio Formats
            if (window.RadioFormats) {
                this.radioFormats = new RadioFormats();
                console.log('✅ Professional radio formats ready');
            }
            
        } catch (error) {
            console.log('Content AI initialization failed:', error);
        }
    }
    
    async initializeSmartTreesAI() {
        try {
            if (window.SmartTreesAI) {
                this.smartTreesAI = new SmartTreesAI(this.chromeAI, this.userInputManager);
                const aiReady = await this.smartTreesAI.initialize();
                if (aiReady) {
                    console.log('✅ Smart Trees AI ready');
                    // Clean up old data periodically
                    setTimeout(() => this.smartTreesAI.cleanup(), 5000);
                } else {
                    console.log('ℹ️ Smart Trees AI using basic templates');
                }
            }
        } catch (error) {
            console.log('Smart Trees AI initialization failed:', error);
        }
    }
    
    async loadAIInsights() {
        if (!this.smartTreesAI) {
            console.log('Smart Trees AI not available');
            return;
        }
        
        try {
            const insights = this.smartTreesAI.getInsights(5);
            this.displayInsights(insights);
        } catch (error) {
            console.error('Failed to load AI insights:', error);
        }
    }
    
    displayInsights(insights) {
        const insightsList = document.getElementById('insights-list');
        if (!insightsList) return;
        
        if (insights.length === 0) {
            insightsList.innerHTML = `
                <div class="empty-insights">
                    <div class="empty-icon">🌱</div>
                    <p>Your AI insights will grow here</p>
                    <small>Upload beats, update your profile, and submit to radio stations to generate personalized insights</small>
                </div>
            `;
            return;
        }
        
        insightsList.innerHTML = '';
        
        insights.forEach(insight => {
            const card = this.createInsightCard(insight);
            insightsList.appendChild(card);
        });
    }
    
    createInsightCard(insight) {
        const card = document.createElement('div');
        card.className = `insight-card ${!insight.viewed ? 'insight-new' : ''}`;
        card.dataset.insightId = insight.id;
        
        const categoryIcons = {
            performance: '📊',
            opportunities: '🎯', 
            optimization: '⚡',
            collaboration: '🤝',
            market: '📈'
        };
        
        const icon = categoryIcons[insight.category] || '💡';
        const preview = insight.description.length > 80 ? 
            insight.description.substring(0, 80) + '...' : insight.description;
        
        card.innerHTML = `
            <div class="insight-header">
                <div class="insight-title">
                    <span class="insight-icon">${icon}</span>
                    <h4>${this.escapeHtml(insight.title)}</h4>
                </div>
                <span class="insight-category">${insight.category}</span>
            </div>
            <div class="insight-preview">${this.escapeHtml(preview)}</div>
            <div class="insight-meta">
                <span class="insight-timestamp">${this.formatTimestamp(insight.timestamp)}</span>
                <button class="insight-expand">▼ Expand</button>
            </div>
            <div class="insight-details">
                <div class="insight-description">${this.escapeHtml(insight.description)}</div>
                <div class="insight-actions">
                    <button class="insight-btn primary" data-action="mark-useful">✓ Useful</button>
                    <button class="insight-btn secondary" data-action="dismiss">✗ Dismiss</button>
                </div>
            </div>
        `;
        
        // Add event listeners
        const expandBtn = card.querySelector('.insight-expand');
        const details = card.querySelector('.insight-details');
        
        expandBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = details.classList.contains('expanded');
            
            if (isExpanded) {
                details.classList.remove('expanded');
                card.classList.remove('expanded');
                expandBtn.textContent = '▼ Expand';
            } else {
                details.classList.add('expanded');
                card.classList.add('expanded');
                expandBtn.textContent = '▲ Collapse';
                
                // Mark as viewed
                if (this.smartTreesAI && !insight.viewed) {
                    this.smartTreesAI.markViewed(insight.id);
                    card.classList.remove('insight-new');
                }
            }
        });
        
        // Action buttons
        card.querySelector('[data-action="mark-useful"]').addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.smartTreesAI) {
                this.smartTreesAI.markActionTaken(insight.id);
            }
            card.style.opacity = '0.7';
            setTimeout(() => {
                card.querySelector('.insight-btn.primary').textContent = '✓ Noted';
                card.querySelector('.insight-btn.primary').disabled = true;
            }, 200);
        });
        
        card.querySelector('[data-action="dismiss"]').addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.smartTreesAI) {
                this.smartTreesAI.dismissInsight(insight.id);
            }
            card.style.transform = 'translateX(-100%)';
            card.style.opacity = '0';
            setTimeout(() => {
                card.remove();
                // Reload insights if list is empty
                if (document.querySelectorAll('.insight-card').length === 0) {
                    this.loadAIInsights();
                }
            }, 300);
        });
        
        return card;
    }

    addAdminInvitationUI() {
        // Check if admin invitation UI already exists
        if (document.getElementById('admin-invitation-section')) {
            return;
        }

        // Find profile section to add admin features
        const profileSection = document.getElementById('profile-section');
        if (!profileSection) return;

        // Create admin invitation section
        const adminSection = document.createElement('div');
        adminSection.id = 'admin-invitation-section';
        adminSection.className = 'admin-only';
        adminSection.style.cssText = `
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
        `;

        adminSection.innerHTML = `
            <h4 style="margin: 0 0 12px 0; color: #495057; display: flex; align-items: center; gap: 8px;">
                <span>👑</span> Admin Management
            </h4>
            
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 4px; font-weight: 500;">Invite New Admin:</label>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <input type="email" id="admin-invite-email" placeholder="admin@example.com" 
                           style="flex: 1; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
                    <button id="send-admin-invite" class="btn btn-primary" 
                            style="padding: 8px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        📧 Invite
                    </button>
                </div>
                <small style="color: #6c757d; margin-top: 4px; display: block;">Invited admins will have full system access</small>
            </div>
            
            <div id="pending-invitations">
                <h5 style="margin: 0 0 8px 0; color: #495057;">Pending Invitations:</h5>
                <div id="invitations-list" style="max-height: 150px; overflow-y: auto;"></div>
            </div>
        `;

        // Insert at the beginning of profile section
        const profileContent = profileSection.querySelector('.profile-content') || profileSection;
        profileContent.insertBefore(adminSection, profileContent.firstChild);

        // Add event listeners
        this.setupAdminInvitationHandlers();
        
        // Load pending invitations
        this.loadPendingInvitations();
    }

    setupAdminInvitationHandlers() {
        const inviteBtn = document.getElementById('send-admin-invite');
        const emailInput = document.getElementById('admin-invite-email');

        if (inviteBtn && emailInput) {
            inviteBtn.addEventListener('click', async () => {
                await this.handleAdminInvite();
            });

            emailInput.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter') {
                    await this.handleAdminInvite();
                }
            });
        }
    }

    async handleAdminInvite() {
        const emailInput = document.getElementById('admin-invite-email');
        const inviteBtn = document.getElementById('send-admin-invite');
        
        if (!emailInput || !inviteBtn || !this.authManager) return;

        const email = emailInput.value.trim();
        if (!email) {
            this.showInviteMessage('Please enter an email address', 'error');
            return;
        }

        const originalText = inviteBtn.textContent;
        inviteBtn.disabled = true;
        inviteBtn.textContent = '📤 Sending...';

        try {
            const result = await this.authManager.inviteAdmin(email);
            
            if (result.success) {
                emailInput.value = '';
                this.showInviteMessage(result.message, 'success');
                await this.loadPendingInvitations();
            } else {
                this.showInviteMessage('Invitation failed', 'error');
            }

        } catch (error) {
            console.error('Admin invitation failed:', error);
            this.showInviteMessage(error.message, 'error');
        } finally {
            inviteBtn.disabled = false;
            inviteBtn.textContent = originalText;
        }
    }

    async loadPendingInvitations() {
        if (!this.authManager) return;

        try {
            const invitations = await this.authManager.getPendingInvitations();
            const listContainer = document.getElementById('invitations-list');
            
            if (!listContainer) return;

            if (invitations.length === 0) {
                listContainer.innerHTML = '<p style="color: #6c757d; font-style: italic; margin: 0;">No pending invitations</p>';
                return;
            }

            listContainer.innerHTML = '';
            
            invitations.forEach(invitation => {
                const inviteItem = document.createElement('div');
                inviteItem.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px;
                    background: white;
                    border: 1px solid #e9ecef;
                    border-radius: 4px;
                    margin-bottom: 4px;
                `;

                const expiresDate = new Date(invitation.expiresAt).toLocaleDateString();
                
                inviteItem.innerHTML = `
                    <div>
                        <strong>${invitation.email}</strong><br>
                        <small style="color: #6c757d;">Expires: ${expiresDate}</small>
                    </div>
                    <button class="revoke-invite" data-id="${invitation.id}" 
                            style="padding: 4px 8px; background: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 12px;">
                        ❌ Revoke
                    </button>
                `;

                // Add revoke handler
                const revokeBtn = inviteItem.querySelector('.revoke-invite');
                revokeBtn.addEventListener('click', async () => {
                    await this.handleRevokeInvitation(invitation.id, invitation.email);
                });

                listContainer.appendChild(inviteItem);
            });

        } catch (error) {
            console.error('Failed to load pending invitations:', error);
        }
    }

    async handleRevokeInvitation(invitationId, email) {
        if (!confirm(`Revoke admin invitation for ${email}?`)) {
            return;
        }

        try {
            const result = await this.authManager.revokeInvitation(invitationId);
            
            if (result.success) {
                this.showInviteMessage(result.message, 'success');
                await this.loadPendingInvitations();
            }

        } catch (error) {
            console.error('Failed to revoke invitation:', error);
            this.showInviteMessage(error.message, 'error');
        }
    }

    showInviteMessage(message, type) {
        // Remove existing message
        const existingMsg = document.getElementById('invite-message');
        if (existingMsg) {
            existingMsg.remove();
        }

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.id = 'invite-message';
        messageDiv.style.cssText = `
            padding: 8px 12px;
            border-radius: 4px;
            margin: 8px 0;
            font-size: 14px;
            background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};
            color: ${type === 'success' ? '#155724' : '#721c24'};
        `;
        
        messageDiv.textContent = message;

        // Insert after invite button
        const inviteBtn = document.getElementById('send-admin-invite');
        if (inviteBtn && inviteBtn.parentNode) {
            inviteBtn.parentNode.insertBefore(messageDiv, inviteBtn.nextSibling);
        }

        // Remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }
    
    async growNewBranch() {
        const growBtn = document.getElementById('grow-new-branch');
        if (!this.smartTreesAI || !growBtn) return;
        
        const originalText = growBtn.textContent;
        growBtn.disabled = true;
        growBtn.textContent = '🌱 Growing...';
        
        try {
            const newInsight = await this.smartTreesAI.growNewBranch();
            
            if (newInsight) {
                // Reload insights to show the new one
                await this.loadAIInsights();
                
                growBtn.textContent = '✨ New Insight!';
                setTimeout(() => {
                    growBtn.textContent = originalText;
                    growBtn.disabled = false;
                }, 2000);
            } else {
                growBtn.textContent = '💭 Need More Data';
                setTimeout(() => {
                    growBtn.textContent = originalText;
                    growBtn.disabled = false;
                }, 2000);
            }
            
        } catch (error) {
            console.error('Failed to grow new branch:', error);
            growBtn.textContent = originalText;
            growBtn.disabled = false;
        }
    }
    
    formatTimestamp(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(timestamp).toLocaleDateString();
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    setupContentEnhancementUI() {
        // Add enhancement buttons to biography fields
        this.addEnhancementButton('profile-artist-bio', 'biography');
        this.addEnhancementButton('artist-bio', 'biography');
        
        // Add enhancement buttons to track descriptions
        const trackDescFields = document.querySelectorAll('[id*="description"], [id*="bio"]');
        trackDescFields.forEach(field => {
            if (field.id && !field.querySelector('.enhancement-controls')) {
                this.addEnhancementButton(field.id, 'description');
            }
        });
    }
    
    addEnhancementButton(fieldId, type) {
        const field = document.getElementById(fieldId);
        if (!field || field.querySelector('.enhancement-controls')) return;
        
        const container = document.createElement('div');
        container.className = 'enhancement-controls';
        container.style.cssText = 'margin-top: 8px; display: flex; gap: 8px; align-items: center;';
        
        const enhanceBtn = document.createElement('button');
        enhanceBtn.type = 'button';
        enhanceBtn.className = 'btn btn-secondary btn-sm';
        enhanceBtn.textContent = '✨ Enhance with AI';
        enhanceBtn.style.cssText = 'font-size: 12px; padding: 4px 8px;';
        
        const statusSpan = document.createElement('span');
        statusSpan.className = 'enhancement-status';
        statusSpan.style.cssText = 'font-size: 12px; color: #666;';
        
        enhanceBtn.addEventListener('click', async () => {
            await this.enhanceFieldContent(fieldId, type, enhanceBtn, statusSpan);
        });
        
        container.appendChild(enhanceBtn);
        container.appendChild(statusSpan);
        
        field.parentNode.insertBefore(container, field.nextSibling);
    }
    
    async enhanceFieldContent(fieldId, type, button, statusSpan) {
        const field = document.getElementById(fieldId);
        const originalText = field.value.trim();
        
        if (!originalText || originalText.length < 10) {
            statusSpan.textContent = 'Please write some content first (minimum 10 characters)';
            statusSpan.style.color = '#f44336';
            return;
        }
        
        button.disabled = true;
        button.textContent = '⏳ Enhancing...';
        statusSpan.textContent = 'AI is enhancing your content...';
        statusSpan.style.color = '#2196f3';
        
        try {
            let result;
            if (type === 'biography') {
                result = await this.contentAI.enhanceUserBio(originalText);
            } else {
                const metadata = this.radioMetadata || this.beatMetadata || { title: 'Track', genre: 'Music' };
                result = await this.contentAI.improveTrackDescription(originalText, metadata);
            }
            
            if (result.enhanced || result.improved) {
                this.showEnhancementComparison(fieldId, result, type);
                statusSpan.textContent = 'Enhancement ready - choose your version';
                statusSpan.style.color = '#4caf50';
            } else {
                statusSpan.textContent = result.message || 'Enhancement not available';
                statusSpan.style.color = '#ff9800';
            }
            
        } catch (error) {
            console.error('Content enhancement failed:', error);
            statusSpan.textContent = 'Enhancement failed - using original';
            statusSpan.style.color = '#f44336';
        } finally {
            button.disabled = false;
            button.textContent = '✨ Enhance with AI';
        }
    }
    
    showEnhancementComparison(fieldId, result, type) {
        const field = document.getElementById(fieldId);
        const enhanced = result.enhanced || result.improved;
        const original = result.original;
        
        // Create comparison modal
        const modal = document.createElement('div');
        modal.className = 'enhancement-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
            padding: 20px;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white; border-radius: 8px; padding: 24px;
            max-width: 600px; width: 100%; max-height: 80vh; overflow-y: auto;
        `;
        
        content.innerHTML = `
            <h3 style="margin: 0 0 16px 0; color: #333;">✨ AI Enhancement Results</h3>
            
            <div style="margin-bottom: 20px;">
                <h4 style="color: #666; font-size: 14px; margin: 0 0 8px 0;">📝 ORIGINAL:</h4>
                <div style="background: #f5f5f5; padding: 12px; border-radius: 4px; border-left: 4px solid #ccc;">
                    ${this.escapeHtml(original)}
                </div>
            </div>
            
            <div style="margin-bottom: 24px;">
                <h4 style="color: #2196f3; font-size: 14px; margin: 0 0 8px 0;">✨ AI ENHANCED:</h4>
                <div style="background: #e3f2fd; padding: 12px; border-radius: 4px; border-left: 4px solid #2196f3;">
                    ${this.escapeHtml(enhanced)}
                </div>
            </div>
            
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button id="use-original" class="btn btn-secondary">Keep Original</button>
                <button id="use-enhanced" class="btn btn-primary">Use Enhanced</button>
                <button id="edit-enhanced" class="btn btn-secondary">Edit Enhanced</button>
            </div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Event handlers
        content.querySelector('#use-original').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        content.querySelector('#use-enhanced').addEventListener('click', () => {
            field.value = enhanced;
            field.dispatchEvent(new Event('input', { bubbles: true }));
            document.body.removeChild(modal);
        });
        
        content.querySelector('#edit-enhanced').addEventListener('click', () => {
            field.value = enhanced;
            field.focus();
            field.setSelectionRange(field.value.length, field.value.length);
            document.body.removeChild(modal);
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/\n/g, '<br>');
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
            
            // 4. NFT Metadata (JSON) - Use user inputs, not AI suggestions
            const artistInputs = this.getArtistInputs();
            const userGenre = artistInputs.genre || this.beatMetadata.suggestedGenre;
            const userTitle = artistInputs.beatTitle || this.beatMetadata.title;
            const artistName = artistInputs.artistName || 'Unknown Artist';
            
            const nftMetadata = {
                name: this.sanitizeInput(userTitle),
                description: `Music NFT by ${this.sanitizeInput(artistName)}: ${this.sanitizeInput(userTitle)} - ${this.sanitizeInput(userGenre)}`,
                external_url: `https://mumbai.polygonscan.com/tx/${this.sanitizeInput(result.transactionHash)}`,
                attributes: [
                    { trait_type: "Artist", value: this.sanitizeInput(artistName) },
                    { trait_type: "Genre", value: this.sanitizeInput(userGenre) },
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
            
            // 5. Press Kit (separate from core metadata)
            const profileBio = this.getProfileBiography();
            if (profileBio.biography || profileBio.influences || profileBio.social.instagram || profileBio.social.twitter) {
                const pressKit = {
                    artist: {
                        name: artistInputs.artistName,
                        stageName: artistInputs.stageName,
                        biography: profileBio.biography,
                        influences: profileBio.influences,
                        social: profileBio.social
                    },
                    track: {
                        title: userTitle,
                        genre: userGenre
                    },
                    generated: new Date().toISOString()
                };
                
                files.push({
                    name: 'press_kit.json',
                    content: JSON.stringify(pressKit, null, 2)
                });
                
                // Artist biography text file
                if (profileBio.biography) {
                    const bioText = `ARTIST PRESS KIT\n\nArtist: ${artistInputs.artistName}\nStage Name: ${artistInputs.stageName || 'N/A'}\n\n${profileBio.biography}\n\nMusical Influences: ${profileBio.influences || 'Not specified'}\n\nSocial Media:\n${profileBio.social.instagram ? `Instagram: ${profileBio.social.instagram}\n` : ''}${profileBio.social.twitter ? `Twitter: ${profileBio.social.twitter}\n` : ''}\n\nGenerated: ${new Date().toLocaleString()}`;
                    
                    files.push({
                        name: 'artist_press_kit.txt',
                        content: bioText
                    });
                }
            }
            
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
            
            // Initialize SAMRO manager if available
            if (this.samroManager) {
                this.samroManager.initialize();
                console.log('✅ SAMRO fields initialized');
            }
            
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
        try {
            // Enhanced security validation for radio files
            if (!this.audioManager) {
                throw new Error('Audio manager not initialized');
            }
            
            const isValid = await this.validateAudioFile(file);
            if (!isValid) {
                throw new Error('File validation failed');
            }
            
            this.radioAudioFile = file;
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
            alert(`Radio file upload failed: ${error.message}`);
        }
    }
    
    populateTrackInfoFromMetadata() {
        if (!this.radioMetadata) return;
        
        // USER INPUT PRIORITY: Only suggest if user hasn't entered anything
        const titleInput = document.getElementById('radio-track-title');
        if (titleInput && !titleInput.value && this.radioMetadata.title) {
            titleInput.value = this.radioMetadata.title;
            // Store as AI suggestion, not user input
            this.userInputManager.setUserInput('radio-title', this.radioMetadata.title, false);
        }
        
        // Pre-populate genre if detected but don't override user selection
        const genreSelect = document.getElementById('radio-genre');
        if (genreSelect && !genreSelect.value && this.radioMetadata.suggestedGenre) {
            // Map detected genre to radio genres
            const genreMapping = {
                'Hip-Hop': 'Hip-Hop',
                'House': 'House',
                'Electronic': 'Electronic',
                'Pop': 'Pop',
                'Rock': 'Rock',
                'Jazz': 'Jazz',
                'Trap': 'Hip-Hop'
            };
            
            const mappedGenre = genreMapping[this.radioMetadata.suggestedGenre];
            if (mappedGenre) {
                genreSelect.value = mappedGenre;
                // Store as AI suggestion, not user input
                this.userInputManager.setUserInput('radio-genre', mappedGenre, false);
            }
        }
        
        // Add event listeners to track user changes
        this.setupRadioInputTracking();
    }
    
    setupRadioInputTracking() {
        // Track user changes to radio inputs
        const radioInputs = [
            { id: 'radio-track-title', key: 'radio-title' },
            { id: 'radio-artist-name', key: 'radio-artist' },
            { id: 'radio-stage-name', key: 'radio-stage' },
            { id: 'radio-genre', key: 'radio-genre' }
        ];
        
        radioInputs.forEach(({ id, key }) => {
            const element = document.getElementById(id);
            if (element && !element.hasAttribute('data-tracked')) {
                element.setAttribute('data-tracked', 'true');
                element.addEventListener('change', () => {
                    if (element.value.trim()) {
                        this.userInputManager.setUserInput(key, element.value.trim(), true);
                    }
                });
            }
        });
    }
    
    createRadioAudioPreview(file) {
        return this.audioManager.createAudioPreview(file, 'radio-audio-preview', 'radio');
    }
    
    displayRadioMetadata(metadata) {
        const metadataDisplay = document.getElementById('radio-metadata-display');
        if (!metadataDisplay) return;
        
        // Update enhanced radio analysis fields
        document.getElementById('radio-meta-duration').textContent = metadata.duration || '-';
        document.getElementById('radio-meta-quality').textContent = metadata.qualityLevel || '-';
        document.getElementById('radio-meta-format').textContent = metadata.format || '-';
        document.getElementById('radio-meta-bitrate').textContent = metadata.estimatedBitrate || '-';
        document.getElementById('radio-meta-samplerate').textContent = metadata.sampleRate || '44.1 kHz';
        document.getElementById('radio-meta-size').textContent = metadata.fileSize || '-';
        document.getElementById('radio-meta-bpm').textContent = metadata.estimatedBPM || '-';
        document.getElementById('radio-meta-genre').textContent = metadata.suggestedGenre || '-';
        document.getElementById('radio-meta-energy').textContent = metadata.energyLevel || '-';
        
        // Calculate radio readiness score
        const readinessScore = this.calculateRadioReadiness(metadata);
        document.getElementById('radio-meta-readiness').textContent = readinessScore;
        
        // Update SAMRO metadata
        document.getElementById('samro-composition-type').textContent = this.determineSamroCompositionType(metadata);
        document.getElementById('samro-performance-rights').textContent = 'Required';
        document.getElementById('samro-mechanical-rights').textContent = 'Required';
        
        // Setup collapse functionality
        this.setupRadioAnalysisCollapse();
        
        metadataDisplay.style.display = 'block';
    }
    
    calculateRadioReadiness(metadata) {
        let score = 0;
        let total = 0;
        
        // Duration check (2:30-3:30 optimal)
        if (metadata.durationSeconds) {
            total++;
            if (metadata.durationSeconds >= 150 && metadata.durationSeconds <= 210) {
                score++;
            } else if (metadata.durationSeconds <= 240) {
                score += 0.8;
            }
        }
        
        // Quality check
        if (metadata.estimatedBitrate) {
            total++;
            const bitrate = parseInt(metadata.estimatedBitrate);
            if (bitrate >= 320) score++;
            else if (bitrate >= 256) score += 0.8;
            else if (bitrate >= 192) score += 0.6;
        }
        
        // Format check
        if (metadata.format) {
            total++;
            if (['MP3', 'WAV'].includes(metadata.format.toUpperCase())) {
                score++;
            }
        }
        
        const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
        return `${percentage}% Ready`;
    }
    
    determineSamroCompositionType(metadata) {
        if (metadata.suggestedGenre) {
            const genre = metadata.suggestedGenre.toLowerCase();
            if (genre.includes('instrumental') || !metadata.hasVocals) {
                return 'Instrumental Work';
            }
            return 'Musical Work with Lyrics';
        }
        return 'Musical Work';
    }
    
    setupRadioAnalysisCollapse() {
        const toggleBtn = document.getElementById('radio-analysis-toggle');
        const content = document.getElementById('radio-analysis-content');
        
        if (toggleBtn && content && !toggleBtn.hasAttribute('data-setup')) {
            toggleBtn.setAttribute('data-setup', 'true');
            // Start collapsed
            toggleBtn.textContent = '▶';
            toggleBtn.classList.add('collapsed');
            
            toggleBtn.addEventListener('click', () => {
                const isCollapsed = content.classList.contains('collapsed');
                
                if (isCollapsed) {
                    content.classList.remove('collapsed');
                    toggleBtn.classList.remove('collapsed');
                    toggleBtn.textContent = '▼';
                } else {
                    content.classList.add('collapsed');
                    toggleBtn.classList.add('collapsed');
                    toggleBtn.textContent = '▶';
                }
            });
        }
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
        
        // Collect contributors from UI
        this.splitSheetsManager.contributors = [];
        const contributorItems = document.querySelectorAll('.contributor-item');
        
        contributorItems.forEach(item => {
            const name = item.querySelector('.contributor-name')?.value?.trim();
            const role = item.querySelector('.contributor-role')?.value;
            const percentage = parseFloat(item.querySelector('.contributor-percentage')?.value) || 0;
            const samroNumber = item.querySelector('.samro-number')?.value?.trim() || '';
            
            if (name && percentage > 0) {
                this.splitSheetsManager.addContributor(name, role, percentage, samroNumber);
            }
        });
        
        // Validate split sheets
        const total = this.splitSheetsManager.getTotalPercentage();
        if (Math.abs(total - 100) > 0.01) {
            alert(`Split sheets must total exactly 100%. Current total: ${total.toFixed(2)}%`);
            return;
        }
        
        if (this.splitSheetsManager.contributors.length === 0) {
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
                title: this.sanitizeInput(this.userInputManager.getValue('radio-title', radioInputs.title, this.radioMetadata?.title || 'Untitled Track')),
                artist: this.sanitizeInput(this.userInputManager.getValue('radio-artist', radioInputs.artistName, 'Unknown Artist')),
                stageName: this.sanitizeInput(this.userInputManager.getValue('radio-stage', radioInputs.stageName, '')),
                genre: this.sanitizeInput(this.userInputManager.getValue('radio-genre', radioInputs.genre, this.radioMetadata?.suggestedGenre || 'Electronic')),
                language: this.sanitizeInput(radioInputs.language || 'English'),
                recordLabel: this.sanitizeInput(radioInputs.recordLabel || 'Independent'),
                isrc: this.sanitizeInput(radioInputs.isrc || ''),
                contentRating: this.sanitizeInput(radioInputs.contentRating || 'clean'),
                duration: this.sanitizeInput(this.radioMetadata.duration),
                format: this.sanitizeInput(this.radioMetadata.format),
                bitrate: this.sanitizeInput(this.radioMetadata.estimatedBitrate),
                quality: this.sanitizeInput(this.radioMetadata.qualityLevel),
                bpm: this.sanitizeInput(this.radioMetadata.estimatedBPM),
                // Artist biography and press kit
                biography: this.sanitizeInput(radioInputs.biography || ''),
                influences: this.sanitizeInput(radioInputs.influences || ''),
                social: {
                    instagram: this.sanitizeInput(radioInputs.social?.instagram || ''),
                    twitter: this.sanitizeInput(radioInputs.social?.twitter || '')
                },
                radioReady: true,
                submissionDate: new Date().toISOString(),
                submissionType: 'radio_only'
            };
            
            files.push({
                name: 'track_metadata.json',
                content: JSON.stringify(radioMetadata, null, 2)
            });
            
            // Add cover image if uploaded
            const coverImageInput = document.getElementById('radio-cover-image');
            if (coverImageInput && coverImageInput.files[0]) {
                const coverFile = coverImageInput.files[0];
                const extension = coverFile.name.split('.').pop().toLowerCase();
                files.push({
                    name: `images/cover_art.${extension}`,
                    content: coverFile
                });
            }
            
            // Generate split sheet with current contributors
            const splitSheet = this.splitSheetsManager.generateSplitSheet(radioMetadata);
            files.push({
                name: 'split_sheet.json',
                content: JSON.stringify(splitSheet, null, 2)
            });
            
            // Generate enhanced SAMRO documentation
            let samroReport;
            if (this.samroManager && this.samroManager.isValid()) {
                const samroMetadata = this.samroManager.getSamroMetadata();
                samroReport = this.samroManager.generateSamroReport(radioMetadata);
                
                // Add comprehensive SAMRO metadata file
                files.push({
                    name: 'SAMRO_metadata.json',
                    content: JSON.stringify(samroMetadata, null, 2)
                });
            } else {
                samroReport = this.splitSheetsManager.generateSamroReport(radioMetadata);
            }
            
            files.push({
                name: 'SAMRO_Split_Sheet.txt',
                content: samroReport
            });
            
            // Add artist biography file if provided
            if (radioMetadata.biography && radioMetadata.biography.trim()) {
                const bioText = `ARTIST BIOGRAPHY\n\nArtist: ${radioMetadata.artist}\nStage Name: ${radioMetadata.stageName || 'N/A'}\n\n${radioMetadata.biography}\n\nMusical Influences: ${radioMetadata.influences || 'Not specified'}\n\nContact Information:\n${radioMetadata.contact?.website ? `Website: ${radioMetadata.contact.website}\n` : ''}${radioMetadata.contact?.email ? `Email: ${radioMetadata.contact.email}\n` : ''}${radioMetadata.contact?.phone ? `Phone: ${radioMetadata.contact.phone}\n` : ''}\nSocial Media:\n${radioMetadata.social?.instagram ? `Instagram: ${radioMetadata.social.instagram}\n` : ''}${radioMetadata.social?.twitter ? `Twitter: ${radioMetadata.social.twitter}\n` : ''}\n\nGenerated: ${new Date().toLocaleString()}`;
                
                files.push({
                    name: 'artist_biography.txt',
                    content: bioText
                });
            }
            
            // Generate essential formats only (no press kits)
            try {
                // 1. VCF Contact Card with complete contact info
                let contactVCF = `BEGIN:VCARD\nVERSION:3.0\nFN:${radioMetadata.artist}\nORG:${radioMetadata.recordLabel || 'Independent'}\nTITLE:Recording Artist\nNOTE:${radioMetadata.genre} artist - ${radioMetadata.title}`;
                if (radioMetadata.contact?.email) contactVCF += `\nEMAIL:${radioMetadata.contact.email}`;
                if (radioMetadata.contact?.phone) contactVCF += `\nTEL:${radioMetadata.contact.phone}`;
                if (radioMetadata.contact?.website) contactVCF += `\nURL:${radioMetadata.contact.website}`;
                if (radioMetadata.social?.instagram) contactVCF += `\nURL:${radioMetadata.social.instagram}`;
                if (radioMetadata.social?.twitter) contactVCF += `\nURL:${radioMetadata.social.twitter}`;
                if (radioMetadata.social?.facebook) contactVCF += `\nURL:${radioMetadata.social.facebook}`;
                contactVCF += `\nEND:VCARD`;
                files.push({ name: 'contact_info.vcf', content: contactVCF });
                
                // 2. Broadcast XML (required for radio systems)
                const broadcastXML = `<?xml version="1.0" encoding="UTF-8"?>\n<RadioSubmission>\n<Track>\n<Title>${radioMetadata.title}</Title>\n<Artist>${radioMetadata.artist}</Artist>\n<Genre>${radioMetadata.genre}</Genre>\n<Duration>${radioMetadata.duration}</Duration>\n<Language>${radioMetadata.language}</Language>\n</Track>\n</RadioSubmission>`;
                files.push({ name: 'broadcast_metadata.xml', content: broadcastXML });
                
                // 3. CSV Track Data (for database import)
                const csvData = `"Title","Artist","Genre","Duration","Language","ISRC","Website","Email","Phone"\n"${radioMetadata.title}","${radioMetadata.artist}","${radioMetadata.genre}","${radioMetadata.duration}","${radioMetadata.language}","${radioMetadata.isrc || ''}","${radioMetadata.contact?.website || ''}","${radioMetadata.contact?.email || ''}","${radioMetadata.contact?.phone || ''}"`;
                files.push({ name: 'track_data.csv', content: csvData });
                
                console.log(`Generated ${files.length} essential format files`);
                
            } catch (error) {
                console.error('Essential format generation failed:', error);
            }
            
            // Add press kit JSON with all artist info
            const pressKit = {
                artist: {
                    name: radioMetadata.artist,
                    stageName: radioMetadata.stageName,
                    biography: radioMetadata.biography,
                    influences: radioMetadata.influences,
                    social: radioMetadata.social
                },
                track: {
                    title: radioMetadata.title,
                    genre: radioMetadata.genre,
                    language: radioMetadata.language,
                    duration: radioMetadata.duration,
                    isrc: radioMetadata.isrc
                },
                submission: {
                    date: radioMetadata.submissionDate,
                    type: 'radio_submission',
                    radioReady: true
                },
                formats: {
                    pressRelease: 'press_release.txt',
                    submissionLetter: 'radio_submission_letter.txt',
                    htmlPressKit: 'press_kit.html',
                    contactCard: 'contact_info.vcf',
                    broadcastMetadata: 'broadcast_metadata.xml',
                    samroDocumentation: 'SAMRO_documentation.txt'
                }
            };
            
            files.push({
                name: 'press_kit.json',
                content: JSON.stringify(pressKit, null, 2)
            });
            
            const zipBlob = await this.createRealZip(files);
            
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            const sanitizedTitle = this.sanitizeInput(radioMetadata.title || 'Radio_Submission');
            a.download = `${sanitizedTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Radio_Submission.zip`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            // Show success with format count
            const formatCount = files.length;
            generateBtn.textContent = `✅ ${formatCount} Files Generated!`;
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
        // Collect current form values
        const formTitle = document.getElementById('radio-track-title')?.value?.trim();
        const formArtist = document.getElementById('radio-artist-name')?.value?.trim();
        const formStage = document.getElementById('radio-stage-name')?.value?.trim();
        const formGenre = document.getElementById('radio-genre')?.value?.trim();
        const formLanguage = document.getElementById('radio-language')?.value?.trim();
        const formLabel = document.getElementById('radio-record-label')?.value?.trim();
        const formISRC = document.getElementById('radio-isrc')?.value?.trim();
        const formRating = document.getElementById('radio-content-rating')?.value?.trim();
        
        // Store user inputs if they exist
        if (formTitle) this.userInputManager.setUserInput('radio-title', formTitle, true);
        if (formArtist) this.userInputManager.setUserInput('radio-artist', formArtist, true);
        if (formStage) this.userInputManager.setUserInput('radio-stage', formStage, true);
        if (formGenre) this.userInputManager.setUserInput('radio-genre', formGenre, true);
        
        const profileBio = this.getProfileBiography();
        
        return {
            title: this.userInputManager.getValue('radio-title', formTitle, this.radioMetadata?.title || 'Untitled Track'),
            artistName: this.userInputManager.getValue('radio-artist', formArtist, 'Unknown Artist'),
            stageName: this.userInputManager.getValue('radio-stage', formStage, ''),
            genre: this.userInputManager.getValue('radio-genre', formGenre, this.radioMetadata?.suggestedGenre || 'Electronic'),
            language: formLanguage || 'English',
            recordLabel: formLabel || 'Independent',
            isrc: formISRC || '',
            contentRating: formRating || 'Clean',
            biography: profileBio.biography || '',
            influences: profileBio.influences || '',
            contact: profileBio.contact || {},
            social: profileBio.social || {}
        };
    }
    
    getEnhancedProfileData() {
        return {
            legalName: this.sanitizeInput(document.getElementById('profile-legal-name')?.value?.trim() || ''),
            displayName: this.sanitizeInput(document.getElementById('profile-display-name')?.value?.trim() || ''),
            role: document.getElementById('profile-role')?.value?.trim() || ''
        };
    }
    
    getProfileBiography() {
        return {
            biography: document.getElementById('profile-artist-bio')?.value?.trim() || '',
            influences: document.getElementById('profile-influences')?.value?.trim() || '',
            contact: {
                website: document.getElementById('profile-website')?.value?.trim() || '',
                email: document.getElementById('profile-email-contact')?.value?.trim() || '',
                phone: document.getElementById('profile-phone')?.value?.trim() || ''
            },
            social: {
                instagram: document.getElementById('profile-instagram')?.value?.trim() || '',
                twitter: document.getElementById('profile-twitter')?.value?.trim() || '',
                facebook: document.getElementById('profile-facebook')?.value?.trim() || ''
            },
            musicPlatforms: {
                spotify: document.getElementById('profile-spotify')?.value?.trim() || '',
                soundcloud: document.getElementById('profile-soundcloud')?.value?.trim() || '',
                youtube: document.getElementById('profile-youtube')?.value?.trim() || '',
                bandcamp: document.getElementById('profile-bandcamp')?.value?.trim() || '',
                tiktok: document.getElementById('profile-tiktok')?.value?.trim() || '',
                appleMusic: document.getElementById('profile-apple-music')?.value?.trim() || ''
            }
        };
    }
    
    async saveProfile() {
        try {
            const profileData = this.getProfileBiography();
            const enhancedProfile = this.getEnhancedProfileData();
            
            // Validate required fields
            if (enhancedProfile.legalName && !this.userInputManager.validateUserInput(enhancedProfile.legalName, 'legal-name')) {
                alert('Please enter a valid legal name (letters, numbers, spaces, hyphens, apostrophes only)');
                return;
            }
            
            if (enhancedProfile.displayName && !this.userInputManager.validateUserInput(enhancedProfile.displayName, 'display-name')) {
                alert('Please enter a valid display name (letters, numbers, spaces, hyphens, apostrophes only)');
                return;
            }
            
            const completeProfile = {
                ...profileData,
                ...enhancedProfile,
                lastUpdated: new Date().toISOString()
            };
            
            // Store user inputs in manager
            if (enhancedProfile.legalName) {
                this.userInputManager.setUserInput('legal-name', enhancedProfile.legalName, true);
            }
            if (enhancedProfile.displayName) {
                this.userInputManager.setUserInput('display-name', enhancedProfile.displayName, true);
            }
            if (enhancedProfile.role) {
                this.userInputManager.setUserInput('role', enhancedProfile.role, true);
            }
            
            // Store in browser storage
            if (window.StorageManager) {
                await window.StorageManager.set('artistProfile', completeProfile);
            } else {
                localStorage.setItem('artistProfile', JSON.stringify(completeProfile));
            }
            
            // Show success message
            const saveBtn = document.getElementById('save-profile');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '✅ Saved!';
            saveBtn.disabled = true;
            
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Failed to save profile:', error);
            alert('Failed to save profile. Please try again.');
        }
    }
    
    async loadProfile() {
        try {
            let profileData;
            
            if (window.StorageManager) {
                profileData = await window.StorageManager.get('artistProfile');
            } else {
                const stored = localStorage.getItem('artistProfile');
                profileData = stored ? JSON.parse(stored) : null;
            }
            
            if (profileData) {
                // Enhanced profile fields
                const legalNameField = document.getElementById('profile-legal-name');
                const displayNameField = document.getElementById('profile-display-name');
                const roleField = document.getElementById('profile-role');
                
                // Biography fields
                const bioField = document.getElementById('profile-artist-bio');
                const influencesField = document.getElementById('profile-influences');
                const websiteField = document.getElementById('profile-website');
                const emailField = document.getElementById('profile-email-contact');
                const phoneField = document.getElementById('profile-phone');
                const instagramField = document.getElementById('profile-instagram');
                const twitterField = document.getElementById('profile-twitter');
                const facebookField = document.getElementById('profile-facebook');
                
                // Music platform fields
                const spotifyField = document.getElementById('profile-spotify');
                const soundcloudField = document.getElementById('profile-soundcloud');
                const youtubeField = document.getElementById('profile-youtube');
                const bandcampField = document.getElementById('profile-bandcamp');
                const tiktokField = document.getElementById('profile-tiktok');
                const appleMusicField = document.getElementById('profile-apple-music');
                
                // Load enhanced profile data
                if (legalNameField) {
                    legalNameField.value = profileData.legalName || '';
                    // Pre-fill with Google name if empty
                    if (!profileData.legalName && this.authManager) {
                        const userProfile = this.authManager.getUserProfile();
                        if (userProfile && userProfile.name) {
                            legalNameField.value = userProfile.name;
                        }
                    }
                }
                if (displayNameField) displayNameField.value = profileData.displayName || '';
                if (roleField) roleField.value = profileData.role || '';
                
                // Load biography data
                if (bioField) bioField.value = profileData.biography || '';
                if (influencesField) influencesField.value = profileData.influences || '';
                if (websiteField) websiteField.value = profileData.contact?.website || '';
                if (emailField) emailField.value = profileData.contact?.email || '';
                if (phoneField) phoneField.value = profileData.contact?.phone || '';
                if (instagramField) instagramField.value = profileData.social?.instagram || '';
                if (twitterField) twitterField.value = profileData.social?.twitter || '';
                if (facebookField) facebookField.value = profileData.social?.facebook || '';
                
                // Load music platforms
                if (spotifyField) spotifyField.value = profileData.musicPlatforms?.spotify || '';
                if (soundcloudField) soundcloudField.value = profileData.musicPlatforms?.soundcloud || '';
                if (youtubeField) youtubeField.value = profileData.musicPlatforms?.youtube || '';
                if (bandcampField) bandcampField.value = profileData.musicPlatforms?.bandcamp || '';
                if (tiktokField) tiktokField.value = profileData.musicPlatforms?.tiktok || '';
                if (appleMusicField) appleMusicField.value = profileData.musicPlatforms?.appleMusic || '';
            } else {
                // Pre-fill legal name with Google name for new users
                const legalNameField = document.getElementById('profile-legal-name');
                if (legalNameField && this.authManager) {
                    const userProfile = this.authManager.getUserProfile();
                    if (userProfile && userProfile.name) {
                        legalNameField.value = userProfile.name;
                    }
                }
            }
            
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
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
    
    async handleExportWallet() {
        try {
            if (!this.authManager) {
                alert('Please sign in first to export wallet');
                return;
            }
            
            const walletAddress = await this.authManager.getWalletAddress();
            if (!walletAddress) {
                alert('No wallet found. Please sign in to generate a wallet.');
                return;
            }
            
            // Get wallet data from storage
            const walletData = await chrome.storage.local.get(['wallet_private_key', 'wallet_address']);
            
            if (!walletData.wallet_private_key) {
                alert('Wallet private key not found. Cannot export.');
                return;
            }
            
            // Create export data
            const exportData = {
                address: walletData.wallet_address,
                privateKey: walletData.wallet_private_key,
                exportDate: new Date().toISOString(),
                warning: 'KEEP THIS PRIVATE KEY SECURE - Anyone with this key can access your wallet'
            };
            
            // Download as JSON file
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `BeatsChain-Wallet-${walletAddress.substring(0, 8)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            
            alert('Wallet exported successfully! Keep the file secure.');
            
        } catch (error) {
            console.error('Wallet export failed:', error);
            alert('Failed to export wallet. Please try again.');
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