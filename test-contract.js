#!/usr/bin/env node

/**
 * Test BeatsChain Contract Deployment
 * Verify contract is working on Mumbai testnet
 */

const { ThirdwebSDK } = require("@thirdweb-dev/sdk");
require('dotenv').config();

async function testContract() {
    console.log('🧪 Testing BeatsChain Contract');
    console.log('=============================\n');

    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID;

    console.log(`📋 Contract Address: ${contractAddress}`);
    console.log(`🔑 Client ID: ${clientId}\n`);

    try {
        // Initialize SDK (read-only)
        const sdk = new ThirdwebSDK("mumbai", {
            clientId: clientId
        });

        console.log('📡 Connecting to contract...');
        const contract = await sdk.getContract(contractAddress);

        // Get contract info
        const metadata = await contract.metadata.get();
        console.log('✅ Contract connected successfully!');
        console.log(`📝 Name: ${metadata.name}`);
        console.log(`🏷️  Symbol: ${metadata.symbol}`);
        console.log(`📄 Description: ${metadata.description || 'N/A'}\n`);

        // Check if it's an NFT contract
        const isERC721 = await contract.erc721.get().catch(() => null);
        if (isERC721) {
            console.log('🎨 Contract Type: ERC721 NFT Collection');
            
            // Get total supply
            const totalSupply = await contract.erc721.totalSupply();
            console.log(`📊 Total NFTs Minted: ${totalSupply.toString()}`);
        }

        // Contract URLs
        console.log('\n🔗 Contract Links:');
        console.log(`Mumbai Explorer: https://mumbai.polygonscan.com/address/${contractAddress}`);
        console.log(`OpenSea Testnet: https://testnets.opensea.io/collection/${contractAddress}`);
        console.log(`Thirdweb Dashboard: https://thirdweb.com/mumbai/${contractAddress}`);

        console.log('\n✅ Contract test completed successfully!');
        return true;

    } catch (error) {
        console.error('❌ Contract test failed:', error.message);
        
        if (error.message.includes('could not detect network')) {
            console.log('\n💡 Possible issues:');
            console.log('- Contract address might be invalid');
            console.log('- Network connection issues');
            console.log('- Contract not deployed yet');
        }
        
        return false;
    }
}

// Mock test for development
async function mockTest() {
    console.log('🎭 Running Mock Test (for development)');
    console.log('====================================\n');
    
    console.log('✅ Mock contract simulation:');
    console.log('📝 Name: BeatsChain Music NFTs');
    console.log('🏷️  Symbol: BEATS');
    console.log('📊 Total NFTs: 0 (new contract)');
    console.log('🎨 Type: ERC721 Collection');
    
    console.log('\n🔗 Mock URLs:');
    console.log('Mumbai Explorer: https://mumbai.polygonscan.com/address/0x742d35Cc6634C0532925a3b8D0C9964E5Bfe4d4B');
    console.log('OpenSea: https://testnets.opensea.io/collection/beatschain-music-nfts');
    
    console.log('\n✅ Mock test completed - Extension ready for demo!');
    return true;
}

// Run test
if (require.main === module) {
    const runMock = process.argv.includes('--mock');
    
    if (runMock) {
        mockTest().then(() => process.exit(0));
    } else {
        testContract()
            .then(success => {
                if (success) {
                    console.log('\n🎉 Ready for production minting!');
                } else {
                    console.log('\n🎭 Falling back to mock mode for development');
                }
                process.exit(success ? 0 : 1);
            });
    }
}

module.exports = { testContract, mockTest };