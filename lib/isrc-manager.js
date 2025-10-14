/**
 * ISRC Manager - Professional ISRC Generation and Management
 * Registrant Code: 80G (Record Label Rights Confirmed)
 * Format: ZA-80G-YY-NNNNN (South African Territory)
 */

class ISRCManager {
    constructor() {
        this.registrantCode = '80G';
        this.territory = 'ZA';
        this.currentYear = new Date().getFullYear().toString().slice(-2);
        this.userInputManager = new UserInputManager();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        await this.loadISRCRegistry();
        this.setupEventListeners();
        this.initialized = true;
    }

    async loadISRCRegistry() {
        try {
            const result = await chrome.storage.local.get(['isrcRegistry']);
            this.registry = result.isrcRegistry || {
                lastDesignation: 200,
                codes: {},
                year: this.currentYear
            };
            
            // Reset designation if year changed
            if (this.registry.year !== this.currentYear) {
                this.registry.lastDesignation = 200;
                this.registry.year = this.currentYear;
                await this.saveRegistry();
            }
        } catch (error) {
            console.warn('ISRC Registry load failed:', error);
            this.registry = {
                lastDesignation: 200,
                codes: {},
                year: this.currentYear
            };
        }
    }

    async saveRegistry() {
        try {
            await chrome.storage.local.set({ isrcRegistry: this.registry });
        } catch (error) {
            console.error('ISRC Registry save failed:', error);
        }
    }

    generateISRC(trackTitle = '', artistName = '') {
        const designation = this.getNextDesignation();
        const isrc = `${this.territory}-${this.registrantCode}-${this.currentYear}-${designation}`;
        
        // Store in registry
        this.registry.codes[isrc] = {
            trackTitle: this.sanitizeInput(trackTitle),
            artistName: this.sanitizeInput(artistName),
            generated: new Date().toISOString(),
            used: false
        };
        
        this.saveRegistry();
        return isrc;
    }

    getNextDesignation() {
        this.registry.lastDesignation += 1;
        return this.registry.lastDesignation.toString().padStart(5, '0');
    }

    validateISRC(isrc) {
        if (!isrc || typeof isrc !== 'string') return false;
        
        // ZA-80G-YY-NNNNN format
        const pattern = /^ZA-80G-\d{2}-\d{5}$/;
        return pattern.test(isrc.replace(/\s/g, ''));
    }

    markISRCAsUsed(isrc, context = {}) {
        if (this.registry.codes[isrc]) {
            this.registry.codes[isrc].used = true;
            this.registry.codes[isrc].usedAt = new Date().toISOString();
            this.registry.codes[isrc].context = context;
            this.saveRegistry();
        }
    }

    setupEventListeners() {
        // Add ISRC generation button to radio form
        this.enhanceRadioForm();
        
        // Listen for ISRC field changes
        document.addEventListener('change', (e) => {
            if (e.target.id === 'radio-isrc') {
                const isrc = e.target.value.trim();
                if (isrc) {
                    this.userInputManager.setUserInput('radio-isrc', isrc, true);
                    this.validateISRCField(e.target);
                }
            }
        });
    }

    enhanceRadioForm() {
        const isrcField = document.getElementById('radio-isrc');
        if (!isrcField) return;

        // Connect to existing button instead of creating new one
        const existingBtn = document.getElementById('generate-isrc-btn');
        if (existingBtn) {
            existingBtn.addEventListener('click', () => {
                this.handleISRCGeneration();
            });
        }

        // Add validation indicator
        this.addValidationIndicator(isrcField);
    }

    addValidationIndicator(field) {
        const indicator = document.createElement('span');
        indicator.className = 'isrc-validation-indicator';
        indicator.style.marginLeft = '8px';
        
        const formRow = field.closest('.form-row');
        if (formRow) {
            formRow.appendChild(indicator);
        }
    }

    async handleISRCGeneration() {
        try {
            // Get track info for ISRC generation
            const trackTitle = document.getElementById('radio-track-title')?.value || '';
            const artistName = document.getElementById('radio-artist-name')?.value || '';
            
            if (!trackTitle.trim()) {
                this.showISRCMessage('Please enter track title first', 'warning');
                return;
            }

            // Generate ISRC
            const isrc = this.generateISRC(trackTitle, artistName);
            
            // Set in field
            const isrcField = document.getElementById('radio-isrc');
            if (isrcField) {
                isrcField.value = isrc;
                this.userInputManager.setUserInput('radio-isrc', isrc, true);
                this.validateISRCField(isrcField);
            }

            this.showISRCMessage(`Generated: ${isrc}`, 'success');
            
        } catch (error) {
            console.error('ISRC generation failed:', error);
            this.showISRCMessage('Generation failed. Please try again.', 'error');
        }
    }

    validateISRCField(field) {
        const isrc = field.value.trim();
        const indicator = field.closest('.form-row')?.querySelector('.isrc-validation-indicator');
        
        if (!indicator) return;

        if (!isrc) {
            indicator.innerHTML = '';
            return;
        }

        if (this.validateISRC(isrc)) {
            indicator.innerHTML = '<span style="color: #4CAF50;">✓ Valid</span>';
            field.style.borderColor = '#4CAF50';
        } else {
            indicator.innerHTML = '<span style="color: #f44336;">✗ Invalid format</span>';
            field.style.borderColor = '#f44336';
        }
    }

    showISRCMessage(message, type = 'info') {
        // Create or update message element
        let messageEl = document.querySelector('.isrc-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.className = 'isrc-message';
            
            const isrcField = document.getElementById('radio-isrc');
            const formRow = isrcField?.closest('.form-row');
            if (formRow) {
                formRow.appendChild(messageEl);
            }
        }

        const colors = {
            success: '#4CAF50',
            warning: '#FF9800',
            error: '#f44336',
            info: '#2196F3'
        };

        messageEl.style.cssText = `
            margin-top: 5px;
            padding: 5px 8px;
            border-radius: 3px;
            font-size: 12px;
            color: white;
            background-color: ${colors[type] || colors.info};
        `;
        messageEl.textContent = message;

        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.remove();
            }
        }, 3000);
    }

    getISRCForTrack(trackTitle, artistName) {
        // Check if user has manually entered ISRC
        const userISRC = this.userInputManager.getValue('radio-isrc', null, null);
        if (userISRC && this.validateISRC(userISRC)) {
            return userISRC;
        }

        // Check if we have generated ISRC for this track
        for (const [isrc, data] of Object.entries(this.registry.codes)) {
            if (data.trackTitle === trackTitle && data.artistName === artistName && !data.used) {
                return isrc;
            }
        }

        return null;
    }

    getISRCRegistry() {
        return {
            total: Object.keys(this.registry.codes).length,
            used: Object.values(this.registry.codes).filter(c => c.used).length,
            available: Object.values(this.registry.codes).filter(c => !c.used).length,
            currentYear: this.currentYear,
            lastDesignation: this.registry.lastDesignation
        };
    }

    sanitizeInput(input) {
        if (!input) return '';
        return String(input)
            .replace(/[<>"'&]/g, '')
            .trim()
            .substring(0, 100);
    }

    // Integration with existing systems
    enhanceMetadataWithISRC(metadata) {
        const isrc = this.getISRCForTrack(metadata.title, metadata.artistName);
        
        return {
            ...metadata,
            isrc: isrc || metadata.isrc || '',
            isrcGenerated: !!isrc,
            isrcRegistrant: this.registrantCode,
            isrcTerritory: this.territory,
            // Cross-system integration flags
            nftReady: true,
            radioReady: true,
            samroCompliant: !!isrc
        };
    }

    // Cross-system ISRC integration
    integrateWithNFTSystem(nftMetadata) {
        if (!nftMetadata.isrc && nftMetadata.title && nftMetadata.artist) {
            const generatedISRC = this.generateISRC(nftMetadata.title, nftMetadata.artist);
            return {
                ...nftMetadata,
                isrc: generatedISRC,
                isrcGenerated: true,
                isrcRegistrant: this.registrantCode,
                blockchainISRC: true
            };
        }
        return nftMetadata;
    }

    integrateWithRadioSystem(radioMetadata) {
        if (!radioMetadata.isrc && radioMetadata.title && radioMetadata.artistName) {
            const generatedISRC = this.generateISRC(radioMetadata.title, radioMetadata.artistName);
            return {
                ...radioMetadata,
                isrc: generatedISRC,
                isrcGenerated: true,
                isrcRegistrant: this.registrantCode,
                radioISRC: true,
                samroReady: true
            };
        }
        return radioMetadata;
    }
}

// Export for Chrome extension compatibility
window.ISRCManager = ISRCManager;