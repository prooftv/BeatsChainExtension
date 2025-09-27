/**
 * BeatsChain NFT Contract Deployment Script
 * Deploy real NFT collection contract on Polygon Mumbai
 */

const { ThirdwebSDK } = require("@thirdweb-dev/sdk");

async function deployBeatsChainContract() {
    console.log('🎵 BeatsChain NFT Contract Deployment');
    console.log('====================================\n');

    try {
        // Initialize Thirdweb SDK
        const sdk = new ThirdwebSDK("mumbai", {
            clientId: "0a51c6fdf5c54d8650380a82dd2b22ed"
        });

        console.log('📡 Connecting to Polygon Mumbai...');

        // Contract metadata
        const contractMetadata = {
            name: "BeatsChain Music NFTs",
            symbol: "BEATS",
            description: "Music NFTs with AI-generated licensing terms",
            image: "https://ipfs.io/ipfs/QmYourLogoHash", // Replace with actual logo
            external_link: "https://beatschain.app",
            seller_fee_basis_points: 250, // 2.5% royalty
            fee_recipient: "0x742d35Cc6634C0532925a3b8D0C9964E5Bfe4d4B" // Your wallet
        };

        console.log('🚀 Deploying NFT Collection contract...');
        console.log('Contract Details:');
        console.log(`- Name: ${contractMetadata.name}`);
        console.log(`- Symbol: ${contractMetadata.symbol}`);
        console.log(`- Royalty: ${contractMetadata.seller_fee_basis_points / 100}%`);

        // Deploy the contract
        const contractAddress = await sdk.deployer.deployNFTCollection(contractMetadata);

        console.log('\n✅ Contract deployed successfully!');
        console.log(`📋 Contract Address: ${contractAddress}`);
        console.log(`🔗 View on PolygonScan: https://mumbai.polygonscan.com/address/${contractAddress}`);
        console.log(`🌊 View on OpenSea: https://testnets.opensea.io/collection/${contractAddress}`);

        // Update environment configuration
        console.log('\n📝 Update your .env file:');
        console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);

        return contractAddress;

    } catch (error) {
        console.error('❌ Contract deployment failed:', error);
        
        if (error.message.includes('insufficient funds')) {
            console.log('\n💰 You need Mumbai MATIC for deployment:');
            console.log('1. Get testnet MATIC from: https://faucet.polygon.technology/');
            console.log('2. Send to your wallet address');
            console.log('3. Try deployment again');
        }
        
        throw error;
    }
}

// Run deployment
if (require.main === module) {
    deployBeatsChainContract()
        .then(address => {
            console.log(`\n🎉 BeatsChain contract ready at: ${address}`);
            process.exit(0);
        })
        .catch(error => {
            console.error('Deployment failed:', error);
            process.exit(1);
        });
}

module.exports = { deployBeatsChainContract };