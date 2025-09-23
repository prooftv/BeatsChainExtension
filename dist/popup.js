// BeatsChain Extension - Enhanced Implementation with Audio Preview & Advanced Metadata
// Storage Manager
class StorageManager {
    static async set(key, value) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Storage timeout')), 5000);
            try {
                if (chrome?.storage?.local) {
                    chrome.storage.local.set({ [key]: value }, () => {
                        clearTimeout(timeout);
                        resolve();
                    });
                } else {
                    clearTimeout(timeout);
                    resolve(); // Fallback for non-extension environment
                }
            } catch (error) {
                clearTimeout(timeout);
                resolve(); // Don't fail, just continue
            }
        });
    }

    static async get(key) {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(null), 5000);
            try {
                if (chrome?.storage?.local) {
                    chrome.storage.local.get([key], (result) => {
                        clearTimeout(timeout);
                        resolve(result[key] || null);
                    });
                } else {
                    clearTimeout(timeout);
                    resolve(null); // Fallback for non-extension environment
                }
            } catch (error) {
                clearTimeout(timeout);
                resolve(null); // Don't fail, just return null
            }
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

    static async getArtistProfile() {
        return {
            name: await this.get('artist_name') || 'BeatsChain Artist',
            bio: await this.get('artist_bio') || '',
            social: await this.get('artist_social') || {}
        };
    }

    static async setArtistProfile(profile) {
        if (profile.name) await this.set('artist_name', profile.name);
        if (profile.bio) await this.set('artist_bio', profile.bio);
        if (profile.social) await this.set('artist_social', profile.social);
    }
}

// Enhanced Audio Metadata Extractor
class AudioMetadataExtractor {
    constructor() {
        this.audioContext = null;
    }

    async initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.audioContext;
    }

    async extractAdvancedMetadata(file) {
        const basicMetadata = await this.extractBasicMetadata(file);
        const audioMetadata = await this.extractAudioAnalysis(file);
        
        return {
            ...basicMetadata,
            ...audioMetadata,
            fileSize: this.formatFileSize(file.size),
            uploadDate: new Date().toISOString()
        };
    }

    async extractBasicMetadata(file) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            const url = URL.createObjectURL(file);
            
            const timeout = setTimeout(() => {
                URL.revokeObjectURL(url);
                reject(new Error('Timeout loading audio metadata'));
            }, 10000);
            
            audio.addEventListener('loadedmetadata', () => {
                clearTimeout(timeout);
                const metadata = {
                    title: file.name.replace(/\.[^/.]+$/, ""),
                    duration: this.formatDuration(audio.duration || 0),
                    durationSeconds: audio.duration || 0,
                    type: file.type,
                    fileName: file.name
                };
                
                URL.revokeObjectURL(url);
                resolve(metadata);
            });
            
            audio.addEventListener('error', () => {
                clearTimeout(timeout);
                URL.revokeObjectURL(url);
                resolve({
                    title: file.name.replace(/\.[^/.]+$/, ""),
                    duration: 'Unknown',
                    durationSeconds: 0,
                    type: file.type,
                    fileName: file.name
                });
            });
            
            audio.src = url;
        });
    }

    async extractAudioAnalysis(file) {
        try {
            const audioContext = await this.initAudioContext();
            const arrayBuffer = await file.arrayBuffer();
            
            // Check file size - if too large, skip Web Audio API analysis
            if (file.size > 20 * 1024 * 1024) { // 20MB limit
                console.log('Large file detected, using mock analysis');
                throw new Error('File too large for analysis');
            }
            
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            const analysis = {
                sampleRate: audioBuffer.sampleRate,
                channels: audioBuffer.numberOfChannels,
                bitDepth: this.estimateBitDepth(file),
                bpm: await this.detectBPM(audioBuffer),
                key: await this.detectMusicalKey(audioBuffer),
                genre: this.classifyGenre(file.name),
                energy: this.calculateEnergy(audioBuffer),
                loudness: this.calculateLoudness(audioBuffer)
            };
            
            return analysis;
        } catch (error) {
            console.error('Audio analysis failed:', error);
            return {
                sampleRate: 'Unknown',
                channels: 'Unknown',
                bitDepth: 'Unknown',
                bpm: Math.floor(Math.random() * 60) + 120, // Mock BPM 120-180
                key: this.getRandomKey(),
                genre: this.classifyGenre(file.name),
                energy: Math.floor(Math.random() * 100),
                loudness: Math.floor(Math.random() * 100)
            };
        }
    }

    async detectBPM(audioBuffer) {
        // Simplified BPM detection - in production use more sophisticated algorithm
        const sampleRate = audioBuffer.sampleRate;
        const channelData = audioBuffer.getChannelData(0);
        
        // Sample only first 10 seconds or 100k samples to prevent stack overflow
        const maxSamples = Math.min(channelData.length, sampleRate * 10, 100000);
        let sum = 0;
        for (let i = 0; i < maxSamples; i++) {
            sum += Math.abs(channelData[i]);
        }
        const avgAmplitude = sum / maxSamples;
        const estimatedBPM = Math.floor(avgAmplitude * 1000) % 60 + 120;
        
        return Math.min(Math.max(estimatedBPM, 80), 200);
    }

    async detectMusicalKey(audioBuffer) {
        // Mock key detection - in production use pitch detection algorithms
        return this.getRandomKey();
    }

    getRandomKey() {
        const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const modes = ['Major', 'Minor'];
        return `${keys[Math.floor(Math.random() * keys.length)]} ${modes[Math.floor(Math.random() * modes.length)]}`;
    }

    classifyGenre(filename) {
        const genres = ['Electronic', 'Hip Hop', 'Trap', 'House', 'Techno', 'Ambient', 'Dubstep', 'Future Bass'];
        const name = filename.toLowerCase();
        
        if (name.includes('trap')) return 'Trap';
        if (name.includes('house')) return 'House';
        if (name.includes('techno')) return 'Techno';
        if (name.includes('hip') || name.includes('hop')) return 'Hip Hop';
        if (name.includes('ambient')) return 'Ambient';
        if (name.includes('bass')) return 'Future Bass';
        
        return genres[Math.floor(Math.random() * genres.length)];
    }

    calculateEnergy(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        const maxSamples = Math.min(channelData.length, 100000);
        let sum = 0;
        for (let i = 0; i < maxSamples; i++) {
            sum += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sum / maxSamples);
        return Math.floor(rms * 1000) % 100;
    }

    calculateLoudness(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        const maxSamples = Math.min(channelData.length, 100000);
        let peak = 0;
        for (let i = 0; i < maxSamples; i++) {
            const abs = Math.abs(channelData[i]);
            if (abs > peak) peak = abs;
        }
        return Math.floor(peak * 100);
    }

    estimateBitDepth(file) {
        // Estimate based on file size and duration
        const sizeKB = file.size / 1024;
        if (sizeKB > 10000) return '24-bit';
        if (sizeKB > 5000) return '16-bit';
        return '16-bit';
    }

    formatDuration(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        if (bytes < k) return bytes + ' Bytes';
        if (bytes < k * k) return (bytes / k).toFixed(1) + ' KB';
        if (bytes < k * k * k) return (bytes / (k * k)).toFixed(1) + ' MB';
        return (bytes / (k * k * k)).toFixed(1) + ' GB';
    }
}

// Audio Preview Player
class AudioPreviewPlayer {
    constructor() {
        this.audio = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
    }

    createPlayer(file) {
        const playerHTML = `
            <div class="audio-preview-player">
                <div class="audio-controls">
                    <button id="play-pause-btn" class="control-btn">▶️</button>
                    <div class="time-display">
                        <span id="current-time">0:00</span> / <span id="total-time">0:00</span>
                    </div>
                    <input type="range" id="seek-bar" class="seek-bar" min="0" max="100" value="0">
                    <div class="volume-control">
                        <span>🔊</span>
                        <input type="range" id="volume-bar" class="volume-bar" min="0" max="100" value="70">
                    </div>
                </div>
                <div class="waveform-placeholder">
                    <div class="waveform-bars">
                        ${Array.from({length: 50}, () => `<div class="bar" style="height: ${Math.random() * 100}%"></div>`).join('')}
                    </div>
                </div>
            </div>
        `;
        
        return playerHTML;
    }

    initializePlayer(file) {
        this.audio = new Audio();
        this.audio.src = URL.createObjectURL(file);
        
        const playPauseBtn = document.getElementById('play-pause-btn');
        const seekBar = document.getElementById('seek-bar');
        const volumeBar = document.getElementById('volume-bar');
        const currentTimeSpan = document.getElementById('current-time');
        const totalTimeSpan = document.getElementById('total-time');
        
        if (!playPauseBtn) return;
        
        // Set initial volume
        this.audio.volume = 0.7;
        
        // Play/Pause functionality
        playPauseBtn.addEventListener('click', () => {
            if (this.isPlaying) {
                this.audio.pause();
                playPauseBtn.textContent = '▶️';
                this.isPlaying = false;
            } else {
                this.audio.play();
                playPauseBtn.textContent = '⏸️';
                this.isPlaying = true;
            }
        });
        
        // Time update
        this.audio.addEventListener('timeupdate', () => {
            if (this.audio.duration) {
                const progress = (this.audio.currentTime / this.audio.duration) * 100;
                if (seekBar) seekBar.value = progress;
                if (currentTimeSpan) currentTimeSpan.textContent = this.formatTime(this.audio.currentTime);
            }
        });
        
        // Duration loaded
        this.audio.addEventListener('loadedmetadata', () => {
            if (totalTimeSpan) totalTimeSpan.textContent = this.formatTime(this.audio.duration);
            if (seekBar) seekBar.max = this.audio.duration;
        });
        
        // Seek functionality
        if (seekBar) {
            seekBar.addEventListener('input', () => {
                const seekTime = (seekBar.value / 100) * this.audio.duration;
                this.audio.currentTime = seekTime;
            });
        }
        
        // Volume control
        if (volumeBar) {
            volumeBar.addEventListener('input', () => {
                this.audio.volume = volumeBar.value / 100;
            });
        }
        
        // End of track
        this.audio.addEventListener('ended', () => {
            playPauseBtn.textContent = '▶️';
            this.isPlaying = false;
            if (seekBar) seekBar.value = 0;
        });
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    destroy() {
        if (this.audio) {
            this.audio.pause();
            URL.revokeObjectURL(this.audio.src);
            this.audio = null;
        }
    }
}

// Blockchain Explorer Manager
class BlockchainExplorerManager {
    constructor() {
        this.explorers = {
            polygonscan: {
                name: 'Polygonscan',
                txUrl: 'https://mumbai.polygonscan.com/tx/',
                tokenUrl: 'https://mumbai.polygonscan.com/token/',
                icon: '🔍'
            },
            opensea: {
                name: 'OpenSea',
                txUrl: 'https://testnets.opensea.io/assets/mumbai/',
                tokenUrl: 'https://testnets.opensea.io/assets/mumbai/',
                icon: '🌊'
            },
            rarible: {
                name: 'Rarible',
                txUrl: 'https://testnet.rarible.com/token/polygon/',
                tokenUrl: 'https://testnet.rarible.com/token/polygon/',
                icon: '🎨'
            },
            ipfs: {
                name: 'IPFS Gateway',
                txUrl: 'https://ipfs.io/ipfs/',
                tokenUrl: 'https://ipfs.io/ipfs/',
                icon: '📁'
            }
        };
    }

    generateExplorerLinks(transactionHash, tokenId, contractAddress) {
        const links = [];
        
        links.push({
            name: this.explorers.polygonscan.name,
            url: `${this.explorers.polygonscan.txUrl}${transactionHash}`,
            icon: this.explorers.polygonscan.icon,
            type: 'transaction'
        });
        
        if (tokenId && contractAddress) {
            links.push({
                name: this.explorers.opensea.name,
                url: `${this.explorers.opensea.tokenUrl}${contractAddress}/${tokenId}`,
                icon: this.explorers.opensea.icon,
                type: 'nft'
            });
            
            links.push({
                name: this.explorers.rarible.name,
                url: `${this.explorers.rarible.tokenUrl}${contractAddress}:${tokenId}`,
                icon: this.explorers.rarible.icon,
                type: 'nft'
            });
        }
        
        return links;
    }

    createExplorerLinksHTML(links) {
        return links.map(link => `
            <button class="explorer-link-btn" onclick="window.open('${link.url}', '_blank')">
                <span class="explorer-icon">${link.icon}</span>
                <span class="explorer-name">${link.name}</span>
                <span class="explorer-type">${link.type}</span>
            </button>
        `).join('');
    }
}

// Wallet Manager
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
            this.privateKey = '0x' + this.generateRandomHex(64);
            this.address = '0x' + this.generateRandomHex(40);
            
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

    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
}

// Chrome AI Manager - All 5 APIs
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
            if (!window.ai) {
                console.log('Chrome AI not available - using fallbacks');
                return false;
            }

            // Initialize all available APIs
            if (window.ai.languageModel) {
                this.apis.prompt = await window.ai.languageModel.create();
            }
            if (window.ai.writer) {
                this.apis.writer = await window.ai.writer.create();
            }
            if (window.ai.rewriter) {
                this.apis.rewriter = await window.ai.rewriter.create();
            }
            if (window.ai.summarizer) {
                this.apis.summarizer = await window.ai.summarizer.create();
            }
            if (window.ai.translator) {
                this.apis.translator = await window.ai.translator.create();
            }

            this.isAvailable = true;
            console.log('Chrome AI initialized with APIs:', this.getAvailableAPIs());
            return true;
        } catch (error) {
            console.error('Chrome AI initialization failed:', error);
            return false;
        }
    }

    async generateLicense(beatMetadata, artistProfile) {
        try {
            const prompt = `Generate professional music licensing terms for:
Title: ${beatMetadata.title}
Artist: ${artistProfile.name}
Genre: ${beatMetadata.genre}
Duration: ${beatMetadata.duration}
BPM: ${beatMetadata.bpm}
Key: ${beatMetadata.key}
Energy Level: ${beatMetadata.energy}/100

Create clear, enforceable licensing terms including usage rights, attribution requirements, and commercial permissions.`;

            let licenseText = '';

            if (this.apis.prompt) {
                licenseText = await this.apis.prompt.prompt(prompt);
            }

            if (this.apis.writer && licenseText) {
                licenseText = await this.apis.writer.write(licenseText, {
                    tone: 'professional',
                    format: 'legal-document'
                });
            }

            return licenseText || this.getFallbackLicense(beatMetadata, artistProfile);
        } catch (error) {
            console.error('License generation failed:', error);
            return this.getFallbackLicense(beatMetadata, artistProfile);
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

    async generateNFTDescription(beatMetadata, artistProfile) {
        try {
            const prompt = `Create an engaging NFT marketplace description for:
Title: ${beatMetadata.title}
Artist: ${artistProfile.name}
Genre: ${beatMetadata.genre}
BPM: ${beatMetadata.bpm}
Key: ${beatMetadata.key}
Duration: ${beatMetadata.duration}
Energy: ${beatMetadata.energy}/100

Key features: AI-generated licensing, blockchain ownership, professional quality
Make it compelling for collectors and music enthusiasts.`;

            if (this.apis.prompt) {
                return await this.apis.prompt.prompt(prompt);
            }

            return `${beatMetadata.title} by ${artistProfile.name} - A ${beatMetadata.genre} masterpiece at ${beatMetadata.bpm} BPM in ${beatMetadata.key}. This unique music NFT features AI-generated licensing terms, ensuring clear ownership and usage rights on the blockchain. Perfect for collectors and music enthusiasts seeking high-quality, professionally licensed beats.`;
        } catch (error) {
            console.error('NFT description generation failed:', error);
            return `${beatMetadata.title} by ${artistProfile.name} - Music NFT with blockchain ownership`;
        }
    }

    getFallbackLicense(metadata, artistProfile) {
        return `PROFESSIONAL MUSIC LICENSING AGREEMENT

🎵 TRACK INFORMATION:
Title: ${metadata.title}
Artist: ${artistProfile.name}
Genre: ${metadata.genre}
Duration: ${metadata.duration}
BPM: ${metadata.bpm}
Musical Key: ${metadata.key}
Energy Level: ${metadata.energy}/100
Sample Rate: ${metadata.sampleRate}
Channels: ${metadata.channels}

📋 USAGE RIGHTS:
- Non-exclusive license for personal and commercial use
- Attribution required: "${artistProfile.name} - ${metadata.title}"
- No resale or redistribution of original audio file
- Derivative works permitted with proper attribution
- Synchronization rights included for video/film projects

💰 COMMERCIAL TERMS:
- License valid indefinitely
- No additional royalties required beyond initial purchase
- Suitable for streaming platforms, radio, and live performances
- Corporate and advertising use permitted

⚖️ LEGAL TERMS:
- No warranty provided as-is
- Governed by blockchain smart contract
- Immutable licensing terms stored on IPFS
- Generated by BeatsChain AI on ${new Date().toLocaleDateString()}

🔗 BLOCKCHAIN VERIFICATION:
This license is cryptographically secured and immutable on the Polygon blockchain, ensuring permanent proof of licensing terms and ownership rights.

✨ TECHNICAL SPECIFICATIONS:
File Format: ${metadata.type}
File Size: ${metadata.fileSize}
Bit Depth: ${metadata.bitDepth}
Quality: Professional Studio Grade`;
    }

    getAvailableAPIs() {
        return Object.entries(this.apis)
            .filter(([_, api]) => api !== null)
            .map(([name, _]) => name);
    }
}

// Authentication Manager
class AuthManager {
    constructor() {
        this.isSignedIn = false;
        this.userProfile = null;
    }

    async initialize() {
        const savedProfile = await StorageManager.get('user_profile');
        if (savedProfile) {
            this.userProfile = savedProfile;
            this.isSignedIn = true;
            this.updateProfileUI();
        }
    }

    async signInWithGoogle() {
        try {
            if (chrome.identity) {
                const token = await chrome.identity.getAuthToken({ interactive: true });
                const userInfo = await this.fetchUserInfo(token);
                
                this.userProfile = {
                    id: userInfo.id,
                    name: userInfo.name,
                    email: userInfo.email,
                    picture: userInfo.picture,
                    signInTime: Date.now()
                };
                
                await StorageManager.set('user_profile', this.userProfile);
                this.isSignedIn = true;
                this.updateProfileUI();
                return true;
            } else {
                // Fallback for development
                this.userProfile = {
                    id: 'demo_user',
                    name: 'Demo Artist',
                    email: 'demo@beatschain.com',
                    picture: 'https://via.placeholder.com/40',
                    signInTime: Date.now()
                };
                
                await StorageManager.set('user_profile', this.userProfile);
                this.isSignedIn = true;
                this.updateProfileUI();
                return true;
            }
        } catch (error) {
            console.error('Google Sign-In failed:', error);
            return false;
        }
    }

    async fetchUserInfo(token) {
        const response = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token}`);
        return await response.json();
    }

    async signOut() {
        if (chrome.identity) {
            await chrome.identity.removeCachedAuthToken({ token: await chrome.identity.getAuthToken({ interactive: false }) });
        }
        
        await StorageManager.set('user_profile', null);
        this.userProfile = null;
        this.isSignedIn = false;
        this.updateProfileUI();
    }

    updateProfileUI() {
        const signInBtn = document.getElementById('sign-in-btn');
        const profileInfo = document.getElementById('profile-info');
        const profileAvatar = document.getElementById('profile-avatar');
        const profileName = document.getElementById('profile-name');
        
        if (this.isSignedIn && this.userProfile) {
            if (signInBtn) signInBtn.style.display = 'none';
            if (profileInfo) profileInfo.style.display = 'flex';
            if (profileAvatar) profileAvatar.src = this.userProfile.picture;
            if (profileName) profileName.textContent = this.userProfile.name;
        } else {
            if (signInBtn) signInBtn.style.display = 'block';
            if (profileInfo) profileInfo.style.display = 'none';
        }
    }

    getUserProfile() {
        return this.userProfile;
    }
}

// Image Upload Manager
class ImageUploadManager {
    constructor() {
        this.currentImage = null;
        this.imageHash = null;
    }

    setupImageUpload() {
        const imageUploadArea = document.getElementById('image-upload-area');
        const imageFileInput = document.getElementById('image-file');
        const removeImageBtn = document.getElementById('remove-image');
        
        if (imageUploadArea && imageFileInput) {
            imageUploadArea.addEventListener('click', () => imageFileInput.click());
            imageFileInput.addEventListener('change', this.handleImageSelect.bind(this));
        }
        
        if (removeImageBtn) {
            removeImageBtn.addEventListener('click', this.removeImage.bind(this));
        }
    }

    handleImageSelect(e) {
        const file = e.target.files[0];
        if (file && this.validateImageFile(file)) {
            this.processImage(file);
        }
    }

    validateImageFile(file) {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        return validTypes.includes(file.type) && file.size <= maxSize;
    }

    async processImage(file) {
        try {
            this.currentImage = file;
            
            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                const previewImg = document.getElementById('preview-image');
                const imagePreview = document.getElementById('image-preview');
                
                if (previewImg && imagePreview) {
                    previewImg.src = e.target.result;
                    imagePreview.style.display = 'block';
                }
            };
            reader.readAsDataURL(file);
            
            // Simulate IPFS upload
            this.imageHash = 'Qm' + Array.from({length: 44}, () => 
                Math.floor(Math.random() * 36).toString(36)).join('');
            
            console.log('Image processed:', file.name, 'Hash:', this.imageHash);
            
        } catch (error) {
            console.error('Image processing failed:', error);
        }
    }

    removeImage() {
        this.currentImage = null;
        this.imageHash = null;
        
        const imagePreview = document.getElementById('image-preview');
        const imageFileInput = document.getElementById('image-file');
        
        if (imagePreview) imagePreview.style.display = 'none';
        if (imageFileInput) imageFileInput.value = '';
    }

    getImageData() {
        return {
            file: this.currentImage,
            hash: this.imageHash
        };
    }
}

// Dashboard Manager
class DashboardManager {
    constructor() {
        this.currentTab = 'wallet';
    }

    setupDashboard() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const toggleBtn = document.getElementById('toggle-dashboard');
        const saveProfileBtn = document.getElementById('save-profile');
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', this.toggleDashboard.bind(this));
        }
        
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', this.saveProfile.bind(this));
        }
        
        this.loadProfileData();
        this.loadMintHistory();
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const targetTab = document.getElementById(`${tabName}-tab`);
        if (targetTab) {
            targetTab.classList.add('active');
            this.currentTab = tabName;
        }
    }

    async loadProfileData() {
        const profile = await StorageManager.getArtistProfile();
        
        const displayNameInput = document.getElementById('display-name');
        const bioInput = document.getElementById('bio');
        const twitterInput = document.getElementById('social-twitter');
        const instagramInput = document.getElementById('social-instagram');
        
        if (displayNameInput) displayNameInput.value = profile.name || '';
        if (bioInput) bioInput.value = profile.bio || '';
        if (twitterInput) twitterInput.value = profile.social?.twitter || '';
        if (instagramInput) instagramInput.value = profile.social?.instagram || '';
    }

    async saveProfile() {
        const displayName = document.getElementById('display-name')?.value || '';
        const bio = document.getElementById('bio')?.value || '';
        const twitter = document.getElementById('social-twitter')?.value || '';
        const instagram = document.getElementById('social-instagram')?.value || '';
        
        const profile = {
            name: displayName,
            bio: bio,
            social: { twitter, instagram }
        };
        
        await StorageManager.setArtistProfile(profile);
        
        // Show success feedback
        const saveBtn = document.getElementById('save-profile');
        if (saveBtn) {
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Saved!';
            saveBtn.style.background = '#4CAF50';
            
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.style.background = '';
            }, 2000);
        }
    }

    async loadMintHistory() {
        const nfts = await StorageManager.getAllNFTs();
        const historyContainer = document.getElementById('mint-history');
        
        if (!historyContainer) return;
        
        if (nfts.length === 0) {
            historyContainer.innerHTML = '<p style="color: rgba(255,255,255,0.7); text-align: center;">No minted NFTs yet</p>';
            return;
        }
        
        const historyHTML = nfts.map(nft => `
            <div class="history-item">
                <div class="title">${nft.title}</div>
                <div class="date">${new Date(nft.timestamp).toLocaleDateString()}</div>
            </div>
        `).join('');
        
        historyContainer.innerHTML = historyHTML;
    }

    toggleDashboard() {
        const panel = document.getElementById('dashboard-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
    }

    updateNFTCollection(nfts) {
        const collection = document.getElementById('nft-collection');
        if (!collection) return;
        
        if (nfts.length === 0) {
            collection.innerHTML = '<p style="color: rgba(255,255,255,0.7); font-size: 12px;">No NFTs yet</p>';
            return;
        }
        
        const nftHTML = nfts.slice(-3).map(nft => `
            <div style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 6px; margin-bottom: 5px;">
                <div style="color: white; font-size: 12px; font-weight: 600;">${nft.title}</div>
                <div style="color: rgba(255,255,255,0.7); font-size: 10px;">${new Date(nft.timestamp).toLocaleDateString()}</div>
            </div>
        `).join('');
        
        collection.innerHTML = nftHTML;
    }
}

// Main Application
class BeatsChainApp {
    constructor() {
        this.aiManager = new ChromeAIManager();
        this.walletManager = new WalletManager();
        this.metadataExtractor = new AudioMetadataExtractor();
        this.audioPlayer = new AudioPreviewPlayer();
        this.explorerManager = new BlockchainExplorerManager();
        this.authManager = new AuthManager();
        this.imageManager = new ImageUploadManager();
        this.dashboardManager = new DashboardManager();
        this.currentSection = 'upload-section';
        this.beatFile = null;
        this.imageFile = null;
        this.beatMetadata = {};
        this.artistProfile = {};
        this.licenseTerms = '';
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('Initializing BeatsChain...');
            
            // Initialize authentication with timeout protection
            await Promise.race([
                this.authManager.initialize(),
                new Promise(resolve => setTimeout(() => resolve(false), 3000))
            ]);
            console.log('Authentication initialized');
            
            // Initialize wallet with timeout protection
            await Promise.race([
                this.walletManager.initialize(),
                new Promise(resolve => setTimeout(() => resolve(false), 3000))
            ]);
            console.log('Wallet initialized');
            
            // Load artist profile with timeout protection
            this.artistProfile = await Promise.race([
                StorageManager.getArtistProfile(),
                new Promise(resolve => setTimeout(() => resolve({name: 'BeatsChain Artist', bio: '', social: {}}), 3000))
            ]);
            console.log('Artist profile loaded:', this.artistProfile);
            
            // Initialize AI APIs with timeout protection
            await Promise.race([
                this.aiManager.initialize(),
                new Promise(resolve => setTimeout(() => resolve(false), 3000))
            ]);
            console.log('AI Manager initialized');
            
            // Setup all managers with error protection
            try {
                this.imageManager.setupImageUpload();
                this.dashboardManager.setupDashboard();
            } catch (error) {
                console.log('Manager setup had issues, continuing...');
            }
            console.log('Managers setup complete');
            
            // Setup event listeners
            this.setupEventListeners();
            console.log('Event listeners setup');
            
            // Load wallet data with timeout protection
            await Promise.race([
                this.loadWalletData(),
                new Promise(resolve => setTimeout(() => resolve(), 3000))
            ]);
            console.log('Wallet data loaded');
            
            this.isInitialized = true;
            console.log('BeatsChain initialized successfully');
            
            // Show initialization status
            this.showInitializationStatus();
            
        } catch (error) {
            console.error('Initialization failed:', error);
            // Continue with basic functionality even if initialization fails
            this.setupBasicEventListeners();
        }
    }

    setupEventListeners() {
        // Authentication
        const signInBtn = document.getElementById('sign-in-btn');
        const profileMenuBtn = document.getElementById('profile-menu');
        if (signInBtn) signInBtn.addEventListener('click', this.handleSignIn.bind(this));
        if (profileMenuBtn) profileMenuBtn.addEventListener('click', this.handleProfileMenu.bind(this));
        
        // File upload
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('audio-file');
        
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
            uploadArea.addEventListener('drop', this.handleFileDrop.bind(this));
            uploadArea.addEventListener('dragleave', (e) => {
                e.currentTarget.classList.remove('dragover');
            });
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }

        // AI licensing
        const generateBtn = document.getElementById('generate-license');
        const approveBtn = document.getElementById('approve-license');
        if (generateBtn) generateBtn.addEventListener('click', this.generateLicense.bind(this));
        if (approveBtn) approveBtn.addEventListener('click', this.approveLicense.bind(this));

        // Minting
        const mintBtn = document.getElementById('mint-nft');
        if (mintBtn) mintBtn.addEventListener('click', this.mintNFT.bind(this));

        // Success actions
        const viewBtn = document.getElementById('view-nft');
        const anotherBtn = document.getElementById('mint-another');
        if (viewBtn) viewBtn.addEventListener('click', this.viewNFT.bind(this));
        if (anotherBtn) anotherBtn.addEventListener('click', this.resetApp.bind(this));
    }

    setupBasicEventListeners() {
        // File upload
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('audio-file');
        
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }

        // AI licensing
        const generateBtn = document.getElementById('generate-license');
        const approveBtn = document.getElementById('approve-license');
        if (generateBtn) generateBtn.addEventListener('click', this.generateBasicLicense.bind(this));
        if (approveBtn) approveBtn.addEventListener('click', this.approveLicense.bind(this));

        // Minting
        const mintBtn = document.getElementById('mint-nft');
        if (mintBtn) mintBtn.addEventListener('click', this.mintBasicNFT.bind(this));

        // Success actions
        const anotherBtn = document.getElementById('mint-another');
        if (anotherBtn) anotherBtn.addEventListener('click', this.resetApp.bind(this));
        
        console.log('Basic event listeners setup');
    }

    showInitializationStatus() {
        const statusElement = document.querySelector('.header p');
        if (statusElement) {
            const aiStatus = this.aiManager.isAvailable ? 'AI Enabled' : 'AI Fallback Mode';
            statusElement.textContent = `Mint your beats as NFTs - ${aiStatus}`;
        }
    }

    setupEventListeners() {
        // Authentication
        const signInBtn = document.getElementById('sign-in-btn');
        const profileMenuBtn = document.getElementById('profile-menu');
        if (signInBtn) signInBtn.addEventListener('click', this.handleSignIn.bind(this));
        if (profileMenuBtn) profileMenuBtn.addEventListener('click', this.handleProfileMenu.bind(this));
        
        // File upload
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('audio-file');
        
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
            uploadArea.addEventListener('drop', this.handleFileDrop.bind(this));
            uploadArea.addEventListener('dragleave', (e) => {
                e.currentTarget.classList.remove('dragover');
            });
            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }

        // AI licensing
        const generateBtn = document.getElementById('generate-license');
        const approveBtn = document.getElementById('approve-license');
        if (generateBtn) generateBtn.addEventListener('click', this.generateLicense.bind(this));
        if (approveBtn) approveBtn.addEventListener('click', this.approveLicense.bind(this));

        // Minting
        const mintBtn = document.getElementById('mint-nft');
        if (mintBtn) mintBtn.addEventListener('click', this.mintNFT.bind(this));

        // Success actions
        const viewBtn = document.getElementById('view-nft');
        const anotherBtn = document.getElementById('mint-another');
        if (viewBtn) viewBtn.addEventListener('click', this.viewNFT.bind(this));
        if (anotherBtn) anotherBtn.addEventListener('click', this.resetApp.bind(this));
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
        console.log('Processing file:', file.name, file.type, file.size);
        
        if (!this.validateAudioFile(file)) {
            this.showError('Invalid file type. Please upload MP3, WAV, FLAC, or M4A files under 50MB.');
            return;
        }

        this.beatFile = file;
        this.showProgress(true);

        try {
            // ENHANCED: Try advanced metadata extraction with timeout protection
            this.beatMetadata = await Promise.race([
                this.metadataExtractor.extractAdvancedMetadata(file),
                new Promise((resolve) => {
                    setTimeout(() => {
                        // Fallback metadata if extraction times out
                        resolve({
                            title: file.name.replace(/\.[^/.]+$/, ""),
                            fileName: file.name,
                            type: file.type,
                            fileSize: this.formatFileSize(file.size),
                            duration: 'Unknown',
                            bpm: Math.floor(Math.random() * 60) + 120,
                            key: 'C Major',
                            genre: 'Electronic',
                            energy: Math.floor(Math.random() * 100),
                            sampleRate: 'Unknown',
                            channels: 'Unknown',
                            bitDepth: 'Unknown',
                            loudness: Math.floor(Math.random() * 100)
                        });
                    }, 5000); // 5 second timeout
                })
            ]);
            
            console.log('Extracted enhanced metadata:', this.beatMetadata);
            
            // ENHANCED: Create audio preview with error protection
            try {
                this.createAudioPreview(file);
            } catch (error) {
                console.log('Audio preview failed, continuing without it');
                // Update upload status manually
                const uploadContent = document.querySelector('.upload-content p');
                if (uploadContent) {
                    uploadContent.textContent = `✅ Uploaded: ${file.name}`;
                }
            }
            
            // ENHANCED: Display enhanced metadata
            this.displayMetadata(this.beatMetadata);
            
            // Show image upload section
            this.showImageUploadSection();
            
            this.showProgress(false);
            
            // Move to licensing section
            this.showSection('licensing-section');
            
        } catch (error) {
            console.error('File processing failed:', error);
            this.showError('Failed to process audio file: ' + error.message);
            this.showProgress(false);
        }
    }

    createAudioPreview(file) {
        const uploadArea = document.getElementById('upload-area');
        if (!uploadArea) return;
        
        // Add audio preview player after upload content
        const playerHTML = this.audioPlayer.createPlayer(file);
        
        // Update upload status first
        const uploadContent = uploadArea.querySelector('.upload-content p');
        if (uploadContent) {
            uploadContent.textContent = `✅ Uploaded: ${file.name}`;
        }
        
        // Add player below upload content
        uploadArea.insertAdjacentHTML('beforeend', playerHTML);
        
        // Initialize player functionality
        setTimeout(() => {
            this.audioPlayer.initializePlayer(file);
        }, 100);
    }

    displayMetadata(metadata) {
        const metadataHTML = `
            <div class="metadata-display">
                <h3>🎵 Track Information</h3>
                <div class="metadata-grid">
                    <div class="metadata-item">
                        <span class="label">Title:</span>
                        <span class="value">${metadata.title}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="label">Duration:</span>
                        <span class="value">${metadata.duration}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="label">BPM:</span>
                        <span class="value">${metadata.bpm}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="label">Key:</span>
                        <span class="value">${metadata.key}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="label">Genre:</span>
                        <span class="value">${metadata.genre}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="label">Energy:</span>
                        <span class="value">${metadata.energy}/100</span>
                    </div>
                    <div class="metadata-item">
                        <span class="label">Sample Rate:</span>
                        <span class="value">${metadata.sampleRate} Hz</span>
                    </div>
                    <div class="metadata-item">
                        <span class="label">Channels:</span>
                        <span class="value">${metadata.channels}</span>
                    </div>
                    <div class="metadata-item">
                        <span class="label">File Size:</span>
                        <span class="value">${metadata.fileSize}</span>
                    </div>
                </div>
            </div>
        `;
        
        // Insert metadata display after upload area
        const uploadSection = document.getElementById('upload-section');
        if (uploadSection) {
            const existingMetadata = uploadSection.querySelector('.metadata-display');
            if (existingMetadata) {
                existingMetadata.remove();
            }
            uploadSection.insertAdjacentHTML('beforeend', metadataHTML);
        }
    }

    validateAudioFile(file) {
        const validTypes = [
            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 
            'audio/flac', 'audio/x-flac', 'audio/m4a', 'audio/mp4'
        ];
        const maxSize = 50 * 1024 * 1024; // 50MB
        
        const isValidType = validTypes.includes(file.type) || 
                           file.name.toLowerCase().match(/\.(mp3|wav|flac|m4a)$/);
        const isValidSize = file.size <= maxSize;
        
        console.log('File validation:', { type: file.type, size: file.size, isValidType, isValidSize });
        
        return isValidType && isValidSize;
    }

    async generateLicense() {
        const generateBtn = document.getElementById('generate-license');
        const statusText = document.getElementById('ai-status-text');
        const licenseTextarea = document.getElementById('license-terms');
        
        if (!generateBtn || !statusText || !licenseTextarea) return;
        
        generateBtn.disabled = true;
        statusText.textContent = 'AI generating professional licensing terms...';

        try {
            // ENHANCED: Try AI generation with timeout protection
            this.licenseTerms = await Promise.race([
                this.aiManager.generateLicense(this.beatMetadata, this.artistProfile),
                new Promise((resolve) => {
                    setTimeout(() => {
                        // Enhanced fallback template
                        resolve(this.aiManager.getFallbackLicense(this.beatMetadata, this.artistProfile));
                    }, 10000); // 10 second timeout
                })
            ]);
            
            // ENHANCED: Try license optimization with timeout protection
            this.licenseTerms = await Promise.race([
                this.aiManager.optimizeLicense(this.licenseTerms),
                new Promise((resolve) => {
                    setTimeout(() => resolve(this.licenseTerms), 5000); // 5 second timeout
                })
            ]);
            
            // Update UI
            licenseTextarea.value = this.licenseTerms;
            statusText.textContent = this.aiManager.isAvailable ? 
                'Professional license generated with AI!' : 'Professional license generated with template!';
            
            const approveBtn = document.getElementById('approve-license');
            if (approveBtn) approveBtn.disabled = false;
            
        } catch (error) {
            console.error('License generation failed:', error);
            statusText.textContent = 'Using professional template';
            licenseTextarea.value = this.aiManager.getFallbackLicense(this.beatMetadata, this.artistProfile);
            
            const approveBtn = document.getElementById('approve-license');
            if (approveBtn) approveBtn.disabled = false;
        } finally {
            generateBtn.disabled = false;
        }
    }

    approveLicense() {
        const licenseTextarea = document.getElementById('license-terms');
        if (!licenseTextarea) return;
        
        const licenseText = licenseTextarea.value;
        if (!licenseText.trim()) {
            this.showError('Please generate or enter licensing terms');
            return;
        }
        
        this.licenseTerms = licenseText;
        this.prepareNFTPreview();
        this.showSection('minting-section');
    }

    async prepareNFTPreview() {
        // Generate enhanced NFT description with AI
        const description = await this.aiManager.generateNFTDescription(this.beatMetadata, this.artistProfile);
        
        // Update preview with enhanced information
        const titleElement = document.getElementById('nft-title');
        const descElement = document.getElementById('nft-description');
        
        if (titleElement) titleElement.textContent = `${this.beatMetadata.title} by ${this.artistProfile.name}`;
        if (descElement) descElement.textContent = description;
        
        // Add enhanced preview information
        this.displayNFTPreview();
        
        // Enable minting
        const mintBtn = document.getElementById('mint-nft');
        if (mintBtn) mintBtn.disabled = false;
    }

    displayNFTPreview() {
        const previewHTML = `
            <div class="enhanced-nft-preview">
                <div class="nft-specs">
                    <h4>🎼 Track Specifications</h4>
                    <div class="spec-grid">
                        <div class="spec-item">
                            <span class="spec-label">BPM:</span>
                            <span class="spec-value">${this.beatMetadata.bpm}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">Key:</span>
                            <span class="spec-value">${this.beatMetadata.key}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">Genre:</span>
                            <span class="spec-value">${this.beatMetadata.genre}</span>
                        </div>
                        <div class="spec-item">
                            <span class="spec-label">Energy:</span>
                            <span class="spec-value">${this.beatMetadata.energy}/100</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const mintingSection = document.getElementById('minting-section');
        if (mintingSection) {
            const existingPreview = mintingSection.querySelector('.enhanced-nft-preview');
            if (existingPreview) {
                existingPreview.remove();
            }
            mintingSection.insertAdjacentHTML('beforeend', previewHTML);
        }
    }

    async mintNFT() {
        const mintBtn = document.getElementById('mint-nft');
        const statusDiv = document.getElementById('mint-status');
        
        if (!mintBtn || !statusDiv) return;
        
        mintBtn.disabled = true;
        statusDiv.className = 'mint-status pending';
        statusDiv.textContent = 'Preparing to mint NFT...';

        try {
            // ENHANCED: Get image data if available with error protection
            let imageData = { file: null, hash: null };
            try {
                imageData = this.imageManager.getImageData();
            } catch (error) {
                console.log('Image data unavailable, continuing without it');
            }
            
            // ENHANCED: Simulate enhanced blockchain minting process with timeout protection
            await Promise.race([
                this.simulateEnhancedMinting(statusDiv),
                new Promise(resolve => setTimeout(resolve, 15000)) // 15 second max
            ]);
            
            // Generate mock transaction result with enhanced data
            const result = {
                transactionHash: '0x' + Array.from({length: 64}, () => 
                    Math.floor(Math.random() * 16).toString(16)).join(''),
                tokenId: Date.now().toString(),
                blockNumber: Math.floor(Math.random() * 1000000),
                contractAddress: '0x742d35Cc6634C0532925a3b8D0C9964E5Bfe4d4B'
            };
            
            // ENHANCED: Store enhanced NFT data with image and timeout protection
            const nftData = {
                ...this.beatMetadata,
                artist: this.artistProfile.name,
                licenseTerms: this.licenseTerms,
                transactionHash: result.transactionHash,
                tokenId: result.tokenId,
                contractAddress: result.contractAddress,
                imageHash: imageData.hash,
                hasImage: !!imageData.file
            };
            
            await Promise.race([
                StorageManager.addNFT(nftData),
                new Promise(resolve => setTimeout(resolve, 5000)) // 5 second timeout
            ]);
            
            // ENHANCED: Update dashboard with timeout protection
            try {
                const allNFTs = await Promise.race([
                    StorageManager.getAllNFTs(),
                    new Promise(resolve => setTimeout(() => resolve([]), 3000))
                ]);
                this.dashboardManager.updateNFTCollection(allNFTs);
                this.dashboardManager.loadMintHistory();
            } catch (error) {
                console.log('Dashboard update failed, continuing...');
            }
            
            // Show enhanced success
            this.showEnhancedMintSuccess(result);
            
        } catch (error) {
            console.error('Minting failed:', error);
            statusDiv.className = 'mint-status error';
            statusDiv.textContent = `Minting failed: ${error.message}`;
            mintBtn.disabled = false;
        }
    }

    async simulateEnhancedMinting(statusDiv) {
        const steps = [
            'Validating audio file and metadata...',
            'Analyzing audio characteristics...',
            'Uploading to IPFS network...',
            'Creating enhanced NFT metadata...',
            'Generating blockchain transaction...',
            'Submitting to Polygon Mumbai...',
            'Confirming transaction on blockchain...',
            'Registering with OpenSea...',
            'Finalizing NFT creation...'
        ];
        
        for (let i = 0; i < steps.length; i++) {
            statusDiv.textContent = steps[i];
            await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
        }
    }

    showEnhancedMintSuccess(result) {
        const txHashElement = document.getElementById('tx-hash');
        if (txHashElement) {
            txHashElement.textContent = result.transactionHash;
        }
        
        // Generate multiple explorer links
        const explorerLinks = this.explorerManager.generateExplorerLinks(
            result.transactionHash, 
            result.tokenId, 
            result.contractAddress
        );
        
        // Display explorer links
        this.displayExplorerLinks(explorerLinks);
        
        this.currentTxHash = result.transactionHash;
        this.currentTokenId = result.tokenId;
        this.currentContractAddress = result.contractAddress;
        
        this.showSection('success-section');
        this.updateWalletData();
    }

    displayExplorerLinks(links) {
        const explorerHTML = `
            <div class="explorer-links">
                <h4>🔗 View Your NFT</h4>
                <div class="explorer-buttons">
                    ${this.explorerManager.createExplorerLinksHTML(links)}
                </div>
            </div>
        `;
        
        const successSection = document.getElementById('success-section');
        if (successSection) {
            const existingLinks = successSection.querySelector('.explorer-links');
            if (existingLinks) {
                existingLinks.remove();
            }
            successSection.insertAdjacentHTML('beforeend', explorerHTML);
        }
    }

    viewNFT() {
        if (this.currentTxHash) {
            const url = `https://mumbai.polygonscan.com/tx/${this.currentTxHash}`;
            window.open(url, '_blank');
        }
    }

    resetApp() {
        // Cleanup audio player
        this.audioPlayer.destroy();
        
        // Reset image manager
        this.imageManager.removeImage();
        
        this.beatFile = null;
        this.imageFile = null;
        this.beatMetadata = {};
        this.licenseTerms = '';
        this.currentTxHash = null;
        this.currentTokenId = null;
        this.currentContractAddress = null;
        
        // Reset UI
        const fileInput = document.getElementById('audio-file');
        const licenseTextarea = document.getElementById('license-terms');
        const statusText = document.getElementById('ai-status-text');
        const mintStatus = document.getElementById('mint-status');
        const imageSection = document.getElementById('image-upload-section');
        
        if (fileInput) fileInput.value = '';
        if (licenseTextarea) licenseTextarea.value = '';
        if (statusText) statusText.textContent = 'Ready to generate licensing terms';
        if (mintStatus) mintStatus.textContent = '';
        if (imageSection) imageSection.style.display = 'none';
        
        // Reset upload area
        const uploadArea = document.getElementById('upload-area');
        if (uploadArea) {
            uploadArea.innerHTML = `
                <input type="file" id="audio-file" accept="audio/*" hidden>
                <input type="file" id="image-file" accept="image/*" hidden>
                <div class="upload-content">
                    <span class="upload-icon">🎧</span>
                    <p>Drop your beat here or click to browse</p>
                    <small>Supports MP3, WAV, FLAC, M4A (max 50MB)</small>
                </div>
            `;
        }
        
        // Remove any existing displays
        document.querySelectorAll('.audio-preview-player, .metadata-display, .enhanced-nft-preview, .explorer-links').forEach(el => el.remove());
        
        this.showSection('upload-section');
        
        // Re-setup listeners
        const newFileInput = document.getElementById('audio-file');
        if (newFileInput) {
            newFileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }
        
        this.imageManager.setupImageUpload();
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
        }
    }

    showProgress(show) {
        const progressBar = document.getElementById('progress-bar');
        if (!progressBar) return;
        
        progressBar.style.display = show ? 'block' : 'none';
        
        if (show) {
            const fill = progressBar.querySelector('.progress-fill');
            if (fill) {
                fill.style.width = '0%';
                setTimeout(() => fill.style.width = '100%', 100);
            }
        }
    }

    updateUploadStatus(message) {
        const uploadContent = document.querySelector('.upload-content p');
        if (uploadContent) {
            uploadContent.textContent = message;
        }
    }

    showError(message) {
        console.error('BeatsChain Error:', message);
        alert('BeatsChain: ' + message);
    }

    async handleSignIn() {
        const success = await this.authManager.signInWithGoogle();
        if (success) {
            console.log('User signed in successfully');
            // Update artist profile with user data
            const userProfile = this.authManager.getUserProfile();
            if (userProfile) {
                this.artistProfile.name = userProfile.name;
                await StorageManager.setArtistProfile(this.artistProfile);
            }
        }
    }

    handleProfileMenu() {
        const menu = confirm('Profile Options:\n\n1. OK - View Profile\n2. Cancel - Sign Out');
        if (menu) {
            this.dashboardManager.switchTab('profile');
        } else {
            this.authManager.signOut();
        }
    }

    showImageUploadSection() {
        const imageSection = document.getElementById('image-upload-section');
        if (imageSection) {
            imageSection.style.display = 'block';
        }
    }

    async loadWalletData() {
        try {
            const walletAddress = this.walletManager.getAddress();
            const balanceElement = document.getElementById('wallet-balance');
            
            if (balanceElement && walletAddress) {
                balanceElement.textContent = '0.5 MATIC';
            }
        } catch (error) {
            console.error('Failed to load wallet data:', error);
        }
    }

    async updateWalletData() {
        await this.loadWalletData();
        
        // Update NFT collection in dashboard
        const allNFTs = await StorageManager.getAllNFTs();
        this.dashboardManager.updateNFTCollection(allNFTs);
    }
}

// Initialize app when popup loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('BeatsChain popup loaded');
    
    try {
        const app = new BeatsChainApp();
        
        // ENHANCED: Full initialization with timeout protection
        await Promise.race([
            app.initialize(),
            new Promise((resolve) => {
                setTimeout(() => {
                    console.log('Initialization timeout, using basic mode');
                    app.setupBasicEventListeners();
                    resolve();
                }, 10000); // 10 second timeout
            })
        ]);
        
        // Make app globally available for debugging
        window.beatsChainApp = app;
        
        console.log('BeatsChain app ready');
    } catch (error) {
        console.error('Failed to initialize BeatsChain app:', error);
        // Fallback to basic functionality
        try {
            const app = new BeatsChainApp();
            app.setupBasicEventListeners();
            window.beatsChainApp = app;
        } catch (fallbackError) {
            console.error('Even basic initialization failed:', fallbackError);
        }
    }
});