#!/usr/bin/env node

/**
 * BeatsChain Real Contract Deployment
 * Deploy NFT Collection to Polygon Mumbai using Thirdweb
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function deployContract() {
    console.log('🎵 BeatsChain Contract Deployment');
    console.log('=================================\n');

    // Check if Thirdweb CLI is installed
    console.log('📦 Checking Thirdweb CLI...');
    
    try {
        await execCommand('npx thirdweb --version');
        console.log('✅ Thirdweb CLI ready\n');
    } catch (error) {
        console.log('📥 Installing Thirdweb CLI...');
        await execCommand('npm install -g @thirdweb-dev/cli');
    }

    // Deploy NFT Collection
    console.log('🚀 Deploying NFT Collection...');
    console.log('Contract Details:');
    console.log('- Name: BeatsChain Music NFTs');
    console.log('- Symbol: BEATS');
    console.log('- Network: Polygon Mumbai');
    console.log('- Features: ERC721, Mintable, URI Storage\n');

    try {
        // Use Thirdweb deploy command
        const deployCommand = `npx thirdweb deploy --name "BeatsChain Music NFTs" --symbol "BEATS" --network mumbai`;
        
        console.log('⏳ Deploying contract (this may take a few minutes)...');
        const result = await execCommand(deployCommand);
        
        // Extract contract address from output
        const addressMatch = result.match(/Contract deployed at: (0x[a-fA-F0-9]{40})/);
        
        if (addressMatch) {
            const contractAddress = addressMatch[1];
            console.log(`✅ Contract deployed successfully!`);
            console.log(`📋 Contract Address: ${contractAddress}`);
            
            // Update .env file
            updateEnvFile(contractAddress);
            
            console.log(`🔗 Mumbai Explorer: https://mumbai.polygonscan.com/address/${contractAddress}`);
            console.log(`🌊 OpenSea Testnet: https://testnets.opensea.io/collection/${contractAddress}`);
            
            return contractAddress;
        } else {
            throw new Error('Could not extract contract address from deployment output');
        }
        
    } catch (error) {
        console.error('❌ Deployment failed:', error.message);
        
        // Fallback: Use pre-built contract
        console.log('\n🔄 Using fallback deployment method...');
        return await deployFallbackContract();
    }
}

async function deployFallbackContract() {
    console.log('📝 Creating contract file...');
    
    const contractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@thirdweb-dev/contracts/base/ERC721Base.sol";

contract BeatsChainMusicNFTs is ERC721Base {
    constructor(
        string memory _name,
        string memory _symbol,
        address _royaltyRecipient,
        uint128 _royaltyBps
    ) ERC721Base(_name, _symbol, _royaltyRecipient, _royaltyBps) {}
}`;

    fs.writeFileSync('BeatsChain.sol', contractCode);
    
    console.log('🚀 Deploying with Thirdweb...');
    const result = await execCommand('npx thirdweb deploy BeatsChain.sol --network mumbai');
    
    // Clean up
    fs.unlinkSync('BeatsChain.sol');
    
    return result;
}

function updateEnvFile(contractAddress) {
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace mock contract address
    envContent = envContent.replace(
        /NEXT_PUBLIC_CONTRACT_ADDRESS=.*/,
        `NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log('📝 Updated .env file with new contract address');
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
    deployContract()
        .then(address => {
            console.log(`\n🎉 BeatsChain ready for production!`);
            console.log(`📦 Run 'npm run build' to update extension`);
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Deployment failed:', error);
            console.log('\n💡 Alternative: Use the current mock setup for contest submission');
            process.exit(1);
        });
}