const { ThirdwebSDK } = require("@thirdweb-dev/sdk");
const { PolygonMumbaiTestnet } = require("@thirdweb-dev/chains");
require('dotenv').config();

async function deployRealContract() {
    try {
        console.log("🚀 Starting real BeatsChain contract deployment...");
        
        // Initialize Thirdweb SDK with Mumbai testnet
        const sdk = ThirdwebSDK.fromPrivateKey(
            process.env.PRIVATE_KEY || "0x" + "0".repeat(64), // Use your actual private key
            PolygonMumbaiTestnet,
            {
                clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
                secretKey: process.env.NEXT_PUBLIC_THIRDWEB_SECRET_KEY
            }
        );

        console.log("📋 Deploying NFT Collection contract...");
        
        // Deploy NFT Collection (ERC721) contract
        const contractAddress = await sdk.deployer.deployNFTCollection({
            name: "BeatsChain Music NFTs",
            symbol: "BEATS",
            description: "AI-powered music NFTs with blockchain licensing",
            image: "https://ipfs.io/ipfs/QmYourLogoHash", // Replace with actual logo
            external_link: "https://beatschain.app",
            seller_fee_basis_points: 250, // 2.5% royalty
            fee_recipient: "0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b6", // Replace with your address
            platform_fee_basis_points: 0,
            platform_fee_recipient: "0x0000000000000000000000000000000000000000"
        });

        console.log("✅ Contract deployed successfully!");
        console.log("📍 Contract Address:", contractAddress);
        console.log("🔗 View on PolygonScan:", `https://mumbai.polygonscan.com/address/${contractAddress}`);
        
        // Update .env file with real contract address
        const fs = require('fs');
        const envContent = fs.readFileSync('.env', 'utf8');
        const updatedEnv = envContent.replace(
            /NEXT_PUBLIC_CONTRACT_ADDRESS=.*/,
            `NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`
        );
        fs.writeFileSync('.env', updatedEnv);
        
        console.log("📝 Updated .env file with real contract address");
        
        // Test contract functionality
        console.log("🧪 Testing contract functionality...");
        const contract = await sdk.getContract(contractAddress);
        
        // Test minting (you'll need MATIC in your wallet)
        try {
            const metadata = {
                name: "Test Beat #1",
                description: "Test music NFT for BeatsChain",
                image: "https://ipfs.io/ipfs/QmTestImageHash",
                attributes: [
                    { trait_type: "Genre", value: "Electronic" },
                    { trait_type: "BPM", value: "128" },
                    { trait_type: "Duration", value: "3:45" }
                ]
            };
            
            const tx = await contract.erc721.mintTo("0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b6", metadata);
            console.log("✅ Test mint successful! Transaction:", tx.receipt.transactionHash);
        } catch (mintError) {
            console.log("⚠️  Test mint failed (likely insufficient MATIC):", mintError.message);
        }
        
        return {
            success: true,
            contractAddress,
            explorerUrl: `https://mumbai.polygonscan.com/address/${contractAddress}`
        };
        
    } catch (error) {
        console.error("❌ Contract deployment failed:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Run deployment
if (require.main === module) {
    deployRealContract()
        .then(result => {
            if (result.success) {
                console.log("\n🎉 DEPLOYMENT COMPLETE!");
                console.log("Contract Address:", result.contractAddress);
                console.log("Explorer URL:", result.explorerUrl);
                console.log("\n📋 Next Steps:");
                console.log("1. Add MATIC to your wallet for testing");
                console.log("2. Update extension with new contract address");
                console.log("3. Test minting functionality");
            } else {
                console.log("\n❌ DEPLOYMENT FAILED!");
                console.log("Error:", result.error);
            }
        })
        .catch(console.error);
}

module.exports = { deployRealContract };