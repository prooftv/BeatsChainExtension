// Radio IPFS Manager - Separate storage for radio submissions
class RadioIPFSManager {
    constructor() {
        this.pinataApiKey = process.env.PINATA_API_KEY || '039a88d61f538316a611';
        this.pinataSecretKey = process.env.PINATA_SECRET_KEY || '15d14b953368d4d5c830c6e05f4767d63443da92da3359a7223ae115315beb91';
        this.radioFolder = 'radio-submissions';
    }

    async uploadRadioPackage(files, metadata, artistProfile) {
        try {
            console.log('📻 Uploading radio package to IPFS...');
            
            const packageFiles = [];
            
            // Upload audio file
            if (files.audio) {
                const audioResult = await this.uploadSingleFile(files.audio, {
                    ...metadata,
                    type: 'audio',
                    purpose: 'radio_submission'
                });
                packageFiles.push({
                    type: 'audio',
                    filename: files.audio.name,
                    ipfsHash: audioResult.ipfsHash,
                    size: files.audio.size
                });
            }
            
            // Upload cover image
            if (files.coverImage) {
                const imageResult = await this.uploadSingleFile(files.coverImage, {
                    ...metadata,
                    type: 'cover_image',
                    purpose: 'radio_submission'
                });
                packageFiles.push({
                    type: 'cover_image',
                    filename: files.coverImage.name,
                    ipfsHash: imageResult.ipfsHash,
                    size: files.coverImage.size
                });
            }
            
            // Create comprehensive metadata package
            const radioMetadata = {
                packageType: 'radio_submission',
                submissionDate: new Date().toISOString(),
                trackInfo: metadata,
                artistProfile: artistProfile,
                files: packageFiles,
                radioReady: true,
                samroCompliant: true
            };
            
            // Upload metadata as JSON
            const metadataResult = await this.uploadJSON(radioMetadata, 'radio-package-metadata.json');
            
            return {
                success: true,
                packageHash: metadataResult.ipfsHash,
                files: packageFiles,
                metadata: radioMetadata,
                radioPackageUrl: `https://gateway.pinata.cloud/ipfs/${metadataResult.ipfsHash}`
            };
            
        } catch (error) {
            console.error('❌ Radio package upload failed:', error);
            
            // Fallback with mock hash
            const mockHash = 'QmRadio' + Array.from(crypto.getRandomValues(new Uint8Array(20)), 
                byte => byte.toString(16).padStart(2, '0')).join('').substring(0, 40);
            
            return {
                success: false,
                error: error.message,
                fallback: true,
                packageHash: mockHash,
                radioPackageUrl: `https://gateway.pinata.cloud/ipfs/${mockHash}`
            };
        }
    }

    async uploadSingleFile(file, metadata) {
        const formData = new FormData();
        formData.append('file', file);
        
        const pinataMetadata = {
            name: `${this.radioFolder}/${metadata.title || file.name}`,
            keyvalues: {
                type: metadata.type,
                purpose: 'radio_submission',
                artist: metadata.artistName || 'Unknown',
                genre: metadata.genre || 'Music',
                uploadedAt: new Date().toISOString(),
                radioReady: true
            }
        };
        
        formData.append('pinataMetadata', JSON.stringify(pinataMetadata));
        
        const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
                'pinata_api_key': this.pinataApiKey,
                'pinata_secret_api_key': this.pinataSecretKey
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Upload failed: ${response.status}`);
        }
        
        const result = await response.json();
        
        return {
            success: true,
            ipfsHash: result.IpfsHash,
            ipfsUrl: `https://ipfs.io/ipfs/${result.IpfsHash}`,
            pinataUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
            size: result.PinSize
        };
    }

    async uploadJSON(jsonData, filename) {
        const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
            type: 'application/json'
        });
        
        const file = new File([blob], filename, {
            type: 'application/json'
        });
        
        return await this.uploadSingleFile(file, {
            title: filename,
            type: 'metadata',
            purpose: 'radio_submission'
        });
    }

    async generateEnhancedRadioPackage(audioFile, coverImage, metadata, artistProfile) {
        try {
            const files = [];
            
            // 1. Audio file
            if (audioFile) {
                files.push({
                    name: `audio/${this.sanitizeFilename(metadata.title)}.${this.getFileExtension(audioFile.name)}`,
                    content: audioFile
                });
            }
            
            // 2. Cover image
            if (coverImage) {
                files.push({
                    name: `images/cover_art.${this.getFileExtension(coverImage.name)}`,
                    content: coverImage
                });
            }
            
            // 3. Enhanced metadata JSON
            const enhancedMetadata = {
                track: {
                    title: metadata.title,
                    artist: metadata.artistName,
                    stageName: metadata.stageName,
                    genre: metadata.genre,
                    language: metadata.language,
                    duration: metadata.duration,
                    isrc: metadata.isrc,
                    contentRating: metadata.contentRating
                },
                artist: {
                    name: metadata.artistName,
                    stageName: metadata.stageName,
                    biography: artistProfile.biography || '',
                    influences: artistProfile.influences || '',
                    social: artistProfile.social || {},
                    contact: artistProfile.contact || {}
                },
                submission: {
                    date: new Date().toISOString(),
                    type: 'radio_submission',
                    radioReady: true,
                    samroCompliant: true
                }
            };
            
            files.push({
                name: 'metadata/enhanced_metadata.json',
                content: JSON.stringify(enhancedMetadata, null, 2)
            });
            
            // 4. Artist biography text file
            if (artistProfile.biography) {
                const bioText = `ARTIST BIOGRAPHY\n\nArtist: ${metadata.artistName}\nStage Name: ${metadata.stageName || 'N/A'}\n\n${artistProfile.biography}\n\nInfluences: ${artistProfile.influences || 'Not specified'}\n\nSocial Media:\n${artistProfile.social?.instagram ? `Instagram: ${artistProfile.social.instagram}\n` : ''}${artistProfile.social?.twitter ? `Twitter: ${artistProfile.social.twitter}\n` : ''}\n\nGenerated: ${new Date().toLocaleString()}`;
                
                files.push({
                    name: 'artist/biography.txt',
                    content: bioText
                });
            }
            
            // 5. Radio submission README
            const readmeContent = `RADIO SUBMISSION PACKAGE\n\nTrack: ${metadata.title}\nArtist: ${metadata.artistName}\nGenre: ${metadata.genre}\nLanguage: ${metadata.language}\n\nPACKAGE CONTENTS:\n- audio/ - Main audio file\n- images/ - Cover artwork\n- metadata/ - Enhanced metadata (JSON)\n- artist/ - Artist biography and information\n\nSUBMISSION DATE: ${new Date().toLocaleString()}\nGENERATED BY: BeatsChain Radio Submission System\n\nThis package is ready for radio station submission.`;
            
            files.push({
                name: 'README.txt',
                content: readmeContent
            });
            
            return files;
            
        } catch (error) {
            console.error('Enhanced package generation failed:', error);
            throw error;
        }
    }

    sanitizeFilename(filename) {
        if (!filename) return 'untitled';
        return filename.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
    }

    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    async getRadioPackageInfo(packageHash) {
        try {
            const response = await fetch(`https://gateway.pinata.cloud/ipfs/${packageHash}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Failed to get package info:', error);
        }
        return null;
    }
}

window.RadioIPFSManager = RadioIPFSManager;