// Security Validator - File Upload & Input Security
class SecurityValidator {
    constructor() {
        this.audioMagicNumbers = {
            'mp3': [0xFF, 0xFB], // MP3 frame header
            'mp3_id3': [0x49, 0x44, 0x33], // ID3v2 header
            'wav': [0x52, 0x49, 0x46, 0x46], // RIFF header
            'flac': [0x66, 0x4C, 0x61, 0x43] // fLaC signature
        };
        
        this.imageMagicNumbers = {
            'jpeg': [0xFF, 0xD8, 0xFF],
            'png': [0x89, 0x50, 0x4E, 0x47],
            'gif': [0x47, 0x49, 0x46, 0x38],
            'webp': [0x52, 0x49, 0x46, 0x46] // RIFF for WebP
        };
    }
    
    // Comprehensive file validation with magic number checking
    async validateAudioFile(file) {
        const validation = {
            isValid: false,
            errors: [],
            warnings: [],
            securityScore: 0
        };
        
        try {
            // Basic checks
            if (!file || !file.name) {
                validation.errors.push('Invalid file object');
                return validation;
            }
            
            // File size check (50MB max)
            const maxSize = 50 * 1024 * 1024;
            if (file.size > maxSize) {
                validation.errors.push(`File too large: ${this.formatFileSize(file.size)} (max 50MB)`);
            } else if (file.size < 1024) {
                validation.errors.push('File too small (min 1KB)');
            } else {
                validation.securityScore += 20;
            }
            
            // File extension validation
            const fileName = file.name.toLowerCase();
            const validExtensions = ['.mp3', '.wav', '.flac'];
            const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
            
            if (!hasValidExtension) {
                validation.errors.push('Invalid file extension. Only MP3, WAV, FLAC allowed');
            } else {
                validation.securityScore += 20;
            }
            
            // MIME type validation
            const validMimeTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp3'];
            if (!validMimeTypes.includes(file.type)) {
                validation.errors.push(`Invalid MIME type: ${file.type}`);
            } else {
                validation.securityScore += 20;
            }
            
            // Magic number validation (file signature)
            const magicValidation = await this.validateAudioMagicNumbers(file);
            if (!magicValidation.isValid) {
                validation.errors.push('File signature validation failed - file may be corrupted or malicious');
            } else {
                validation.securityScore += 30;
            }
            
            // Filename security check
            const filenameValidation = this.validateFilename(fileName);
            if (!filenameValidation.isValid) {
                validation.errors.push(...filenameValidation.errors);
            } else {
                validation.securityScore += 10;
            }
            
            validation.isValid = validation.errors.length === 0;
            
        } catch (error) {
            validation.errors.push(`Validation error: ${error.message}`);
        }
        
        return validation;
    }
    
    // Magic number validation for audio files
    async validateAudioMagicNumbers(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    const bytes = new Uint8Array(arrayBuffer.slice(0, 12)); // First 12 bytes
                    
                    // Check for valid audio signatures
                    const isValidAudio = this.checkAudioSignature(bytes);
                    
                    resolve({
                        isValid: isValidAudio,
                        signature: Array.from(bytes.slice(0, 4)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')
                    });
                } catch (error) {
                    resolve({ isValid: false, error: error.message });
                }
            };
            
            reader.onerror = () => {
                resolve({ isValid: false, error: 'Failed to read file' });
            };
            
            // Read first 12 bytes for magic number check
            reader.readAsArrayBuffer(file.slice(0, 12));
        });
    }
    
    checkAudioSignature(bytes) {
        // Check MP3 signatures
        if (bytes.length >= 2 && bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0) {
            return true; // MP3 frame header
        }
        
        if (bytes.length >= 3 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
            return true; // ID3v2 header (MP3 with metadata)
        }
        
        // Check WAV signature (RIFF)
        if (bytes.length >= 4 && 
            bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
            return true;
        }
        
        // Check FLAC signature
        if (bytes.length >= 4 && 
            bytes[0] === 0x66 && bytes[1] === 0x4C && bytes[2] === 0x61 && bytes[3] === 0x43) {
            return true;
        }
        
        return false;
    }
    
    // Image file validation for cover art
    async validateImageFile(file) {
        const validation = {
            isValid: false,
            errors: [],
            warnings: [],
            securityScore: 0
        };
        
        try {
            // Basic checks
            if (!file || !file.name) {
                validation.errors.push('Invalid file object');
                return validation;
            }
            
            // File size check (5MB max for images)
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                validation.errors.push(`Image too large: ${this.formatFileSize(file.size)} (max 5MB)`);
            } else {
                validation.securityScore += 25;
            }
            
            // File extension validation
            const fileName = file.name.toLowerCase();
            const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
            
            if (!hasValidExtension) {
                validation.errors.push('Invalid image extension. Only JPG, PNG, GIF, WebP allowed');
            } else {
                validation.securityScore += 25;
            }
            
            // MIME type validation
            const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!validMimeTypes.includes(file.type)) {
                validation.errors.push(`Invalid image MIME type: ${file.type}`);
            } else {
                validation.securityScore += 25;
            }
            
            // Magic number validation
            const magicValidation = await this.validateImageMagicNumbers(file);
            if (!magicValidation.isValid) {
                validation.errors.push('Image signature validation failed');
            } else {
                validation.securityScore += 25;
            }
            
            validation.isValid = validation.errors.length === 0;
            
        } catch (error) {
            validation.errors.push(`Image validation error: ${error.message}`);
        }
        
        return validation;
    }
    
    async validateImageMagicNumbers(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    const bytes = new Uint8Array(arrayBuffer.slice(0, 12));
                    
                    const isValidImage = this.checkImageSignature(bytes);
                    
                    resolve({
                        isValid: isValidImage,
                        signature: Array.from(bytes.slice(0, 4)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')
                    });
                } catch (error) {
                    resolve({ isValid: false, error: error.message });
                }
            };
            
            reader.onerror = () => {
                resolve({ isValid: false, error: 'Failed to read image file' });
            };
            
            reader.readAsArrayBuffer(file.slice(0, 12));
        });
    }
    
    checkImageSignature(bytes) {
        // JPEG signature
        if (bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
            return true;
        }
        
        // PNG signature
        if (bytes.length >= 4 && 
            bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
            return true;
        }
        
        // GIF signature
        if (bytes.length >= 4 && 
            bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
            return true;
        }
        
        // WebP signature (RIFF)
        if (bytes.length >= 4 && 
            bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
            return true;
        }
        
        return false;
    }
    
    // Filename security validation
    validateFilename(filename) {
        const validation = { isValid: true, errors: [] };
        
        // Check for dangerous extensions
        const dangerousExtensions = [
            '.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.vbs', '.js', '.jar',
            '.app', '.deb', '.pkg', '.dmg', '.run', '.msi', '.ps1', '.sh'
        ];
        
        const lowerFilename = filename.toLowerCase();
        const hasDangerousExtension = dangerousExtensions.some(ext => lowerFilename.includes(ext));
        
        if (hasDangerousExtension) {
            validation.isValid = false;
            validation.errors.push('Filename contains dangerous extension');
        }
        
        // Check for path traversal attempts
        if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            validation.isValid = false;
            validation.errors.push('Filename contains path traversal characters');
        }
        
        // Check for null bytes
        if (filename.includes('\0')) {
            validation.isValid = false;
            validation.errors.push('Filename contains null bytes');
        }
        
        // Length check
        if (filename.length > 255) {
            validation.isValid = false;
            validation.errors.push('Filename too long (max 255 characters)');
        }
        
        return validation;
    }
    
    // XSS prevention for text inputs
    sanitizeInput(input, maxLength = 200) {
        if (!input) return '';
        
        return String(input)
            .replace(/&/g, '&amp;')  // Must be first
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;')
            .replace(/\n/g, '')
            .replace(/\r/g, '')
            .replace(/\t/g, '')
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
            .trim()
            .substring(0, maxLength);
    }
    
    // Validate input against patterns
    validateInputPattern(input, type) {
        const patterns = {
            'artistName': /^[a-zA-Z0-9\s\-_.']{1,50}$/,
            'trackTitle': /^[a-zA-Z0-9\s\-_.,!?']{1,100}$/,
            'genre': /^[a-zA-Z\s\-&]{1,30}$/,
            'email': /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            'isrc': /^[A-Z]{2}-[A-Z0-9]{3}-\d{2}-\d{5}$/i
        };
        
        const pattern = patterns[type];
        if (!pattern) return true;
        
        return pattern.test(input);
    }
    
    // Utility methods
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Generate security report
    generateSecurityReport(validations) {
        const report = {
            overallScore: 0,
            totalChecks: 0,
            passedChecks: 0,
            criticalIssues: [],
            warnings: [],
            recommendations: []
        };
        
        validations.forEach(validation => {
            report.totalChecks++;
            if (validation.isValid) {
                report.passedChecks++;
                report.overallScore += validation.securityScore || 0;
            } else {
                report.criticalIssues.push(...validation.errors);
            }
            if (validation.warnings) {
                report.warnings.push(...validation.warnings);
            }
        });
        
        // Calculate percentage score
        report.overallScore = Math.round((report.passedChecks / report.totalChecks) * 100);
        
        // Add recommendations based on score
        if (report.overallScore < 70) {
            report.recommendations.push('Multiple security issues detected - review all file uploads');
        } else if (report.overallScore < 90) {
            report.recommendations.push('Minor security concerns - consider additional validation');
        } else {
            report.recommendations.push('Good security posture - continue monitoring');
        }
        
        return report;
    }
}

// Export for Chrome extension compatibility
window.SecurityValidator = SecurityValidator;