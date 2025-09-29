#!/usr/bin/env node

/**
 * Deploy BeatsChain Contract to Thirdweb Dashboard
 * This will make the contract visible in Thirdweb interface
 */

const { exec } = require('child_process');
const fs = require('fs');

async function deployToThirdweb() {
    console.log('🚀 Deploying BeatsChain to Thirdweb Dashboard');
    console.log('==========================================\n');

    // Check environment
    const clientId = '0a51c6fdf5c54d8650380a82dd2b22ed';
    const secretKey = 'f9HPwAa9hpzClD0m2vTH5PZU76MpG2BF7np7GyMdSb1ZFixgiREHqKq9gYxiwXATi8alyNM_SRM_yu-UaderWQ';
    
    console.log('📋 Using Thirdweb Credentials:');
    console.log(`Client ID: ${clientId}`);
    console.log(`Network: Mumbai Testnet\n`);

    try {
        // Create deployment script
        const deployScript = `
const { ThirdwebSDK } = require("@thirdweb-dev/sdk");
const { Mumbai } = require("@thirdweb-dev/chains");

async function deploy() {
    const sdk = ThirdwebSDK.fromPrivateKey(
        process.env.PRIVATE_KEY || "0x" + "0".repeat(64), // Placeholder - use your private key
        Mumbai,
        {
            clientId: "${clientId}",
            secretKey: "${secretKey}"
        }
    );

    console.log("Deploying NFT Collection...");
    
    const contractAddress = await sdk.deployer.deployNFTCollection({
        name: "BeatsChain Music NFTs",
        symbol: "BEATS",
        description: "Music NFTs with AI-generated licensing on BeatsChain",
        image: "https://ipfs.io/ipfs/QmYourImageHash", // Replace with actual image
        external_link: "https://beatschain.app",
        seller_fee_basis_points: 250, // 2.5% royalty
        fee_recipient: sdk.getSigner().getAddress(),
        platform_fee_basis_points: 0,
        platform_fee_recipient: "0x0000000000000000000000000000000000000000"
    });

    console.log("✅ Contract deployed:", contractAddress);
    return contractAddress;
}

deploy().catch(console.error);
        `;

        fs.writeFileSync('temp-deploy.js', deployScript);

        // Alternative: Use Thirdweb CLI
        console.log('🔧 Using Thirdweb CLI deployment...\n');
        
        const cliCommand = `npx thirdweb@latest deploy --name "BeatsChain Music NFTs" --description "Music NFTs with AI-generated licensing" --symbol "BEATS"`;
        
        console.log('⏳ Executing deployment...');
        const result = await execCommand(cliCommand);
        
        console.log('📄 Deployment Result:');
        console.log(result);
        
        // Clean up
        if (fs.existsSync('temp-deploy.js')) {
            fs.unlinkSync('temp-deploy.js');
        }

    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        
        // Provide manual instructions
        console.log('\n📝 Manual Deployment Instructions:');
        console.log('1. Go to https://thirdweb.com/dashboard');
        console.log('2. Connect your wallet');
        console.log('3. Click "Deploy new contract"');
        console.log('4. Choose "NFT Collection"');
        console.log('5. Fill in details:');
        console.log('   - Name: BeatsChain Music NFTs');
        console.log('   - Symbol: BEATS');
        console.log('   - Description: Music NFTs with AI-generated licensing');
        console.log('   - Network: Polygon Mumbai');
        console.log('6. Deploy and copy the contract address');
        console.log('7. Update .env.production with new address\n');
    }
}

function execCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
}

// Run deployment
if (require.main === module) {
    deployToThirdweb()
        .then(() => {
            console.log('\n🎉 Deployment process completed!');
            console.log('Check Thirdweb dashboard: https://thirdweb.com/dashboard');
        })
        .catch(error => {
            console.error('\n❌ Process failed:', error);
        });
}