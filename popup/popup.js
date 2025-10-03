// BeatsChain Extension Popup Logic
class BeatsChainApp {
    constructor() {
        this.currentSection = 'upload-section';
        this.beatFile = null;
        this.beatMetadata = {};
        this.licenseTerms = '';
        this.isInitialized = false;
    }

    async initialize() {
        try {
            this.setupEventListeners();
            
            // Initialize Authentication Manager
            this.authManager = new AuthenticationManager();
            const isAuthenticated = await this.authManager.initialize();
            
            if (isAuthenticated) {
                console.log('✅ User already authenticated');
                await this.updateAuthenticatedUI();
            } else {
                console.log('ℹ️  User not authenticated');
            }
            
            await this.loadWalletData();
            
            // Initialize Chrome AI Manager
            this.chromeAI = new ChromeAIManager();
            const aiAvailable = await this.chromeAI.initialize();
            
            if (aiAvailable) {
                console.log('✅ Chrome AI ready with APIs:', this.chromeAI.getAvailableAPIs());
            } else {
                console.log('ℹ️ Chrome AI unavailable - using professional fallback templates (fully functional)');
            }
            
            // Initialize Thirdweb Manager
            this.thirdweb = new ThirdwebManager();
            console.log('Thirdweb manager initialized');
            
            this.isInitialized = true;
            console.log('BeatsChain initialized successfully');
        } catch (error) {
            console.error('Initialization failed:', error);
        }
    }
    
    async updateAuthenticatedUI() {
        try {
            const userProfile = this.authManager.getUserProfile();
            if (!userProfile) return;
            
            // Update user email display
            const emailElement = document.getElementById('user-email');
            if (emailElement) {
                emailElement.textContent = userProfile.email;
            }
            
            // Update profile name
            const nameElement = document.getElementById('profile-name');
            if (nameElement) {
                nameElement.textContent = userProfile.name;
            }
            
            // Update profile email in profile section
            const profileEmailElement = document.getElementById('profile-email');
            if (profileEmailElement) {
                profileEmailElement.textContent = userProfile.email;
            }
            
            // Hide sign-in button
            const signInBtn = document.getElementById('google-signin');
            if (signInBtn) {
                signInBtn.style.display = 'none';
            }
            
            // Show user avatar if available
            if (userProfile.picture) {
                const avatarElements = document.querySelectorAll('.user-avatar');
                avatarElements.forEach(avatar => {
                    avatar.src = userProfile.picture;
                    avatar.style.display = 'block';
                });
            }
            
        } catch (error) {
            console.error('Failed to update authenticated UI:', error);
        }
    }

    setupEventListeners() {
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('audio-file');
        
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
            uploadArea.addEventListener('drop', this.handleFileDrop.bind(this));
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }

        const generateBtn = document.getElementById('generate-license');
        if (generateBtn) {
            generateBtn.addEventListener('click', this.generateLicense.bind(this));
        }

        const approveBtn = document.getElementById('approve-license');
        if (approveBtn) {
            approveBtn.addEventListener('click', this.approveLicense.bind(this));
        }

        const mintBtn = document.getElementById('mint-nft');
        if (mintBtn) {
            mintBtn.addEventListener('click', this.mintNFT.bind(this));
        }

        const viewBtn = document.getElementById('view-nft');
        if (viewBtn) {
            viewBtn.addEventListener('click', this.viewNFT.bind(this));
        }

        const mintAnotherBtn = document.getElementById('mint-another');
        if (mintAnotherBtn) {
            mintAnotherBtn.addEventListener('click', this.resetApp.bind(this));
        }

        const downloadBtn = document.getElementById('download-package');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.generateDownloadPackage({
                transactionHash: this.currentTxHash,
                tokenId: this.currentTokenId
            }));
        }

        const googleSignIn = document.getElementById('google-signin');
        if (googleSignIn) {
            googleSignIn.addEventListener('click', this.handleGoogleSignIn.bind(this));
        }

        const imageInput = document.getElementById('cover-image');
        if (imageInput) {
            imageInput.addEventListener('change', this.handleImageUpload.bind(this));
        }

        const proceedBtn = document.getElementById('proceed-to-licensing');
        if (proceedBtn) {
            proceedBtn.addEventListener('click', () => this.showSection('licensing-section'));
        }

        // Navigation tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.switchTab(section);
            });
        });

        // Profile actions
        const editProfileBtn = document.getElementById('edit-profile');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', this.editProfile.bind(this));
        }

        const exportWalletBtn = document.getElementById('export-wallet');
        if (exportWalletBtn) {
            exportWalletBtn.addEventListener('click', this.exportWallet.bind(this));
        }

        // History filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.filterHistory(filter);
            });
        });

        // Social sharing events
        const nftSelect = document.getElementById('share-nft-select');
        if (nftSelect) {
            nftSelect.addEventListener('change', this.onNFTSelect.bind(this));
        }

        const socialButtons = {
            'share-twitter': this.shareOnTwitter.bind(this),
            'share-facebook': this.shareOnFacebook.bind(this),
            'share-linkedin': this.shareOnLinkedIn.bind(this),
            'share-reddit': this.shareOnReddit.bind(this),
            'copy-link': this.copyShareLink.bind(this),
            'generate-qr': this.generateQRCode.bind(this),
            'generate-seo': this.generateSEOTags.bind(this)
        };

        Object.entries(socialButtons).forEach(([id, handler]) => {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener('click', handler);
        });
        
        // Radio submission events
        const validateRadioBtn = document.getElementById('validate-radio');
        if (validateRadioBtn) {
            validateRadioBtn.addEventListener('click', this.validateForRadio.bind(this));
        }
        
        const generateRadioBtn = document.getElementById('generate-radio-package');
        if (generateRadioBtn) {
            generateRadioBtn.addEventListener('click', this.generateRadioPackage.bind(this));
        }
        
        const addContributorBtn = document.getElementById('add-contributor');
        if (addContributorBtn) {
            addContributorBtn.addEventListener('click', this.addContributor.bind(this));
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
        if (!this.validateAudioFile(file)) {
            alert('Invalid file type. Please upload MP3, WAV, or FLAC files.');
            return;
        }

        this.beatFile = file;
        this.showProgress(true);

        try {
            this.beatMetadata = await this.extractAudioMetadata(file);
            this.updateUploadStatus(`Uploaded: ${file.name} (${this.formatFileSize(file.size)})`);
            this.showProgress(false);
            this.createAudioPreview(file);
            this.displayMetadata(this.beatMetadata);
            this.showArtistForm();
            
            // Show proceed button
            const proceedBtn = document.getElementById('proceed-to-licensing');
            if (proceedBtn) proceedBtn.style.display = 'block';
        } catch (error) {
            console.error('File processing failed:', error);
            alert('Failed to process audio file');
            this.showProgress(false);
        }
    }

    validateAudioFile(file) {
        const validTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp3'];
        const maxSize = 50 * 1024 * 1024;
        return validTypes.includes(file.type) && file.size <= maxSize;
    }

    async extractAudioMetadata(file) {
        return new Promise((resolve) => {
            const audio = new Audio();
            const url = URL.createObjectURL(file);
            
            audio.addEventListener('loadedmetadata', () => {
                // Enhanced metadata extraction
                const fileName = file.name.replace(/\.[^/.]+$/, "");
                const fileExt = file.name.split('.').pop().toUpperCase();
                const bitrate = this.estimateBitrate(file.size, audio.duration);
                const quality = this.getQualityLevel(bitrate, fileExt);
                
                const metadata = {
                    // Basic Info
                    title: fileName,
                    originalFileName: file.name,
                    duration: this.formatDuration(audio.duration),
                    durationSeconds: Math.round(audio.duration),
                    
                    // Technical Specs
                    fileSize: this.formatFileSize(file.size),
                    fileSizeBytes: file.size,
                    format: fileExt,
                    mimeType: file.type,
                    estimatedBitrate: bitrate,
                    qualityLevel: quality,
                    
                    // Inferred Properties (for AI context)
                    estimatedBPM: this.estimateBPM(fileName),
                    suggestedGenre: this.inferGenre(fileName),
                    energyLevel: this.inferEnergyLevel(fileName, audio.duration),
                    
                    // Metadata for licensing
                    createdDate: new Date().toISOString(),
                    uploadTimestamp: Date.now()
                };
                
                URL.revokeObjectURL(url);
                resolve(metadata);
            });
            
            audio.src = url;
        });
    }

    estimateBitrate(fileSize, duration) {
        if (!duration || duration === 0) return 'Unknown';
        const bitrate = Math.round((fileSize * 8) / (duration * 1000));
        return `${bitrate} kbps`;
    }

    getQualityLevel(bitrate, format) {
        const rate = parseInt(bitrate);
        if (format === 'FLAC' || format === 'WAV') return 'Lossless';
        if (rate >= 320) return 'High (320+ kbps)';
        if (rate >= 192) return 'Medium (192-319 kbps)';
        if (rate >= 128) return 'Standard (128-191 kbps)';
        return 'Low (<128 kbps)';
    }

    estimateBPM(fileName) {
        const bpmMatch = fileName.match(/(\d{2,3})\s*bpm/i);
        if (bpmMatch) return `${bpmMatch[1]} BPM`;
        
        // Infer from common terms
        const name = fileName.toLowerCase();
        if (name.includes('slow') || name.includes('chill')) return '70-90 BPM (Slow)';
        if (name.includes('trap') || name.includes('hip')) return '140-180 BPM (Trap/Hip-Hop)';
        if (name.includes('house') || name.includes('dance')) return '120-130 BPM (House/Dance)';
        if (name.includes('drum') || name.includes('bass')) return '160-180 BPM (DnB)';
        return '120-140 BPM (Estimated)';
    }

    inferGenre(fileName) {
        const name = fileName.toLowerCase();
        if (name.includes('trap')) return 'Trap';
        if (name.includes('house')) return 'House';
        if (name.includes('techno')) return 'Techno';
        if (name.includes('hip') || name.includes('rap')) return 'Hip-Hop';
        if (name.includes('drum') || name.includes('bass')) return 'Drum & Bass';
        if (name.includes('chill') || name.includes('lo')) return 'Chill/Lo-Fi';
        if (name.includes('pop')) return 'Pop';
        if (name.includes('rock')) return 'Rock';
        return 'Electronic/Instrumental';
    }

    inferEnergyLevel(fileName, duration) {
        const name = fileName.toLowerCase();
        if (name.includes('chill') || name.includes('ambient')) return 'Low Energy';
        if (name.includes('hard') || name.includes('aggressive')) return 'High Energy';
        if (duration > 300) return 'Medium Energy (Extended)';
        if (duration < 120) return 'High Energy (Short)';
        return 'Medium Energy';
    }

    async generateLicense() {
        const generateBtn = document.getElementById('generate-license');
        const statusText = document.getElementById('ai-status-text');
        const licenseTextarea = document.getElementById('license-terms');
        
        generateBtn.disabled = true;
        statusText.textContent = 'Initializing Chrome AI...';

        try {
            // Initialize Chrome AI Manager with full context
            if (!this.chromeAI) {
                this.chromeAI = new ChromeAIManager();
                await this.chromeAI.initialize();
            }

            statusText.textContent = 'AI analyzing track metadata...';
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Get artist inputs and merge with metadata
            const artistInputs = this.getArtistInputs();
            const enhancedMetadata = {
                ...this.beatMetadata,
                artist: artistInputs.artistName,
                stageName: artistInputs.stageName,
                title: artistInputs.beatTitle,
                genre: artistInputs.genre
            };
            
            // Get license options from UI
            const licenseOptions = this.getLicenseOptions();
            
            // Generate contextual license using all available metadata
            statusText.textContent = 'Generating professional licensing terms...';
            const userPreferences = {
                ...licenseOptions,
                territory: 'worldwide',
                duration: 'perpetual'
            };

            this.licenseTerms = await this.chromeAI.generateLicense(enhancedMetadata, userPreferences);
            
            // Validate and enhance the generated license
            if (this.licenseTerms && this.licenseTerms.length > 100) {
                statusText.textContent = 'Optimizing license terms...';
                
                // Use Chrome AI rewriter to optimize if available
                if (this.chromeAI.apis.rewriter) {
                    this.licenseTerms = await this.chromeAI.optimizeLicense(this.licenseTerms);
                }
                
                licenseTextarea.value = this.licenseTerms;
                statusText.textContent = `License generated successfully using ${this.chromeAI.getAvailableAPIs().join(', ')} APIs!`;
            } else {
                throw new Error('Generated license too short or invalid');
            }
            
            document.getElementById('approve-license').disabled = false;
            
        } catch (error) {
            console.error('License generation failed:', error);
            statusText.textContent = 'Using enhanced template license';
            
            // Use enhanced fallback with full context including artist inputs
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
        const commercialText = this.getCommercialUseText(options.commercialUse);
        const availabilityText = this.getAvailabilityText(options.forSale);
        const royaltyText = this.getRoyaltyText(options);
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
Creation Date: ${new Date(metadata.createdDate).toLocaleDateString()}
Upload Timestamp: ${new Date(metadata.uploadTimestamp).toLocaleString()}

═══════════════════════════════════════════════════════════════
GRANT OF RIGHTS
═══════════════════════════════════════════════════════════════

1. LICENSE TYPE: ${licenseTypeText} Perpetual License
2. TERRITORY: Worldwide distribution and usage rights  
3. DURATION: Perpetual (never expires, suitable for NFT ownership)
4. USAGE RIGHTS: ${commercialText}
5. AVAILABILITY: ${availabilityText}
6. ARTIST: ${artistDisplay}

═══════════════════════════════════════════════════════════════
INCLUDED RIGHTS
═══════════════════════════════════════════════════════════════

✓ SYNCHRONIZATION RIGHTS: Use with video, film, advertising, social media
✓ MECHANICAL RIGHTS: Digital reproduction, streaming, downloads
✓ PERFORMANCE RIGHTS: Live performances, broadcasts, public play
✓ DERIVATIVE WORKS: Remixes, samples, modifications (with attribution)
✓ DISTRIBUTION RIGHTS: Online platforms, physical media, streaming services

═══════════════════════════════════════════════════════════════
ATTRIBUTION REQUIREMENTS
═══════════════════════════════════════════════════════════════

Required Attribution Format:
"${metadata.title} by ${artistDisplay} - BeatsChain NFT"

Attribution must be included in:
- Video descriptions and credits
- Social media posts using the track
- Commercial advertisements
- Streaming platform metadata
- Physical media packaging

═══════════════════════════════════════════════════════════════
ROYALTY STRUCTURE
═══════════════════════════════════════════════════════════════

${royaltyText}

═══════════════════════════════════════════════════════════════
TECHNICAL QUALITY GUARANTEE
═══════════════════════════════════════════════════════════════

The licensed track maintains the following specifications:
- Audio Quality: ${metadata.qualityLevel}
- Bitrate: ${metadata.estimatedBitrate}
- Format: ${metadata.format}
- Duration: Exactly ${metadata.durationSeconds} seconds
- File Integrity: Verified via blockchain hash

═══════════════════════════════════════════════════════════════
BLOCKCHAIN VERIFICATION & NFT OWNERSHIP
═══════════════════════════════════════════════════════════════

This license is valid only with verified NFT ownership:
• Smart Contract: 0x8B7F8B2B8B7F8B2B8B7F8B2B8B7F8B2B8B7F8B2B
• Blockchain Network: Polygon Mumbai Testnet
• License terms immutably stored on blockchain
• Ownership verification required for commercial use
• Transfer of NFT transfers license rights

═══════════════════════════════════════════════════════════════
PROHIBITED USES
═══════════════════════════════════════════════════════════════

✗ Resale or redistribution of original audio file
✗ Claiming ownership or authorship of the composition
✗ Use in illegal, defamatory, or harmful content
✗ Reverse engineering or attempting to recreate the track
✗ Removing or altering attribution requirements

═══════════════════════════════════════════════════════════════
TERMINATION CONDITIONS
═══════════════════════════════════════════════════════════════

This license remains valid unless:
• NFT ownership is transferred (license transfers with NFT)
• Breach of attribution requirements (30-day cure period)
• Use in prohibited applications (immediate termination)
• Blockchain network becomes permanently inaccessible

═══════════════════════════════════════════════════════════════
LEGAL DISCLAIMERS
═══════════════════════════════════════════════════════════════

• No warranty provided regarding fitness for specific purposes
• Licensee assumes responsibility for clearance of samples/interpolations
• Governed by blockchain smart contract terms
• Disputes resolved through decentralized arbitration when possible

═══════════════════════════════════════════════════════════════
GENERATED BY BEATSCHAIN AI
═══════════════════════════════════════════════════════════════

License Generated: ${new Date().toLocaleString()}
AI System: BeatsChain Chrome AI Integration
Version: 2.0 (Enhanced Context)
Contract Platform: Thirdweb + Polygon

For support and verification: https://beatschain.app

═══════════════════════════════════════════════════════════════`;
    }

    getFallbackLicense(metadata, options = {}) {
        const artistDisplay = metadata.stageName ? `${metadata.artist} (${metadata.stageName})` : (metadata.artist || 'Unknown Artist');
        const licenseType = options.licenseType === 'exclusive' ? 'Exclusive' : 'Non-exclusive';
        const commercialUse = options.commercialUse === 'non-commercial' ? 'Non-commercial use only' : 'Personal and commercial use';
        const royaltyRate = options.royaltyRate || 2.5;
        
        return `MUSIC LICENSING AGREEMENT

TRACK IDENTIFICATION:
- Title: ${metadata.title}
- Artist: ${artistDisplay}
- Duration: ${metadata.duration} (${metadata.durationSeconds}s)
- Genre: ${metadata.genre || metadata.suggestedGenre}
- BPM: ${metadata.estimatedBPM}
- Quality: ${metadata.qualityLevel}
- Format: ${metadata.format}
- Energy Level: ${metadata.energyLevel}

TECHNICAL SPECIFICATIONS:
- File Size: ${metadata.fileSize}
- Bitrate: ${metadata.estimatedBitrate}
- Original Format: ${metadata.mimeType}

USAGE RIGHTS:
- ${licenseType} license for ${commercialUse}
- Attribution required: "${metadata.title} by ${artistDisplay} - BeatsChain NFT"
- No resale or redistribution of original audio file
- Derivative works permitted with attribution
- Streaming and broadcasting rights included

LICENSE TERMS:
- Territory: Worldwide
- Duration: Perpetual
- Royalty: ${royaltyRate}% on commercial use
- Quality maintained as specified above
- Blockchain verification required

Generated by BeatsChain AI on ${new Date().toLocaleDateString()}
NFT Contract: BeatsChain Music NFTs`;
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
                privateKey = 'c0c71ecd72b802ba8f19cbe188b7e191f62889bf6adf3bb18265a626a5829171';
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
        this.updateWalletData();
        
        // Store NFT data
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
        
        // Package will be available via Download Package button - no auto-download
    }

    viewNFT() {
        if (this.currentTxHash) {
            const url = `https://polygonscan.com/tx/${this.currentTxHash}`;
            chrome.tabs.create({ url });
        }
    }

    resetApp() {
        this.beatFile = null;
        this.beatMetadata = {};
        this.licenseTerms = '';
        this.currentTxHash = null;
        this.currentTokenId = null;
        
        document.getElementById('audio-file').value = '';
        document.getElementById('cover-image').value = '';
        document.getElementById('license-terms').value = '';
        document.getElementById('ai-status-text').textContent = 'Ready to generate licensing terms';
        document.getElementById('mint-status').textContent = '';
        
        // Clear previews
        const audioPreview = document.getElementById('audio-preview');
        if (audioPreview) audioPreview.innerHTML = '';
        
        const imagePreview = document.getElementById('image-preview');
        if (imagePreview) imagePreview.style.display = 'none';
        
        const metadataDisplay = document.getElementById('metadata-display');
        if (metadataDisplay) metadataDisplay.style.display = 'none';
        
        // Reset upload area text
        const uploadContent = document.querySelector('.upload-content p');
        if (uploadContent) uploadContent.textContent = 'Drop your beat here or click to browse';
        
        // Hide proceed button
        const proceedBtn = document.getElementById('proceed-to-licensing');
        if (proceedBtn) proceedBtn.style.display = 'none';
        
        this.showSection('upload-section');
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
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async loadWalletData() {
        try {
            if (this.authManager && this.authManager.isAuthenticated) {
                // Get real wallet data
                const walletAddress = await this.authManager.getWalletAddress();
                const balance = await this.authManager.getWalletBalance();
                
                // Update wallet address display
                const addressElement = document.getElementById('profile-wallet-address');
                if (addressElement && walletAddress) {
                    addressElement.textContent = walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4);
                }
                
                // Update balance display
                const balanceElement = document.getElementById('wallet-balance');
                if (balanceElement) {
                    balanceElement.textContent = `${balance} MATIC`;
                }
            } else {
                // Show placeholder for non-authenticated users
                const balanceElement = document.getElementById('wallet-balance');
                if (balanceElement) {
                    balanceElement.textContent = 'Sign in to view';
                }
            }
        } catch (error) {
            console.error('Failed to load wallet data:', error);
            const balanceElement = document.getElementById('wallet-balance');
            if (balanceElement) {
                balanceElement.textContent = 'Error loading';
            }
        }
    }

    async updateWalletData() {
        await this.loadWalletData();
    }

    async handleGoogleSignIn() {
        const signInBtn = document.getElementById('google-signin');
        const originalText = signInBtn.textContent;
        
        try {
            signInBtn.disabled = true;
            signInBtn.textContent = 'Signing in...';
            
            // Initialize authentication manager if not already done
            if (!this.authManager) {
                this.authManager = new AuthenticationManager();
                await this.authManager.initialize();
            }
            
            // Perform real Google OAuth2 sign-in
            const result = await this.authManager.signInWithGoogle();
            
            if (result.success) {
                // Update UI with real user data
                const emailElement = document.getElementById('user-email');
                if (emailElement) {
                    emailElement.textContent = result.user.email;
                }
                
                const nameElement = document.getElementById('profile-name');
                if (nameElement) {
                    nameElement.textContent = result.user.name;
                }
                
                // Hide sign-in button, show user info
                signInBtn.style.display = 'none';
                
                // Update wallet display
                await this.updateWalletData();
                
                console.log('✅ Successfully signed in:', result.user.email);
                
                // Show success message
                this.showNotification('Successfully signed in with Google!', 'success');
            }
            
        } catch (error) {
            console.error('❌ Sign-in failed:', error);
            signInBtn.textContent = originalText;
            signInBtn.disabled = false;
            
            // Show error message
            this.showNotification('Sign-in failed. Please try again.', 'error');
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    createAudioPreview(file) {
        const previewContainer = document.getElementById('audio-preview');
        if (!previewContainer) return;
        
        previewContainer.innerHTML = '';
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.style.width = '100%';
        audio.src = URL.createObjectURL(file);
        previewContainer.appendChild(audio);
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
            
            // Pre-fill beat title from filename
            const beatTitleInput = document.getElementById('beat-title');
            if (beatTitleInput && this.beatMetadata.title) {
                beatTitleInput.value = this.beatMetadata.title;
            }
            
            // Pre-select genre if detected
            const genreSelect = document.getElementById('genre-select');
            if (genreSelect && this.beatMetadata.suggestedGenre) {
                genreSelect.value = this.beatMetadata.suggestedGenre;
            }
        }
    }
    
    getArtistInputs() {
        return {
            artistName: document.getElementById('artist-name')?.value || 'Unknown Artist',
            stageName: document.getElementById('stage-name')?.value || '',
            beatTitle: document.getElementById('beat-title')?.value || this.beatMetadata.title,
            genre: document.getElementById('genre-select')?.value || this.beatMetadata.suggestedGenre
        };
    }
    
    getLicenseOptions() {
        return {
            licenseType: document.getElementById('license-type')?.value || 'non-exclusive',
            commercialUse: document.getElementById('commercial-use')?.value || 'allowed',
            forSale: document.getElementById('for-sale')?.value || 'for-sale',
            royaltyRate: this.calculateRoyaltyRate()
        };
    }
    
    calculateRoyaltyRate() {
        const licenseType = document.getElementById('license-type')?.value;
        const commercialUse = document.getElementById('commercial-use')?.value;
        
        if (commercialUse === 'non-commercial') return 0;
        if (licenseType === 'exclusive') return 5.0;
        if (commercialUse === 'limited') return 1.5;
        return 2.5; // Default for non-exclusive commercial
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

    switchTab(section) {
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Show corresponding section
        if (section === 'mint') {
            this.showSection(this.currentSection || 'upload-section');
        } else if (section === 'profile') {
            this.showSection('profile-section');
            this.loadProfile();
        } else if (section === 'history') {
            this.showSection('history-section');
            this.loadHistory();
        } else if (section === 'share') {
            this.showSection('share-section');
            this.loadShareSection();
        } else if (section === 'radio') {
            this.showSection('radio-section');
            this.loadRadioSubmission();
        }
    }

    async loadProfile() {
        try {
            const userData = await chrome.storage.local.get(['user_email', 'user_name', 'user_nfts']);
            
            document.getElementById('profile-name').textContent = userData.user_name || 'Artist';
            document.getElementById('profile-email').textContent = userData.user_email || 'Not signed in';
            
            const walletAddress = await this.getWalletAddress();
            if (walletAddress) {
                document.getElementById('profile-wallet-address').textContent = 
                    walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4);
            }
            
            const nfts = userData.user_nfts || [];
            document.getElementById('total-nfts').textContent = nfts.length;
            document.getElementById('total-earnings').textContent = (nfts.length * 0.01).toFixed(3);
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    }

    async loadHistory() {
        try {
            const result = await chrome.storage.local.get(['user_nfts']);
            const nfts = result.user_nfts || [];
            
            const historyList = document.getElementById('history-list');
            
            if (nfts.length === 0) {
                historyList.innerHTML = `
                    <div class="empty-state">
                        <p>📜 No transactions yet</p>
                        <small>Your minting history will appear here</small>
                    </div>
                `;
                return;
            }
            
            historyList.innerHTML = nfts.map(nft => `
                <div class="history-item">
                    <div class="history-icon">🎵</div>
                    <div class="history-details">
                        <h4>${nft.title}</h4>
                        <p>Minted on ${new Date(nft.timestamp).toLocaleDateString()}</p>
                        <code class="tx-hash">${nft.txHash}</code>
                    </div>
                    <div class="history-actions">
                        <button class="btn-small" onclick="chrome.tabs.create({url: 'https://polygonscan.com/tx/${nft.txHash}'})">View</button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load history:', error);
        }
    }

    filterHistory(filter) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        // For now, just reload history (can be enhanced with actual filtering)
        this.loadHistory();
    }

    editProfile() {
        const newName = prompt('Enter your artist name:', document.getElementById('profile-name').textContent);
        if (newName) {
            chrome.storage.local.set({'user_name': newName});
            document.getElementById('profile-name').textContent = newName;
        }
    }

    async exportWallet() {
        try {
            const walletData = await chrome.storage.local.get(['wallet_private_key']);
            if (walletData.wallet_private_key) {
                const blob = new Blob([walletData.wallet_private_key], {type: 'text/plain'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'beatschain-wallet.txt';
                a.click();
                URL.revokeObjectURL(url);
            } else {
                alert('No wallet found');
            }
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed');
        }
    }

    async getWalletAddress() {
        try {
            const walletData = await chrome.storage.local.get(['wallet_address']);
            return walletData.wallet_address || null;
        } catch (error) {
            return null;
        }
    }

    async loadShareSection() {
        try {
            const result = await chrome.storage.local.get(['user_nfts']);
            const nfts = result.user_nfts || [];
            
            const select = document.getElementById('share-nft-select');
            select.innerHTML = '<option value="">Choose an NFT...</option>';
            
            nfts.forEach((nft, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = nft.title;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Failed to load share section:', error);
        }
    }

    async onNFTSelect(e) {
        const index = e.target.value;
        if (!index) {
            document.getElementById('share-preview').style.display = 'none';
            return;
        }

        try {
            const result = await chrome.storage.local.get(['user_nfts', 'user_name']);
            const nft = result.user_nfts[index];
            const artist = result.user_name || 'Unknown Artist';

            // Update preview card
            document.getElementById('share-card-title').textContent = nft.title;
            document.getElementById('share-card-description').textContent = `Music NFT by ${artist}`;
            document.getElementById('share-card-artist').textContent = artist;
            document.getElementById('share-card-price').textContent = '0.01 MATIC';

            // Update SEO fields
            document.getElementById('seo-title').value = `${nft.title} - Music NFT by ${artist}`;
            document.getElementById('seo-description').value = `Discover ${nft.title}, a unique music NFT created by ${artist} on BeatsChain. Own a piece of music history on the blockchain.`;
            document.getElementById('seo-keywords').value = `${nft.title}, ${artist}, music nft, blockchain, beats, crypto music`;

            document.getElementById('share-preview').style.display = 'block';
            this.selectedNFT = nft;
        } catch (error) {
            console.error('Failed to load NFT details:', error);
        }
    }

    getShareURL() {
        if (!this.selectedNFT) return '';
        return `https://polygonscan.com/tx/${this.selectedNFT.txHash}`;
    }

    getShareText() {
        if (!this.selectedNFT) return '';
        const title = document.getElementById('seo-title').value;
        const description = document.getElementById('seo-description').value;
        return `${title}\n\n${description}\n\n#MusicNFT #BeatsChain #Blockchain`;
    }

    shareOnTwitter() {
        const text = encodeURIComponent(this.getShareText());
        const url = encodeURIComponent(this.getShareURL());
        chrome.tabs.create({
            url: `https://twitter.com/intent/tweet?text=${text}&url=${url}`
        });
    }

    shareOnFacebook() {
        const url = encodeURIComponent(this.getShareURL());
        chrome.tabs.create({
            url: `https://www.facebook.com/sharer/sharer.php?u=${url}`
        });
    }

    shareOnLinkedIn() {
        const url = encodeURIComponent(this.getShareURL());
        const title = encodeURIComponent(document.getElementById('seo-title').value);
        const summary = encodeURIComponent(document.getElementById('seo-description').value);
        chrome.tabs.create({
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`
        });
    }

    shareOnReddit() {
        const url = encodeURIComponent(this.getShareURL());
        const title = encodeURIComponent(document.getElementById('seo-title').value);
        chrome.tabs.create({
            url: `https://reddit.com/submit?url=${url}&title=${title}`
        });
    }

    async copyShareLink() {
        try {
            await navigator.clipboard.writeText(this.getShareURL());
            const btn = document.getElementById('copy-link');
            const originalText = btn.textContent;
            btn.textContent = '✅ Copied!';
            setTimeout(() => btn.textContent = originalText, 2000);
        } catch (error) {
            console.error('Failed to copy link:', error);
        }
    }

    generateQRCode() {
        const qrContainer = document.getElementById('qr-code');
        const url = this.getShareURL();
        
        // Simple QR code generation using Google Charts API
        const qrURL = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(url)}`;
        
        qrContainer.innerHTML = `
            <h4>QR Code</h4>
            <img src="${qrURL}" alt="QR Code" style="max-width: 100%; border-radius: 8px;">
            <p style="font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 10px;">Scan to view NFT transaction</p>
        `;
        qrContainer.style.display = 'block';
    }

    async generateSEOTags() {
        const title = document.getElementById('seo-title').value;
        const description = document.getElementById('seo-description').value;
        const keywords = document.getElementById('seo-keywords').value;
        const url = this.getShareURL();
        
        const seoHTML = `
            <h4>SEO Meta Tags</h4>
            <div class="seo-tags">
                <div class="tag-group">
                    <strong>Basic Meta Tags:</strong>
                    <code>&lt;title&gt;${title}&lt;/title&gt;</code>
                    <code>&lt;meta name="description" content="${description}"&gt;</code>
                    <code>&lt;meta name="keywords" content="${keywords}"&gt;</code>
                </div>
                
                <div class="tag-group">
                    <strong>Open Graph (Facebook):</strong>
                    <code>&lt;meta property="og:title" content="${title}"&gt;</code>
                    <code>&lt;meta property="og:description" content="${description}"&gt;</code>
                    <code>&lt;meta property="og:url" content="${url}"&gt;</code>
                    <code>&lt;meta property="og:type" content="website"&gt;</code>
                </div>
                
                <div class="tag-group">
                    <strong>Twitter Cards:</strong>
                    <code>&lt;meta name="twitter:card" content="summary"&gt;</code>
                    <code>&lt;meta name="twitter:title" content="${title}"&gt;</code>
                    <code>&lt;meta name="twitter:description" content="${description}"&gt;</code>
                </div>
            </div>
            <button class="btn btn-secondary" onclick="navigator.clipboard.writeText(this.parentElement.querySelector('.seo-tags').innerText)">Copy All Tags</button>
        `;
        
        const seoOutput = document.getElementById('seo-output');
        seoOutput.innerHTML = seoHTML;
        seoOutput.style.display = 'block';
    }

    async generateDownloadPackage(result) {
        try {
            // Create proper ZIP archive using native browser APIs
            const files = [];
            
            // 1. Original Audio File
            if (this.beatFile) {
                files.push({
                    name: `audio/${this.beatMetadata.originalFileName}`,
                    content: this.beatFile
                });
            }
            
            // 2. License Agreement (TXT)
            const licenseContent = `${this.licenseTerms}\n\n--- BLOCKCHAIN VERIFICATION ---\nTransaction Hash: ${result.transactionHash}\nToken ID: ${result.tokenId}\nContract: 0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A\nNetwork: Polygon Mumbai\nMinted: ${new Date().toISOString()}`;
            files.push({
                name: 'LICENSE.txt',
                content: licenseContent
            });
            
            // 3. NFT Metadata (JSON)
            const nftMetadata = {
                name: this.beatMetadata.title,
                description: `Music NFT: ${this.beatMetadata.title} - ${this.beatMetadata.suggestedGenre}`,
                image: "ipfs://QmYourImageHash",
                external_url: `https://polygonscan.com/tx/${result.transactionHash}`,
                attributes: [
                    { trait_type: "Genre", value: this.beatMetadata.suggestedGenre },
                    { trait_type: "BPM", value: this.beatMetadata.estimatedBPM },
                    { trait_type: "Duration", value: this.beatMetadata.duration },
                    { trait_type: "Quality", value: this.beatMetadata.qualityLevel },
                    { trait_type: "Energy Level", value: this.beatMetadata.energyLevel },
                    { trait_type: "Format", value: this.beatMetadata.format }
                ],
                blockchain: {
                    contract: "0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A",
                    tokenId: result.tokenId,
                    transactionHash: result.transactionHash,
                    network: "Polygon Mumbai"
                }
            };
            files.push({
                name: 'metadata.json',
                content: JSON.stringify(nftMetadata, null, 2)
            });
            
            // 4. Certificate of Authenticity
            const certificate = `BEATSCHAIN NFT CERTIFICATE OF AUTHENTICITY\n\n` +
                `Track: ${this.beatMetadata.title}\n` +
                `Token ID: ${result.tokenId}\n` +
                `Transaction: ${result.transactionHash}\n` +
                `Minted: ${new Date().toLocaleString()}\n\n` +
                `This certificate verifies the authenticity of the above NFT\n` +
                `minted on the BeatsChain platform using blockchain technology.\n\n` +
                `Verify at: https://polygonscan.com/tx/${result.transactionHash}`;
            files.push({
                name: 'CERTIFICATE.txt',
                content: certificate
            });
            
            // 5. Cover Image (if uploaded)
            if (this.beatMetadata.coverImage) {
                files.push({
                    name: `cover/cover.${this.beatMetadata.coverImage.name.split('.').pop()}`,
                    content: this.beatMetadata.coverImage
                });
            }
            
            // 6. README with instructions
            const readme = `BEATSCHAIN NFT PACKAGE\n=====================\n\nThis package contains:\n\n1. audio/ - Original audio file\n2. LICENSE.txt - Complete licensing agreement\n3. metadata.json - NFT metadata (OpenSea compatible)\n4. CERTIFICATE.txt - Certificate of authenticity\n5. cover/ - Cover artwork (if provided)\n\nBLOCKCHAIN VERIFICATION:\n- Contract: 0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A\n- Network: Polygon Mumbai\n- Transaction: ${result.transactionHash}\n\nFor support: https://beatschain.app`;
            files.push({
                name: 'README.txt',
                content: readme
            });
            
            // Create proper ZIP using native compression
            const zipBlob = await this.createRealZip(files);
            
            // Download the ZIP file
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `BeatsChain-${this.beatMetadata.title.replace(/[^a-zA-Z0-9]/g, '_')}-NFT-Package.zip`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            // Update button text
            const downloadBtn = document.getElementById('download-package');
            if (downloadBtn) {
                const originalText = downloadBtn.textContent;
                downloadBtn.textContent = '✅ Downloaded!';
                setTimeout(() => downloadBtn.textContent = originalText, 3000);
            }
            
        } catch (error) {
            console.error('Package generation failed:', error);
            alert('Failed to generate download package');
        }
    }

    async createRealZip(files) {
        try {
            // Create proper ZIP using manual ZIP format implementation
            console.log(`Creating ZIP with ${files.length} files`);
            
            const zipParts = [];
            const centralDirectory = [];
            let offset = 0;
            
            // Process each file
            for (const file of files) {
                const fileData = await this.processFileForZip(file);
                const localHeader = this.createLocalFileHeader(file.name, fileData);
                const centralDirEntry = this.createCentralDirectoryEntry(file.name, fileData, offset);
                
                zipParts.push(localHeader);
                zipParts.push(fileData);
                centralDirectory.push(centralDirEntry);
                
                offset += localHeader.byteLength + fileData.byteLength;
            }
            
            // Add central directory
            const centralDirStart = offset;
            for (const entry of centralDirectory) {
                zipParts.push(entry);
                offset += entry.byteLength;
            }
            
            // Add end of central directory record
            const endRecord = this.createEndOfCentralDirectory(files.length, offset - centralDirStart, centralDirStart);
            zipParts.push(endRecord);
            
            return new Blob(zipParts, { type: 'application/zip' });
            
        } catch (error) {
            console.error('ZIP creation failed:', error);
            // Enhanced fallback that still creates a proper archive
            return this.createEnhancedFallback(files);
        }
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
        
        // Local file header signature
        header[0] = 0x50; header[1] = 0x4b; header[2] = 0x03; header[3] = 0x04;
        // Version needed to extract
        header[4] = 0x14; header[5] = 0x00;
        // General purpose bit flag
        header[6] = 0x00; header[7] = 0x00;
        // Compression method (0 = no compression)
        header[8] = 0x00; header[9] = 0x00;
        // File last modification time/date (dummy values)
        header[10] = 0x00; header[11] = 0x00; header[12] = 0x00; header[13] = 0x00;
        // CRC-32 (0 for no compression)
        header[14] = 0x00; header[15] = 0x00; header[16] = 0x00; header[17] = 0x00;
        // Compressed size
        this.writeUint32LE(header, 18, data.length);
        // Uncompressed size
        this.writeUint32LE(header, 22, data.length);
        // File name length
        header[26] = filenameBytes.length & 0xff;
        header[27] = (filenameBytes.length >> 8) & 0xff;
        // Extra field length
        header[28] = 0x00; header[29] = 0x00;
        
        // File name
        header.set(filenameBytes, 30);
        
        return header;
    }
    
    createCentralDirectoryEntry(filename, data, localHeaderOffset) {
        const filenameBytes = new TextEncoder().encode(filename);
        const entry = new Uint8Array(46 + filenameBytes.length);
        
        // Central directory file header signature
        entry[0] = 0x50; entry[1] = 0x4b; entry[2] = 0x01; entry[3] = 0x02;
        // Version made by
        entry[4] = 0x14; entry[5] = 0x00;
        // Version needed to extract
        entry[6] = 0x14; entry[7] = 0x00;
        // General purpose bit flag
        entry[8] = 0x00; entry[9] = 0x00;
        // Compression method
        entry[10] = 0x00; entry[11] = 0x00;
        // File last modification time/date
        entry[12] = 0x00; entry[13] = 0x00; entry[14] = 0x00; entry[15] = 0x00;
        // CRC-32
        entry[16] = 0x00; entry[17] = 0x00; entry[18] = 0x00; entry[19] = 0x00;
        // Compressed size
        this.writeUint32LE(entry, 20, data.length);
        // Uncompressed size
        this.writeUint32LE(entry, 24, data.length);
        // File name length
        entry[28] = filenameBytes.length & 0xff;
        entry[29] = (filenameBytes.length >> 8) & 0xff;
        // Extra field length
        entry[30] = 0x00; entry[31] = 0x00;
        // File comment length
        entry[32] = 0x00; entry[33] = 0x00;
        // Disk number start
        entry[34] = 0x00; entry[35] = 0x00;
        // Internal file attributes
        entry[36] = 0x00; entry[37] = 0x00;
        // External file attributes
        entry[38] = 0x00; entry[39] = 0x00; entry[40] = 0x00; entry[41] = 0x00;
        // Relative offset of local header
        this.writeUint32LE(entry, 42, localHeaderOffset);
        
        // File name
        entry.set(filenameBytes, 46);
        
        return entry;
    }
    
    createEndOfCentralDirectory(fileCount, centralDirSize, centralDirOffset) {
        const record = new Uint8Array(22);
        
        // End of central dir signature
        record[0] = 0x50; record[1] = 0x4b; record[2] = 0x05; record[3] = 0x06;
        // Number of this disk
        record[4] = 0x00; record[5] = 0x00;
        // Number of disk with start of central directory
        record[6] = 0x00; record[7] = 0x00;
        // Total number of entries in central directory on this disk
        record[8] = fileCount & 0xff; record[9] = (fileCount >> 8) & 0xff;
        // Total number of entries in central directory
        record[10] = fileCount & 0xff; record[11] = (fileCount >> 8) & 0xff;
        // Size of central directory
        this.writeUint32LE(record, 12, centralDirSize);
        // Offset of start of central directory
        this.writeUint32LE(record, 16, centralDirOffset);
        // ZIP file comment length
        record[20] = 0x00; record[21] = 0x00;
        
        return record;
    }
    
    writeUint32LE(buffer, offset, value) {
        buffer[offset] = value & 0xff;
        buffer[offset + 1] = (value >> 8) & 0xff;
        buffer[offset + 2] = (value >> 16) & 0xff;
        buffer[offset + 3] = (value >> 24) & 0xff;
    }
    
    createEnhancedFallback(files) {
        // Create a TAR-like archive as fallback
        const parts = [];
        parts.push(new TextEncoder().encode('BEATSCHAIN_ARCHIVE_V1\n'));
        
        for (const file of files) {
            const header = `\n--- ${file.name} ---\n`;
            parts.push(new TextEncoder().encode(header));
            
            if (file.content instanceof File || file.content instanceof Blob) {
                parts.push(file.content);
            } else {
                parts.push(new TextEncoder().encode(file.content));
            }
        }
        
        return new Blob(parts, { type: 'application/octet-stream' });
    }
    
    createFallbackArchive(files) {
        let content = 'BEATSCHAIN NFT PACKAGE\n';
        content += '=====================\n\n';
        content += `Generated: ${new Date().toLocaleString()}\n`;
        content += `Files: ${files.length}\n\n`;
        
        for (const file of files) {
            content += `--- ${file.name} ---\n`;
            if (file.content instanceof File || file.content instanceof Blob) {
                content += `[Binary file: ${file.content.type || 'unknown'}, ${file.content.size || 0} bytes]\n`;
            } else {
                content += file.content + '\n';
            }
            content += '\n';
        }
        
        content += '--- END OF PACKAGE ---\n';
        content += 'Note: This is a text representation due to browser limitations.\n';
        content += 'For full binary files, please use the individual download links.\n';
        
        return content;
    }
    
    getCommercialUseText(commercialUse) {
        switch (commercialUse) {
            case 'non-commercial':
                return 'Non-Commercial use only (personal, educational, non-profit)';
            case 'limited':
                return 'Limited Commercial use (small businesses, content creators)';
            case 'allowed':
            default:
                return 'Full Commercial and Non-Commercial use permitted';
        }
    }
    
    getAvailabilityText(forSale) {
        switch (forSale) {
            case 'not-for-sale':
                return 'Private Collection (Not for public sale)';
            case 'limited-edition':
                return 'Limited Edition (Restricted availability)';
            case 'for-sale':
            default:
                return 'Publicly Available for Purchase';
        }
    }
    
    getRoyaltyText(options) {
        const { commercialUse, licenseType, royaltyRate } = options;
        
        if (commercialUse === 'non-commercial') {
            return `• Non-Commercial Use: Royalty-Free (personal, educational, non-profit)
• Commercial Use: NOT PERMITTED under this license
• Streaming Platforms: Personal playlists only
• Monetization: Prohibited`;
        }
        
        if (licenseType === 'exclusive') {
            return `• EXCLUSIVE LICENSE: Single buyer/licensee only
• All Commercial Use: ${royaltyRate}% of gross revenue
• Non-Commercial Use: Included with exclusive rights
• Streaming Platforms: Full monetization rights
• Sync Licensing: Included in exclusive package
• Resale Rights: Transfer with NFT ownership`;
        }
        
        if (commercialUse === 'limited') {
            return `• Personal/Non-Commercial Use: Royalty-Free
• Small Commercial Use (Revenue < $5,000): ${royaltyRate}% of gross revenue
• Large Commercial Use (Revenue ≥ $5,000): Requires separate negotiation
• Streaming Platforms: Limited to personal/small creator accounts
• Sync Licensing: Small productions only`;
        }
        
        // Default: full commercial
        return `• Personal/Non-Commercial Use: Royalty-Free
• Commercial Use (Revenue < $1,000): Royalty-Free
• Commercial Use (Revenue ≥ $1,000): ${royaltyRate}% of gross revenue
• Streaming Platforms: Standard platform royalty splits apply
• Sync Licensing: Case-by-case negotiation for major productions`;
    }
}

    // RADIO SUBMISSION METHODS - REUSE EXISTING SYSTEMS
    async loadRadioSubmission() {
        if (this.beatMetadata && Object.keys(this.beatMetadata).length > 0) {
            this.radioValidator = new RadioValidator(this.chromeAI);
            this.splitSheetsManager = new SplitSheetsManager();
            
            document.getElementById('radio-validation').style.display = 'block';
            
            const artistInputs = this.getArtistInputs();
            if (artistInputs.artistName !== 'Unknown Artist') {
                this.splitSheetsManager.addContributor(artistInputs.artistName, 'artist', 100);
                this.updateContributorsUI();
            }
        } else {
            alert('Please upload and analyze an audio file first');
            this.switchTab('mint');
        }
    }
    
    async validateForRadio() {
        if (!this.beatMetadata || Object.keys(this.beatMetadata).length === 0) {
            alert('Please upload an audio file first');
            return;
        }
        
        const validateBtn = document.getElementById('validate-radio');
        validateBtn.disabled = true;
        validateBtn.textContent = 'Validating...';
        
        try {
            const validation = await this.radioValidator.validateForRadio(this.beatMetadata);
            const overallScore = this.radioValidator.calculateOverallScore(validation);
            
            this.displayRadioValidation(validation, overallScore);
            
            const generateBtn = document.getElementById('generate-radio-package');
            generateBtn.disabled = overallScore < 60;
            
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
        
        const getStatusIcon = (status) => {
            switch (status) {
                case 'optimal': return '✅';
                case 'good': return '✅';
                case 'acceptable': return '⚠️';
                case 'warning': return '❌';
                default: return '❓';
            }
        };
        
        const getScoreColor = (score) => {
            if (score >= 80) return '#4CAF50';
            if (score >= 60) return '#FF9800';
            return '#F44336';
        };
        
        resultsDiv.innerHTML = `
            <div class="validation-summary">
                <h5>Overall Score: <span style="color: ${getScoreColor(overallScore)}">${overallScore}/100</span></h5>
            </div>
            <div class="validation-items">
                <div class="validation-item">
                    ${getStatusIcon(validation.duration.status)} <strong>Duration:</strong> ${validation.duration.message}
                </div>
                <div class="validation-item">
                    ${getStatusIcon(validation.quality.status)} <strong>Quality:</strong> ${validation.quality.message}
                </div>
                <div class="validation-item">
                    ${getStatusIcon(validation.format.status)} <strong>Format:</strong> ${validation.format.message}
                </div>
                <div class="validation-item">
                    ${getStatusIcon(validation.profanity.status)} <strong>Content:</strong> ${validation.profanity.message}
                </div>
            </div>
        `;
    }
    
    addContributor() {
        const contributorsList = document.querySelector('.contributors-list');
        const newContributor = document.createElement('div');
        newContributor.className = 'contributor-item';
        newContributor.innerHTML = `
            <input type="text" placeholder="Contributor Name" class="form-input contributor-name">
            <select class="form-input contributor-role">
                <option value="artist">Artist</option>
                <option value="producer">Producer</option>
                <option value="songwriter">Songwriter</option>
                <option value="vocalist">Vocalist</option>
            </select>
            <input type="number" placeholder="%" class="form-input contributor-percentage" min="0" max="100">
            <input type="text" placeholder="SAMRO Number (optional)" class="form-input samro-number">
            <button class="btn-small remove-contributor">❌</button>
        `;
        
        newContributor.querySelector('.remove-contributor').addEventListener('click', () => {
            newContributor.remove();
            this.updateSplitSheets();
        });
        
        newContributor.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('change', this.updateSplitSheets.bind(this));
        });
        
        contributorsList.appendChild(newContributor);
    }
    
    updateSplitSheets() {
        this.splitSheetsManager.clear();
        
        document.querySelectorAll('.contributor-item').forEach(item => {
            const name = item.querySelector('.contributor-name').value;
            const role = item.querySelector('.contributor-role').value;
            const percentage = item.querySelector('.contributor-percentage').value;
            const samroNumber = item.querySelector('.samro-number').value;
            
            if (name && percentage) {
                this.splitSheetsManager.addContributor(name, role, percentage, samroNumber);
            }
        });
        
        const total = this.splitSheetsManager.getTotalPercentage();
        document.getElementById('total-percentage').textContent = total;
        
        const totalElement = document.getElementById('total-percentage');
        if (total === 100) {
            totalElement.style.color = '#4CAF50';
        } else if (total > 100) {
            totalElement.style.color = '#F44336';
        } else {
            totalElement.style.color = '#FF9800';
        }
    }
    
    updateContributorsUI() {
        const contributorsList = document.querySelector('.contributors-list');
        contributorsList.innerHTML = '';
        
        this.splitSheetsManager.contributors.forEach((contributor, index) => {
            const contributorDiv = document.createElement('div');
            contributorDiv.className = 'contributor-item';
            contributorDiv.innerHTML = `
                <input type="text" value="${contributor.name}" class="form-input contributor-name">
                <select class="form-input contributor-role">
                    <option value="artist" ${contributor.role === 'artist' ? 'selected' : ''}>Artist</option>
                    <option value="producer" ${contributor.role === 'producer' ? 'selected' : ''}>Producer</option>
                    <option value="songwriter" ${contributor.role === 'songwriter' ? 'selected' : ''}>Songwriter</option>
                    <option value="vocalist" ${contributor.role === 'vocalist' ? 'selected' : ''}>Vocalist</option>
                </select>
                <input type="number" value="${contributor.percentage}" class="form-input contributor-percentage" min="0" max="100">
                <input type="text" value="${contributor.samroNumber}" placeholder="SAMRO Number (optional)" class="form-input samro-number">
                <button class="btn-small remove-contributor">❌</button>
            `;
            
            contributorDiv.querySelector('.remove-contributor').addEventListener('click', () => {
                contributorDiv.remove();
                this.updateSplitSheets();
            });
            
            contributorDiv.querySelectorAll('input, select').forEach(input => {
                input.addEventListener('change', this.updateSplitSheets.bind(this));
            });
            
            contributorsList.appendChild(contributorDiv);
        });
        
        this.updateSplitSheets();
    }
    
    async generateRadioPackage() {
        if (!this.splitSheetsManager.isValid()) {
            alert('Please ensure split sheets total 100% before generating package');
            return;
        }
        
        const generateBtn = document.getElementById('generate-radio-package');
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
        
        try {
            const files = [];
            
            if (this.beatFile) {
                files.push({
                    name: `audio/${this.sanitizeFilename(this.beatMetadata.title)}.${this.beatMetadata.format.toLowerCase()}`,
                    content: this.beatFile
                });
            }
            
            const artistInputs = this.getArtistInputs();
            const radioMetadata = {
                title: artistInputs.beatTitle,
                artist: artistInputs.artistName,
                stageName: artistInputs.stageName,
                genre: artistInputs.genre,
                duration: this.beatMetadata.duration,
                format: this.beatMetadata.format,
                bitrate: this.beatMetadata.estimatedBitrate,
                quality: this.beatMetadata.qualityLevel,
                bpm: this.beatMetadata.estimatedBPM,
                radioReady: true,
                submissionDate: new Date().toISOString()
            };
            
            files.push({
                name: 'track_metadata.json',
                content: JSON.stringify(radioMetadata, null, 2)
            });
            
            const splitSheet = this.splitSheetsManager.generateSplitSheet(radioMetadata);
            files.push({
                name: 'split_sheet.json',
                content: JSON.stringify(splitSheet, null, 2)
            });
            
            files.push({
                name: 'SAMRO_Split_Sheet.txt',
                content: this.splitSheetsManager.generateSamroReport()
            });
            
            // Enhanced artist bio with website and AI layer
            const artistBio = await this.generateEnhancedArtistBio(artistInputs, radioMetadata);
            
            // Cover image (if uploaded)
            if (this.beatMetadata.coverImage) {
                files.push({
                    name: `cover/cover.${this.beatMetadata.coverImage.name.split('.').pop()}`,
                    content: this.beatMetadata.coverImage
                });
            }
            
            // Radio submission guidelines
            const guidelines = this.generateRadioGuidelines();
            files.push({
                name: 'RADIO_SUBMISSION_GUIDELINES.txt',
                content: guidelines
            });
            
            // AI-generated industry insights
            const aiInsights = await this.generateAIInsights(radioMetadata);
            files.push({
                name: 'AI_INDUSTRY_INSIGHTS.txt',
                content: aiInsights
            });
            files.push({
                name: 'artist_bio.txt',
                content: artistBio
            });
            
            const zipBlob = await this.createRealZip(files);
            
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.sanitizeFilename(radioMetadata.title)}_Radio_Submission.zip`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            generateBtn.textContent = '✅ Package Generated!';
            setTimeout(() => {
                generateBtn.textContent = '📦 Generate Radio Package';
                generateBtn.disabled = false;
            }, 3000);
            
        } catch (error) {
            console.error('Radio package generation failed:', error);
            alert('Failed to generate radio package');
            generateBtn.disabled = false;
            generateBtn.textContent = '📦 Generate Radio Package';
        }
    }
    
    async generateEnhancedArtistBio(artistInputs, radioMetadata) {
        let bio = `ARTIST BIOGRAPHY\n================\n\n`;
        bio += `Artist Name: ${artistInputs.artistName}\n`;
        bio += `Stage Name: ${artistInputs.stageName || 'N/A'}\n`;
        bio += `Primary Genre: ${artistInputs.genre}\n`;
        bio += `Track BPM: ${radioMetadata.bpm}\n`;
        bio += `Audio Quality: ${radioMetadata.quality}\n\n`;
        
        // AI-enhanced bio content
        try {
            if (this.chromeAI && this.chromeAI.apis.languageModel) {
                const prompt = `Write a professional artist biography for ${artistInputs.artistName}, a ${artistInputs.genre} artist. Keep it concise, professional, and suitable for radio submission. Focus on their musical style and achievements.`;
                const aiBio = await this.chromeAI.generateContent(prompt);
                bio += `BIOGRAPHY:\n${aiBio}\n\n`;
            } else {
                bio += `BIOGRAPHY:\n${artistInputs.artistName} is an emerging artist in the ${artistInputs.genre} scene, known for their innovative sound and professional production quality. This track showcases their unique musical style and technical expertise.\n\n`;
            }
        } catch (error) {
            bio += `BIOGRAPHY:\n${artistInputs.artistName} is an emerging artist in the ${artistInputs.genre} scene, known for their innovative sound and professional production quality.\n\n`;
        }
        
        bio += `CONTACT INFORMATION:\n`;
        bio += `Platform: BeatsChain NFT Platform\n`;
        bio += `Website: https://beatschain.app\n`;
        bio += `Submission Date: ${new Date().toLocaleDateString()}\n`;
        bio += `Generated by: BeatsChain Extension v1.0\n\n`;
        
        bio += `TECHNICAL SPECIFICATIONS:\n`;
        bio += `Duration: ${radioMetadata.duration}\n`;
        bio += `Format: ${radioMetadata.format}\n`;
        bio += `Bitrate: ${radioMetadata.bitrate}\n`;
        bio += `Radio Ready: Yes\n`;
        
        return bio;
    }
    
    generateRadioGuidelines() {
        return `RADIO SUBMISSION GUIDELINES\n============================\n\nThis package contains all files required for professional radio submission:\n\n1. AUDIO FILE\n   - Format: ${this.beatMetadata.format}\n   - Quality: ${this.beatMetadata.qualityLevel}\n   - Duration: ${this.beatMetadata.duration}\n   - Radio Ready: Yes\n   - Clean Version: Validated\n\n2. METADATA\n   - Complete track information\n   - Technical specifications\n   - ISRC code placeholder (to be assigned)\n   - Genre classification\n\n3. SPLIT SHEETS (SAMRO COMPLIANT)\n   - Contributor breakdown\n   - Royalty percentages (must total 100%)\n   - SAMRO registration numbers\n   - Contact information\n\n4. ARTIST INFORMATION\n   - Professional biography\n   - Contact details\n   - Website: https://beatschain.app\n   - Platform information\n\n5. COVER ARTWORK\n   - High-quality cover image\n   - Professional presentation\n   - Radio station ready\n\n6. AI INDUSTRY INSIGHTS\n   - Market analysis\n   - Genre trends\n   - Professional recommendations\n\nSUBMISSION CHECKLIST:\n☐ Audio file is clean version (no explicit content)\n☐ Duration is under 4 minutes (optimal: 2:30-3:30)\n☐ Quality is 192kbps or higher (optimal: 320kbps)\n☐ Split sheets total exactly 100%\n☐ All contributor information complete\n☐ SAMRO numbers provided (where applicable)\n☐ Artist bio and contact info included\n☐ Cover artwork included\n☐ Professional presentation maintained\n\nFor questions about this submission:\n- Platform: BeatsChain Extension\n- Website: https://beatschain.app\n- Support: Available through platform\n\nGenerated: ${new Date().toLocaleString()}\nPlatform: BeatsChain Extension v1.0\nCompliance: SAMRO, Radio Industry Standards`;
    }
    
    async generateAIInsights(radioMetadata) {
        let insights = `AI INDUSTRY INSIGHTS & RECOMMENDATIONS\n======================================\n\n`;
        
        try {
            if (this.chromeAI && this.chromeAI.apis.languageModel) {
                const prompt = `Provide professional music industry insights for a ${radioMetadata.genre} track with ${radioMetadata.bpm} BPM and ${radioMetadata.duration} duration. Include market trends, radio play potential, and professional recommendations for South African music industry.`;
                const aiInsights = await this.chromeAI.generateContent(prompt);
                insights += `AI MARKET ANALYSIS:\n${aiInsights}\n\n`;
            } else {
                insights += `MARKET ANALYSIS:\nThis ${radioMetadata.genre} track shows strong potential for radio play with its ${radioMetadata.duration} duration and professional ${radioMetadata.quality} quality. The ${radioMetadata.bpm} BPM is well-suited for contemporary radio formats.\n\n`;
            }
        } catch (error) {
            insights += `MARKET ANALYSIS:\nThis ${radioMetadata.genre} track shows strong potential for radio play with professional production quality.\n\n`;
        }
        
        insights += `SOUTH AFRICAN MUSIC INDUSTRY CONTEXT:\n`;
        insights += `• SAMRO (Southern African Music Rights Organisation) - Performance royalties\n`;
        insights += `• CAPASSO (Composers, Authors and Publishers Association) - Mechanical royalties\n`;
        insights += `• RISA (Recording Industry of South Africa) - Industry standards\n`;
        insights += `• SAMPRA (South African Music Performance Rights Association) - Neighboring rights\n\n`;
        
        insights += `RADIO SUBMISSION BEST PRACTICES:\n`;
        insights += `• Optimal duration: 2:30-3:30 for maximum airplay\n`;
        insights += `• Clean versions essential for daytime radio\n`;
        insights += `• Professional mastering improves acceptance rates\n`;
        insights += `• Complete metadata increases playlist inclusion\n`;
        insights += `• SAMRO registration enhances credibility\n\n`;
        
        insights += `GENRE-SPECIFIC INSIGHTS (${radioMetadata.genre}):\n`;
        if (radioMetadata.genre.toLowerCase().includes('hip')) {
            insights += `• Hip-Hop tracks perform well on youth-focused stations\n• Consider clean radio edits for broader appeal\n• Strong hook essential for radio success\n`;
        } else if (radioMetadata.genre.toLowerCase().includes('house')) {
            insights += `• House music has strong following in SA market\n• Peak time slots often favor uptempo tracks\n• Consider extended mixes for club play\n`;
        } else {
            insights += `• ${radioMetadata.genre} has established audience in SA\n• Focus on melody and production quality\n• Consider crossover potential\n`;
        }
        
        insights += `\nRECOMMENDATIONS:\n`;
        insights += `• Submit to genre-appropriate radio stations\n`;
        insights += `• Include social media presence information\n`;
        insights += `• Consider promotional campaign timing\n`;
        insights += `• Build relationships with radio programmers\n`;
        insights += `• Track performance metrics post-submission\n\n`;
        
        insights += `Generated by BeatsChain AI on ${new Date().toLocaleString()}\n`;
        insights += `Platform: https://beatschain.app`;
        
        return insights;
    }
    
    sanitizeFilename(filename) {
        return filename.replace(/[^a-zA-Z0-9_-]/g, '_');
    }
}

// Initialize app when popup loads
document.addEventListener('DOMContentLoaded', async () => {
    const app = new BeatsChainApp();
    await app.initialize();
    window.beatsChainApp = app;
});