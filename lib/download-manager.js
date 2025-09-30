// Download Package Manager - Creates zip with all minted resources
class DownloadManager {
    constructor() {
        this.jszip = null;
    }

    async initialize() {
        // Load JSZip library dynamically
        if (!window.JSZip) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            document.head.appendChild(script);
            
            await new Promise(resolve => {
                script.onload = resolve;
            });
        }
        this.jszip = new JSZip();
    }

    async createMintPackage(nftData) {
        try {
            await this.initialize();
            const zip = new JSZip();
            
            // Add original audio file
            if (nftData.audioFile) {
                zip.file(`audio/${nftData.title}.${nftData.audioFormat}`, nftData.audioFile);
            }
            
            // Add cover image if exists
            if (nftData.coverImage) {
                zip.file(`images/${nftData.title}-cover.jpg`, nftData.coverImage);
            }
            
            // Add license terms
            zip.file('license.txt', nftData.licenseTerms);
            
            // Add NFT metadata JSON
            const metadata = {
                name: nftData.title,
                description: nftData.description,
                artist: nftData.artist,
                contract_address: nftData.contractAddress,
                token_id: nftData.tokenId,
                transaction_hash: nftData.transactionHash,
                ipfs_hash: nftData.ipfsHash,
                minted_date: new Date().toISOString(),
                blockchain: 'Polygon Mumbai',
                explorer_url: `https://mumbai.polygonscan.com/tx/${nftData.transactionHash}`
            };
            zip.file('nft-metadata.json', JSON.stringify(metadata, null, 2));
            
            // Add certificate of authenticity
            const certificate = this.generateCertificate(nftData);
            zip.file('certificate.txt', certificate);
            
            // Generate and download zip
            const content = await zip.generateAsync({type: 'blob'});
            const url = URL.createObjectURL(content);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `${nftData.title}-BeatsChain-Package.zip`;
            a.click();
            
            URL.revokeObjectURL(url);
            return true;
            
        } catch (error) {
            console.error('Package creation failed:', error);
            return false;
        }
    }

    generateCertificate(nftData) {
        return `BEATSCHAIN CERTIFICATE OF AUTHENTICITY

Track: ${nftData.title}
Artist: ${nftData.artist}
Token ID: ${nftData.tokenId}
Contract: ${nftData.contractAddress}
Blockchain: Polygon Mumbai Testnet

This certificate verifies the authenticity of the above NFT.
Transaction Hash: ${nftData.transactionHash}
Minted: ${new Date().toLocaleDateString()}

Verify at: https://mumbai.polygonscan.com/tx/${nftData.transactionHash}

© ${new Date().getFullYear()} BeatsChain - Powered by AI & Blockchain`;
    }
}

window.DownloadManager = DownloadManager;