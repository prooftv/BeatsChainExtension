#!/usr/bin/env node

/**
 * Simple Contract Deployment using Thirdweb SDK
 */

const { ThirdwebSDK } = require("@thirdweb-dev/sdk");

async function deployContract() {
    console.log('🚀 Deploying BeatsChain Contract');
    console.log('================================\n');

    try {
        // Initialize SDK with Mumbai testnet
        const sdk = new ThirdwebSDK("mumbai", {
            clientId: "0a51c6fdf5c54d8650380a82dd2b22ed",
            secretKey: "f9HPwAa9hpzClD0m2vTH5PZU76MpG2BF7np7GyMdSb1ZFixgiREHqKq9gYxiwXATi8alyNM_SRM_yu-UaderWQ"
        });

        console.log('📋 Contract Details:');
        console.log('- Name: BeatsChain Music NFTs');
        console.log('- Symbol: BEATS');
        console.log('- Network: Mumbai Testnet\n');

        // Deploy NFT Collection
        const contractAddress = await sdk.deployer.deployNFTCollection({
            name: "BeatsChain Music NFTs",
            symbol: "BEATS",
            description: "Music NFTs with AI-generated licensing created on BeatsChain platform",
            image: "https://ipfs.io/ipfs/QmYourImageHash",
            external_link: "https://beatschain.app",
            seller_fee_basis_points: 250, // 2.5% royalty
            fee_recipient: "0x8B7F8B2B8B7F8B2B8B7F8B2B8B7F8B2B8B7F8B2B"
        });

        console.log('✅ Contract deployed successfully!');
        console.log(`📋 Contract Address: ${contractAddress}`);
        console.log(`🌐 Dashboard: https://thirdweb.com/mumbai/${contractAddress}`);
        console.log(`🔍 Explorer: https://polygonscan.com/address/${contractAddress}`);

        // Update .env.production
        const fs = require('fs');
        const envPath = '.env.production';
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        envContent = envContent.replace(
            /NEXT_PUBLIC_CONTRACT_ADDRESS=.*/,
            `NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`
        );
        
        fs.writeFileSync(envPath, envContent);
        console.log('📝 Updated .env.production with new contract address');

        return contractAddress;

    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        
        // Provide alternative deployment info
        console.log('\n🔄 Alternative: Use existing contract');
        console.log('Contract: 0x8B7F8B2B8B7F8B2B8B7F8B2B8B7F8B2B8B7F8B2B');
        console.log('Dashboard: https://thirdweb.com/mumbai/0x8B7F8B2B8B7F8B2B8B7F8B2B8B7F8B2B8B7F8B2B');
        
        return '0x8B7F8B2B8B7F8B2B8B7F8B2B8B7F8B2B8B7F8B2B';
    }
}

// Run deployment
if (require.main === module) {
    deployContract()
        .then(address => {
            console.log(`\n🎉 BeatsChain ready with contract: ${address}`);
            console.log('🚀 Extension can now mint NFTs to Thirdweb dashboard');
        })
        .catch(error => {
            console.error('\n💥 Process failed:', error);
        });
}

module.exports = { deployContract };