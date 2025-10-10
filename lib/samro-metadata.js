/**
 * SAMRO Metadata Manager - Enhanced South African Music Rights Organisation Compliance
 * Handles comprehensive metadata standards for radio submission and rights management
 */

class SamroMetadataManager {
    constructor() {
        this.metadata = {};
        this.initialized = false;
        this.userInputManager = new UserInputManager();
    }

    initialize() {
        if (this.initialized) return;
        
        this.setupSamroFields();
        this.initialized = true;
    }

    setupSamroFields() {
        // Add enhanced SAMRO fields to radio step 2
        const trackInfoForm = document.querySelector('#radio-step-2 .track-info-form .form-grid');
        if (!trackInfoForm) return;

        // Create collapsible SAMRO section
        const samroSection = document.createElement('div');
        samroSection.className = 'samro-enhanced-section';
        samroSection.innerHTML = `
            <div class="samro-header">
                <h5>🏛️ SAMRO Compliance Fields</h5>
                <button type="button" class="collapse-btn" id="samro-fields-toggle">▼</button>
            </div>
            <div class="samro-content" id="samro-fields-content">
                <div class="form-row">
                    <label for="samro-composer-name">Composer Name *</label>
                    <input type="text" id="samro-composer-name" class="form-input" placeholder="Legal name of composer" required>
                    <small class="field-help">Person who created the musical composition</small>
                </div>
                
                <div class="form-row">
                    <label for="samro-composer-number">Composer SAMRO Number</label>
                    <input type="text" id="samro-composer-number" class="form-input" placeholder="SAMRO member number">
                </div>
                
                <div class="form-row">
                    <label for="samro-publisher">Publisher</label>
                    <input type="text" id="samro-publisher" class="form-input" placeholder="Publishing company name">
                    <small class="field-help">Company that owns publishing rights</small>
                </div>
                
                <div class="form-row">
                    <label for="samro-iswc">ISWC Code</label>
                    <input type="text" id="samro-iswc" class="form-input" placeholder="T-123456789-C" pattern="T-[0-9]{9}-[0-9]">
                    <small class="field-help">International Standard Work Code for the composition</small>
                </div>
                
                <div class="form-row">
                    <label for="samro-work-type">Work Type *</label>
                    <select id="samro-work-type" class="form-input" required>
                        <option value="">Select Work Type</option>
                        <option value="original">Original Composition</option>
                        <option value="arrangement">Arrangement</option>
                        <option value="adaptation">Adaptation</option>
                        <option value="translation">Translation</option>
                    </select>
                </div>
                
                <div class="form-row">
                    <label for="samro-territory">Territory Rights</label>
                    <select id="samro-territory" class="form-input">
                        <option value="south-africa">South Africa</option>
                        <option value="africa">Africa</option>
                        <option value="worldwide">Worldwide</option>
                    </select>
                </div>
                
                <div class="form-row">
                    <label for="samro-performance-share">Performance Rights Share (%)</label>
                    <input type="number" id="samro-performance-share" class="form-input" min="0" max="100" value="50">
                    <small class="field-help">Percentage of performance royalties</small>
                </div>
                
                <div class="form-row">
                    <label for="samro-mechanical-share">Mechanical Rights Share (%)</label>
                    <input type="number" id="samro-mechanical-share" class="form-input" min="0" max="100" value="50">
                    <small class="field-help">Percentage of mechanical royalties</small>
                </div>
            </div>
        `;

        trackInfoForm.appendChild(samroSection);
        this.setupCollapsibleSection();
        this.setupValidation();
    }

    setupCollapsibleSection() {
        const toggleBtn = document.getElementById('samro-fields-toggle');
        const content = document.getElementById('samro-fields-content');
        
        if (toggleBtn && content) {
            toggleBtn.addEventListener('click', () => {
                const isCollapsed = content.classList.contains('collapsed');
                
                if (isCollapsed) {
                    content.classList.remove('collapsed');
                    toggleBtn.textContent = '▼';
                } else {
                    content.classList.add('collapsed');
                    toggleBtn.textContent = '▶';
                }
            });
        }
    }

    setupValidation() {
        // Track user inputs for SAMRO fields
        const samroFields = {
            'samro-composer-name': 'samro-composer',
            'samro-composer-number': 'samro-composer-number',
            'samro-publisher': 'samro-publisher',
            'samro-iswc': 'samro-iswc',
            'samro-work-type': 'samro-work-type',
            'samro-territory': 'samro-territory',
            'samro-performance-share': 'samro-performance-share',
            'samro-mechanical-share': 'samro-mechanical-share'
        };

        Object.entries(samroFields).forEach(([fieldId, key]) => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', (e) => {
                    if (e.target.value && e.target.value.trim()) {
                        this.userInputManager.setUserInput(key, e.target.value, true);
                    }
                    this.validateSamroFields();
                });
            }
        });
    }

    validateSamroFields() {
        const validation = {
            isValid: true,
            errors: []
        };

        // Required field validation
        const composerName = document.getElementById('samro-composer-name')?.value?.trim();
        const workType = document.getElementById('samro-work-type')?.value;

        if (!composerName || composerName.length < 2) {
            validation.isValid = false;
            validation.errors.push('Composer name is required for SAMRO compliance');
        }

        if (!workType) {
            validation.isValid = false;
            validation.errors.push('Work type is required for SAMRO registration');
        }

        // ISWC format validation
        const iswc = document.getElementById('samro-iswc')?.value?.trim();
        if (iswc && !this.validateISWC(iswc)) {
            validation.isValid = false;
            validation.errors.push('ISWC format should be: T-123456789-C');
        }

        // Percentage validation
        const perfShare = parseFloat(document.getElementById('samro-performance-share')?.value) || 0;
        const mechShare = parseFloat(document.getElementById('samro-mechanical-share')?.value) || 0;

        if (perfShare < 0 || perfShare > 100) {
            validation.isValid = false;
            validation.errors.push('Performance rights share must be between 0-100%');
        }

        if (mechShare < 0 || mechShare > 100) {
            validation.isValid = false;
            validation.errors.push('Mechanical rights share must be between 0-100%');
        }

        return validation;
    }

    validateISWC(iswc) {
        // ISWC format: T-123456789-C (T-9digits-checkdigit)
        const iswcPattern = /^T-\d{9}-\d$/;
        return iswcPattern.test(iswc);
    }

    getSamroMetadata() {
        return {
            composer: {
                name: this.userInputManager.getValue('samro-composer', document.getElementById('samro-composer-name')?.value, ''),
                samroNumber: this.userInputManager.getValue('samro-composer-number', document.getElementById('samro-composer-number')?.value, ''),
                performanceShare: parseFloat(document.getElementById('samro-performance-share')?.value) || 50,
                mechanicalShare: parseFloat(document.getElementById('samro-mechanical-share')?.value) || 50
            },
            publisher: {
                name: this.userInputManager.getValue('samro-publisher', document.getElementById('samro-publisher')?.value, 'Independent'),
                territory: document.getElementById('samro-territory')?.value || 'south-africa'
            },
            work: {
                iswc: this.userInputManager.getValue('samro-iswc', document.getElementById('samro-iswc')?.value, ''),
                type: this.userInputManager.getValue('samro-work-type', document.getElementById('samro-work-type')?.value, 'original'),
                territory: document.getElementById('samro-territory')?.value || 'south-africa'
            },
            rights: {
                performanceRights: {
                    owner: 'Composer',
                    percentage: parseFloat(document.getElementById('samro-performance-share')?.value) || 50,
                    territory: document.getElementById('samro-territory')?.value || 'south-africa'
                },
                mechanicalRights: {
                    owner: 'Composer',
                    percentage: parseFloat(document.getElementById('samro-mechanical-share')?.value) || 50,
                    territory: document.getElementById('samro-territory')?.value || 'south-africa'
                }
            },
            compliance: {
                samroReady: this.validateSamroFields().isValid,
                generatedAt: new Date().toISOString(),
                version: '1.0'
            }
        };
    }

    generateSamroReport(trackMetadata) {
        const samroData = this.getSamroMetadata();
        
        return `SAMRO COMPLIANCE REPORT
Generated: ${new Date().toLocaleString()}

WORK IDENTIFICATION
Title: ${trackMetadata.title}
Composer: ${samroData.composer.name}
ISWC: ${samroData.work.iswc || 'Not assigned'}
Work Type: ${samroData.work.type}

RIGHTS ALLOCATION
Performance Rights: ${samroData.rights.performanceRights.percentage}% - ${samroData.rights.performanceRights.owner}
Mechanical Rights: ${samroData.rights.mechanicalRights.percentage}% - ${samroData.rights.mechanicalRights.owner}
Territory: ${samroData.work.territory}

PUBLISHER INFORMATION
Publisher: ${samroData.publisher.name}
Territory: ${samroData.publisher.territory}

RECORDING DETAILS
Artist: ${trackMetadata.artist}
Duration: ${trackMetadata.duration}
Genre: ${trackMetadata.genre}
Language: ${trackMetadata.language}
ISRC: ${trackMetadata.isrc || 'Not assigned'}

COMPLIANCE STATUS
SAMRO Ready: ${samroData.compliance.samroReady ? 'YES' : 'NO - Missing required fields'}
Generated by: BeatsChain Extension v${chrome.runtime.getManifest().version}
`;
    }

    isValid() {
        return this.validateSamroFields().isValid;
    }

    reset() {
        // Reset all SAMRO fields
        const fields = [
            'samro-composer-name', 'samro-composer-number', 'samro-publisher',
            'samro-iswc', 'samro-work-type', 'samro-territory',
            'samro-performance-share', 'samro-mechanical-share'
        ];

        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                if (field.type === 'number') {
                    field.value = fieldId.includes('share') ? '50' : '';
                } else if (field.tagName === 'SELECT') {
                    field.selectedIndex = 0;
                } else {
                    field.value = '';
                }
            }
        });
    }
}

window.SamroMetadataManager = SamroMetadataManager;