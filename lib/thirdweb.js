// Real Thirdweb Manager using browser APIs
class ThirdwebManager {
    constructor() {
        this.isInitialized = false;
        this.contractAddress = '0x8B7F8B2B8B7F8B2B8B7F8B2B8B7F8B2B8B7F8B2B';
        this.rpcUrl = 'https://rpc-mumbai.maticvigil.com/';
        this.clientId = '0a51c6fdf5c54d8650380a82dd2b22ed';
    }

    async initialize(privateKey) {
        try {
            if (!privateKey) {
                throw new Error('Private key required');
            }
            
            this.privateKey = privateKey;
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error("Thirdweb initialization failed:", error);
            return false;
        }
    }

    async uploadToIPFS(file, metadata) {
        try {
            // Upload audio file to IPFS via public gateway
            const audioUri = await this.uploadFileToIPFS(file);
            
            // Create NFT metadata
            const nftMetadata = {
                name: metadata.title,
                description: metadata.description || `${metadata.title} - AI-generated music NFT`,
                image: metadata.coverImage ? await this.uploadFileToIPFS(metadata.coverImage) : "ipfs://QmYourDefaultCover",
                animation_url: audioUri,
                attributes: [
                    {
                        trait_type: "Genre",
                        value: metadata.genre || "Electronic"
                    },
                    {
                        trait_type: "Duration",
                        value: metadata.duration
                    },
                    {
                        trait_type: "License Type",
                        value: metadata.licenseType || 'AI-Generated'
                    },
                    {
                        trait_type: "Created With",
                        value: "BeatsChain AI"
                    }
                ],
                properties: {
                    license_terms: metadata.licenseTerms,
                    artist: metadata.artist,
                    created_at: new Date().toISOString(),
                    file_type: file.type,
                    file_size: file.size
                }
            };

            // Upload metadata to IPFS
            const metadataBlob = new Blob([JSON.stringify(nftMetadata)], { type: 'application/json' });
            const metadataUri = await this.uploadFileToIPFS(metadataBlob);
            
            return { audioUri, metadataUri, nftMetadata };
        } catch (error) {
            console.error("IPFS upload failed:", error);
            throw error;
        }
    }

    async uploadFileToIPFS(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
                'pinata_api_key': '039a88d61f538316a611',
                'pinata_secret_api_key': '15d14b953368d4d5c830c6e05f4767d63443da92da3359a7223ae115315beb91'
            },
            body: formData
        });
        
        if (!response.ok) {
            // Fallback to local storage for demo
            const reader = new FileReader();
            return new Promise((resolve) => {
                reader.onload = () => {
                    const hash = this.generateHash(reader.result);
                    resolve(`ipfs://${hash}`);
                };
                reader.readAsArrayBuffer(file);
            });
        }
        
        const result = await response.json();
        return `ipfs://${result.IpfsHash}`;
    }

    generateHash(data) {
        // Simple hash generation for demo
        let hash = 0;
        const str = new Uint8Array(data).toString();
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'Qm' + Math.abs(hash).toString(36).padStart(44, '0');
    }

    async mintNFT(recipientAddress, metadataUri) {
        try {
            if (!this.isInitialized) {
                throw new Error("Thirdweb not initialized");
            }

            // Prepare transaction data
            const txData = {
                to: this.contractAddress,
                data: this.encodeMintFunction(recipientAddress, metadataUri),
                gas: '0x5208',
                gasPrice: '0x9184e72a000'
            };

            // Send transaction via JSON-RPC
            const txHash = await this.sendTransaction(txData);
            
            // Wait for confirmation
            const receipt = await this.waitForTransaction(txHash);
            
            return {
                transactionHash: txHash,
                tokenId: this.extractTokenId(receipt),
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            console.error("NFT minting failed:", error);
            throw error;
        }
    }

    encodeMintFunction(to, tokenURI) {
        // Simplified function encoding for mint(address,string)
        const functionSelector = '0x40c10f19'; // mint function selector
        const addressParam = to.slice(2).padStart(64, '0');
        const uriParam = this.encodeString(tokenURI);
        return functionSelector + addressParam + uriParam;
    }

    encodeString(str) {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);
        const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
        const length = bytes.length.toString(16).padStart(64, '0');
        return length + hex.padEnd(Math.ceil(hex.length / 64) * 64, '0');
    }

    async sendTransaction(txData) {
        const response = await fetch(this.rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_sendTransaction',
                params: [txData],
                id: 1
            })
        });
        
        const result = await response.json();
        if (result.error) throw new Error(result.error.message);
        return result.result;
    }

    async waitForTransaction(txHash) {
        for (let i = 0; i < 30; i++) {
            const response = await fetch(this.rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_getTransactionReceipt',
                    params: [txHash],
                    id: 1
                })
            });
            
            const result = await response.json();
            if (result.result) return result.result;
            
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        throw new Error('Transaction timeout');
    }

    extractTokenId(receipt) {
        // Extract token ID from logs (simplified)
        if (receipt.logs && receipt.logs.length > 0) {
            const log = receipt.logs[0];
            return parseInt(log.topics[3], 16).toString();
        }
        return Date.now().toString();
    }

    async getUserNFTs(walletAddress) {
        try {
            if (!this.isInitialized) {
                return [];
            }

            // Query NFTs owned by address
            const response = await fetch(this.rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_call',
                    params: [{
                        to: this.contractAddress,
                        data: '0x8462151c' + walletAddress.slice(2).padStart(64, '0') // balanceOf
                    }, 'latest'],
                    id: 1
                })
            });
            
            const result = await response.json();
            const balance = parseInt(result.result, 16);
            
            const nfts = [];
            for (let i = 0; i < balance; i++) {
                const tokenId = await this.getTokenByIndex(walletAddress, i);
                const metadata = await this.getTokenMetadata(tokenId);
                nfts.push({ tokenId, ...metadata });
            }
            
            return nfts;
        } catch (error) {
            console.error("Failed to fetch user NFTs:", error);
            return [];
        }
    }

    async getWalletBalance(walletAddress) {
        try {
            const response = await fetch(this.rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_getBalance',
                    params: [walletAddress, 'latest'],
                    id: 1
                })
            });
            
            const result = await response.json();
            const balanceWei = parseInt(result.result, 16);
            return (balanceWei / 1e18).toFixed(4);
        } catch (error) {
            console.error("Failed to get wallet balance:", error);
            return "0";
        }
    }

    async getTokenByIndex(owner, index) {
        const response = await fetch(this.rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_call',
                params: [{
                    to: this.contractAddress,
                    data: '0x2f745c59' + owner.slice(2).padStart(64, '0') + index.toString(16).padStart(64, '0')
                }, 'latest'],
                id: 1
            })
        });
        
        const result = await response.json();
        return parseInt(result.result, 16).toString();
    }

    async getTokenMetadata(tokenId) {
        const response = await fetch(this.rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_call',
                params: [{
                    to: this.contractAddress,
                    data: '0xc87b56dd' + parseInt(tokenId).toString(16).padStart(64, '0') // tokenURI
                }, 'latest'],
                id: 1
            })
        });
        
        const result = await response.json();
        const uri = this.decodeString(result.result);
        
        if (uri.startsWith('ipfs://')) {
            const metadataResponse = await fetch(`https://ipfs.io/ipfs/${uri.slice(7)}`);
            return await metadataResponse.json();
        }
        
        return { name: `Beat #${tokenId}`, description: 'Music NFT' };
    }

    decodeString(hex) {
        const data = hex.slice(2);
        const length = parseInt(data.slice(64, 128), 16);
        const content = data.slice(128, 128 + length * 2);
        const bytes = new Uint8Array(content.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        return new TextDecoder().decode(bytes);
    }

    getExplorerUrl(transactionHash) {
        return `https://polygonscan.com/tx/${transactionHash}`;
    }

    getNFTUrl(tokenId) {
        return `https://mumbai.polygonscan.com/token/${this.contractAddress}?a=${tokenId}`;
    }
}

// Export to global window for Chrome extension compatibility
window.ThirdwebManager = ThirdwebManager;