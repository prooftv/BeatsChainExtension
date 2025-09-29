#!/usr/bin/env node

/**
 * Import Existing Contract to Thirdweb Dashboard
 * Use this if you already have a deployed contract
 */

const contractAddress = '0x8B7F8B2B8B7F8B2B8B7F8B2B8B7F8B2B8B7F8B2B';
const clientId = '0a51c6fdf5c54d8650380a82dd2b22ed';

console.log('📥 Importing Contract to Thirdweb Dashboard');
console.log('==========================================\n');

console.log('🔗 Contract Details:');
console.log(`Address: ${contractAddress}`);
console.log(`Network: Polygon Mumbai`);
console.log(`Client ID: ${clientId}\n`);

console.log('📋 Manual Import Steps:');
console.log('1. Go to https://thirdweb.com/dashboard');
console.log('2. Click "Import Contract"');
console.log(`3. Enter contract address: ${contractAddress}`);
console.log('4. Select network: Polygon Mumbai');
console.log('5. Contract should appear in your dashboard\n');

console.log('🌐 Direct Links:');
console.log(`Dashboard: https://thirdweb.com/dashboard`);
console.log(`Contract: https://thirdweb.com/mumbai/${contractAddress}`);
console.log(`Explorer: https://polygonscan.com/address/${contractAddress}\n`);

console.log('✅ After import, the contract will be visible in Thirdweb interface');
console.log('🎯 You can then manage NFTs, set permissions, and view analytics');

// Create a simple verification script
const verificationScript = `
// Verification script for Thirdweb
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { Mumbai } from "@thirdweb-dev/chains";

const sdk = ThirdwebSDK.fromReadOnlyRPC(Mumbai.rpc[0], Mumbai);
const contract = await sdk.getContract("${contractAddress}");

console.log("Contract Name:", await contract.call("name"));
console.log("Contract Symbol:", await contract.call("symbol"));
console.log("Total Supply:", await contract.call("totalSupply"));
`;

require('fs').writeFileSync('verify-contract.js', verificationScript);
console.log('📄 Created verify-contract.js for testing\n');