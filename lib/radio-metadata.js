/**
 * Radio Metadata Manager
 * Separates track metadata from split sheets with comprehensive user inputs
 */

class RadioMetadataManager {
    constructor() {
        this.trackMetadata = {};
        this.initialized = false;
    }

    initializeForm() {
        if (this.initialized) return;
        
        const radioSection = document.getElementById('radio-section');
        if (!radioSection) return;

        // Create comprehensive metadata form
        const metadataForm = this.createMetadataForm();
        
        // Insert before split sheets section
        const splitSheetsSection = document.getElementById('split-sheets');
        if (splitSheetsSection) {
            splitSheetsSection.parentNode.insertBefore(metadataForm, splitSheetsSection);
        }

        this.setupEventListeners();
        this.initialized = true;
    }

    createMetadataForm() {
        const form = document.createElement('div');
        form.id = 'radio-metadata-form';
        form.className = 'radio-metadata-form';
        form.style.display = 'none'; // Hidden until audio uploaded

        form.innerHTML = `
            <h4>🎵 Track Information</h4>
            <div class="metadata-grid">
                <div class="form-row">
                    <label for="radio-track-title">Track Title *</label>
                    <input type="text" id="radio-track-title" class="form-input" 
                           placeholder="Enter track title" maxlength="100" required>
                </div>
                
                <div class="form-row">
                    <label for="radio-artist-name">Primary Artist Name *</label>
                    <input type="text" id="radio-artist-name" class="form-input" 
                           placeholder="Legal/Real name for SAMRO" maxlength="50" required>
                </div>
                
                <div class="form-row">
                    <label for="radio-stage-name">Stage/Performance Name</label>
                    <input type="text" id="radio-stage-name" class="form-input" 
                           placeholder="Stage name (if different)" maxlength="50">
                </div>
                
                <div class="form-row">
                    <label for="radio-genre-select">Genre *</label>
                    <select id="radio-genre-select" class="form-input" required>
                        <option value="">Select Genre</option>
                        <option value="Afrobeats">Afrobeats</option>
                        <option value="Amapiano">Amapiano</option>
                        <option value="Hip-Hop">Hip-Hop</option>
                        <option value="House">House</option>
                        <option value="Kwaito">Kwaito</option>
                        <option value="Gospel">Gospel</option>
                        <option value="Jazz">Jazz</option>
                        <option value="Rock">Rock</option>
                        <option value="Pop">Pop</option>
                        <option value="Electronic">Electronic</option>
                        <option value="Traditional">Traditional</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                
                <div class="form-row">
                    <label for="radio-language">Language</label>
                    <select id="radio-language" class="form-input">
                        <option value="English">English</option>
                        <option value="Afrikaans">Afrikaans</option>
                        <option value="Zulu">Zulu</option>
                        <option value="Xhosa">Xhosa</option>
                        <option value="Sotho">Sotho</option>
                        <option value="Tswana">Tswana</option>
                        <option value="Venda">Venda</option>
                        <option value="Tsonga">Tsonga</option>
                        <option value="Ndebele">Ndebele</option>
                        <option value="Swati">Swati</option>
                        <option value="Pedi">Pedi</option>
                        <option value="Mixed">Mixed Languages</option>
                        <option value="Instrumental">Instrumental</option>
                    </select>
                </div>
                
                <div class="form-row">
                    <label for="radio-record-label">Record Label</label>
                    <input type="text" id="radio-record-label" class="form-input" 
                           placeholder="Independent or label name" maxlength="50">
                </div>
                
                <div class="form-row">
                    <label for="radio-isrc">ISRC Code</label>
                    <input type="text" id="radio-isrc" class="form-input" 
                           placeholder="ZA-XXX-XX-XXXXX (if available)" maxlength="15">
                </div>
                
                <div class="form-row">
                    <label for="radio-explicit">Content Rating</label>
                    <select id="radio-explicit" class="form-input">
                        <option value="clean">Clean</option>
                        <option value="explicit">Explicit</option>
                        <option value="edited">Edited Version</option>
                    </select>
                </div>
            </div>
            
            <div class="validation-status" id="metadata-validation">
                <span class="validation-icon">⚠️</span>
                <span class="validation-text">Please complete required fields</span>
            </div>
        `;

        return form;
    }

    setupEventListeners() {
        // Validate on input change
        const requiredFields = ['radio-track-title', 'radio-artist-name', 'radio-genre-select'];
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', () => this.validateMetadata());
                field.addEventListener('blur', () => this.validateMetadata());
            }
        });

        // Auto-populate from audio metadata if available
        document.addEventListener('audioMetadataExtracted', (event) => {
            this.populateFromAudioMetadata(event.detail);
        });
    }

    populateFromAudioMetadata(audioMetadata) {
        // Auto-populate title if not already filled
        const titleField = document.getElementById('radio-track-title');
        if (titleField && !titleField.value && audioMetadata.title) {
            titleField.value = this.sanitizeInput(audioMetadata.title);
        }

        // Show the form when audio is uploaded
        const form = document.getElementById('radio-metadata-form');
        if (form) {
            form.style.display = 'block';
        }
    }

    validateMetadata() {
        const validation = {
            isValid: true,
            errors: []
        };

        // Required field validation
        const title = this.getFieldValue('radio-track-title');
        const artist = this.getFieldValue('radio-artist-name');
        const genre = this.getFieldValue('radio-genre-select');

        if (!title || title.length < 2) {
            validation.isValid = false;
            validation.errors.push('Track title is required (min 2 characters)');
        }

        if (!artist || artist.length < 2) {
            validation.isValid = false;
            validation.errors.push('Artist name is required (min 2 characters)');
        }

        if (!genre) {
            validation.isValid = false;
            validation.errors.push('Genre selection is required');
        }

        // ISRC format validation
        const isrc = this.getFieldValue('radio-isrc');
        if (isrc && !this.validateISRC(isrc)) {
            validation.isValid = false;
            validation.errors.push('ISRC format should be: ZA-XXX-XX-XXXXX');
        }

        this.updateValidationUI(validation);
        return validation;
    }

    validateISRC(isrc) {
        // South African ISRC format: ZA-XXX-XX-XXXXX
        const isrcPattern = /^ZA-[A-Z0-9]{3}-\d{2}-\d{5}$/i;
        return isrcPattern.test(isrc.replace(/\s/g, ''));
    }

    updateValidationUI(validation) {
        const validationDiv = document.getElementById('metadata-validation');
        if (!validationDiv) return;

        const icon = validationDiv.querySelector('.validation-icon');
        const text = validationDiv.querySelector('.validation-text');

        if (validation.isValid) {
            icon.textContent = '✅';
            text.textContent = 'Track metadata complete';
            validationDiv.className = 'validation-status valid';
        } else {
            icon.textContent = '⚠️';
            text.textContent = validation.errors[0] || 'Please complete required fields';
            validationDiv.className = 'validation-status invalid';
        }

        // Enable/disable package generation
        const generateBtn = document.getElementById('generate-radio-package');
        if (generateBtn) {
            generateBtn.disabled = !validation.isValid;
        }
    }

    getFieldValue(fieldId) {
        const field = document.getElementById(fieldId);
        return field ? this.sanitizeInput(field.value) : '';
    }

    sanitizeInput(input) {
        if (!input) return '';
        return String(input)
            .replace(/[<>"'&]/g, (match) => {
                const map = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
                return map[match];
            })
            .trim()
            .substring(0, 200);
    }

    getTrackMetadata() {
        return {
            title: this.getFieldValue('radio-track-title'),
            artistName: this.getFieldValue('radio-artist-name'),
            stageName: this.getFieldValue('radio-stage-name'),
            genre: this.getFieldValue('radio-genre-select'),
            language: this.getFieldValue('radio-language') || 'English',
            recordLabel: this.getFieldValue('radio-record-label') || 'Independent',
            isrc: this.getFieldValue('radio-isrc'),
            contentRating: this.getFieldValue('radio-explicit') || 'clean',
            submissionDate: new Date().toISOString(),
            submissionType: 'radio_submission'
        };
    }

    isValid() {
        return this.validateMetadata().isValid;
    }

    showForm() {
        const form = document.getElementById('radio-metadata-form');
        if (form) {
            form.style.display = 'block';
        }
    }

    hideForm() {
        const form = document.getElementById('radio-metadata-form');
        if (form) {
            form.style.display = 'none';
        }
    }

    reset() {
        const form = document.getElementById('radio-metadata-form');
        if (form) {
            const inputs = form.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.value = '';
            });
            this.hideForm();
        }
    }
}

window.RadioMetadataManager = RadioMetadataManager;