
const { ThirdwebSDK } = require("@thirdweb-dev/sdk");
const { Mumbai } = require("@thirdweb-dev/chains");

async function deploy() {
    const sdk = ThirdwebSDK.fromPrivateKey(
        process.env.PRIVATE_KEY || "0x" + "0".repeat(64), // Placeholder - use your private key
        Mumbai,
        {
            clientId: "0a51c6fdf5c54d8650380a82dd2b22ed",
            secretKey: "f9HPwAa9hpzClD0m2vTH5PZU76MpG2BF7np7GyMdSb1ZFixgiREHqKq9gYxiwXATi8alyNM_SRM_yu-UaderWQ"
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
        