// Real IPFS Upload via Pinata API
class IPFSManager {
    constructor() {
        this.pinataApiKey = process.env.PINATA_API_KEY || '039a88d61f538316a611';
        this.pinataSecretKey = process.env.PINATA_SECRET_KEY || '15d14b953368d4d5c830c6e05f4767d63443da92da3359a7223ae115315beb91';
        this.pinataEndpoint = 'https://api.pinata.cloud';
    }

    async uploadFile(file, metadata = {}) {
        try {
            console.log('📤 Uploading to IPFS via Pinata:', file.name);
            
            const formData = new FormData();
            formData.append('file', file);
            
            // Add metadata
            const pinataMetadata = {
                name: metadata.title || file.name,
                keyvalues: {
                    artist: metadata.artist || 'Unknown',
                    genre: metadata.genre || 'Music',
                    duration: metadata.duration || '0:00',
                    uploadedAt: new Date().toISOString(),
                    beatsChainVersion: '1.0.0'
                }
            };
            
            formData.append('pinataMetadata', JSON.stringify(pinataMetadata));
            
            const pinataOptions = {
                cidVersion: 1,
                customPinPolicy: {
                    regions: [
                        { id: 'FRA1', desiredReplicationCount: 1 },
                        { id: 'NYC1', desiredReplicationCount: 1 }
                    ]
                }
            };
            
            formData.append('pinataOptions', JSON.stringify(pinataOptions));
            
            const response = await fetch(`https://api.pinata.cloud/pinning/pinFileToIPFS`, {
                method: 'POST',
                headers: {
                    'pinata_api_key': this.pinataApiKey,
                    'pinata_secret_api_key': this.pinataSecretKey
                },
                body: formData
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Pinata upload failed: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            
            console.log('✅ IPFS upload successful:', result.IpfsHash);
            
            return {
                success: true,
                ipfsHash: result.IpfsHash,
                ipfsUrl: `https://ipfs.io/ipfs/${result.IpfsHash}`,
                pinataUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
                size: result.PinSize,
                timestamp: result.Timestamp
            };
            
        } catch (error) {
            console.error('❌ IPFS upload failed:', error);
            
            // Fallback: Generate mock IPFS hash for testing
            const mockHash = 'Qm' + Array.from(crypto.getRandomValues(new Uint8Array(22)), 
                byte => byte.toString(16).padStart(2, '0')).join('').substring(0, 44);
            
            console.log('🔄 Using fallback mock IPFS hash:', mockHash);
            
            return {
                success: false,
                error: error.message,
                fallback: true,
                ipfsHash: mockHash,
                ipfsUrl: `https://ipfs.io/ipfs/${mockHash}`,
                pinataUrl: `https://gateway.pinata.cloud/ipfs/${mockHash}`
            };
        }
    }

    async uploadJSON(jsonData, filename = 'metadata.json') {
        try {
            console.log('📤 Uploading JSON to IPFS:', filename);
            
            const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
                type: 'application/json'
            });
            
            const file = new File([blob], filename, {
                type: 'application/json'
            });
            
            return await this.uploadFile(file, {
                title: filename,
                type: 'metadata'
            });
            
        } catch (error) {
            console.error('❌ JSON upload failed:', error);
            throw error;
        }
    }

    async uploadNFTMetadata(nftData) {
        try {
            const metadata = {
                name: nftData.title,
                description: nftData.description,
                image: nftData.imageUrl || 'https://ipfs.io/ipfs/QmBeatsChainDefaultImage',
                animation_url: nftData.audioUrl,
                external_url: 'https://beatschain.app',
                attributes: [
                    {
                        trait_type: 'Artist',
                        value: nftData.artist
                    },
                    {
                        trait_type: 'Genre',
                        value: nftData.genre
                    },
                    {
                        trait_type: 'Duration',
                        value: nftData.duration
                    },
                    {
                        trait_type: 'BPM',
                        value: nftData.bpm || 'Unknown'
                    },
                    {
                        trait_type: 'Energy Level',
                        value: nftData.energyLevel || 'Medium'
                    },
                    {
                        trait_type: 'License Type',
                        value: 'AI-Generated'
                    },
                    {
                        trait_type: 'Blockchain',
                        value: 'Polygon Mumbai'
                    },
                    {
                        trait_type: 'Created Date',
                        value: new Date().toISOString().split('T')[0]
                    }
                ],
                properties: {
                    license_terms: nftData.licenseTerms,
                    audio_format: nftData.audioFormat,
                    file_size: nftData.fileSize,
                    quality: nftData.quality,
                    contract_address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b5Da5A'
                }
            };
            
            return await this.uploadJSON(metadata, `${nftData.title}-metadata.json`);
            
        } catch (error) {
            console.error('❌ NFT metadata upload failed:', error);
            throw error;
        }
    }

    async getFileInfo(ipfsHash) {
        try {
            const response = await fetch(`https://api.pinata.cloud/data/pinList?hashContains=${ipfsHash}`, {
                headers: {
                    'pinata_api_key': this.pinataApiKey,
                    'pinata_secret_api_key': this.pinataSecretKey
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to get file info: ${response.status}`);
            }
            
            const data = await response.json();
            return data.rows[0] || null;
            
        } catch (error) {
            console.error('❌ Failed to get file info:', error);
            return null;
        }
    }

    async unpinFile(ipfsHash) {
        try {
            const response = await fetch(`https://api.pinata.cloud/pinning/unpin/${ipfsHash}`, {
                method: 'DELETE',
                headers: {
                    'pinata_api_key': this.pinataApiKey,
                    'pinata_secret_api_key': this.pinataSecretKey
                }
            });
            
            return response.ok;
            
        } catch (error) {
            console.error('❌ Failed to unpin file:', error);
            return false;
        }
    }

    getGatewayUrl(ipfsHash, gateway = 'ipfs') {
        const gateways = {
            ipfs: `https://ipfs.io/ipfs/${ipfsHash}`,
            pinata: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
            cloudflare: `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
            dweb: `https://dweb.link/ipfs/${ipfsHash}`
        };
        
        return gateways[gateway] || gateways.ipfs;
    }

    async testConnection() {
        try {
            const response = await fetch(`https://api.pinata.cloud/data/testAuthentication`, {
                headers: {
                    'pinata_api_key': this.pinataApiKey,
                    'pinata_secret_api_key': this.pinataSecretKey
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Pinata connection successful:', data.message);
                return true;
            } else {
                console.error('❌ Pinata authentication failed:', response.status);
                return false;
            }
            
        } catch (error) {
            console.error('❌ Pinata connection test failed:', error);
            return false;
        }
    }
}

// Export for Chrome extension compatibility
window.IPFSManager = IPFSManager;