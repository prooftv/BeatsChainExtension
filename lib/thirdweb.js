// Thirdweb SDK Integration for BeatsChain
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { ThirdwebStorage } from "@thirdweb-dev/storage";

class ThirdwebManager {
    constructor() {
        this.sdk = null;
        this.contract = null;
        this.storage = new ThirdwebStorage();
        this.isInitialized = false;
    }

    async initialize(privateKey) {
        try {
            // Initialize SDK with private key
            this.sdk = ThirdwebSDK.fromPrivateKey(
                privateKey,
                "polygon-mumbai", // Testnet
                {
                    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
                }
            );

            // Get NFT contract
            this.contract = await this.sdk.getContract(
                process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
            );

            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error("Thirdweb initialization failed:", error);
            return false;
        }
    }

    async uploadToIPFS(file, metadata) {
        try {
            // Upload audio file to IPFS
            const audioUri = await this.storage.upload(file);
            
            // Create NFT metadata
            const nftMetadata = {
                name: metadata.title,
                description: metadata.description,
                image: metadata.coverImage || "ipfs://default-music-cover",
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
                        value: metadata.licenseType
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
            const metadataUri = await this.storage.upload(nftMetadata);
            return { audioUri, metadataUri, nftMetadata };
        } catch (error) {
            console.error("IPFS upload failed:", error);
            throw error;
        }
    }

    async mintNFT(recipientAddress, metadataUri) {
        try {
            if (!this.isInitialized) {
                throw new Error("Thirdweb not initialized");
            }

            // Mint NFT to recipient
            const tx = await this.contract.erc721.mintTo(recipientAddress, metadataUri);
            
            return {
                transactionHash: tx.receipt.transactionHash,
                tokenId: tx.id.toString(),
                blockNumber: tx.receipt.blockNumber
            };
        } catch (error) {
            console.error("NFT minting failed:", error);
            throw error;
        }
    }

    async getUserNFTs(walletAddress) {
        try {
            if (!this.isInitialized) {
                return [];
            }

            const nfts = await this.contract.erc721.getOwned(walletAddress);
            return nfts.map(nft => ({
                tokenId: nft.metadata.id,
                name: nft.metadata.name,
                description: nft.metadata.description,
                image: nft.metadata.image,
                animationUrl: nft.metadata.animation_url,
                attributes: nft.metadata.attributes,
                properties: nft.metadata.properties
            }));
        } catch (error) {
            console.error("Failed to fetch user NFTs:", error);
            return [];
        }
    }

    async getWalletBalance(walletAddress) {
        try {
            if (!this.sdk) return "0";
            
            const balance = await this.sdk.getBalance(walletAddress);
            return balance.displayValue;
        } catch (error) {
            console.error("Failed to get wallet balance:", error);
            return "0";
        }
    }

    getExplorerUrl(transactionHash) {
        // Mumbai testnet explorer
        return `https://mumbai.polygonscan.com/tx/${transactionHash}`;
    }

    getNFTUrl(tokenId) {
        // OpenSea testnet URL
        return `https://testnets.opensea.io/assets/mumbai/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}/${tokenId}`;
    }
}

export default ThirdwebManager;