#!/usr/bin/env node

/**
 * BeatsChain Infrastructure Setup Script
 * Helps configure Thirdweb and Google OAuth2 credentials
 */

const fs = require('fs');
const path = require('path');

console.log('🎵 BeatsChain Infrastructure Setup');
console.log('=====================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');
const envProductionPath = path.join(__dirname, '.env.production');

if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file from template...');
    
    if (fs.existsSync(envProductionPath)) {
        fs.copyFileSync(envProductionPath, envPath);
        console.log('✅ .env file created from .env.production template');
    } else if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
        console.log('✅ .env file created from .env.example template');
    } else {
        // Create basic .env file
        const basicEnv = `# BeatsChain Environment Configuration
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id_here
NEXT_PUBLIC_THIRDWEB_SECRET_KEY=your_thirdweb_secret_key_here
NEXT_PUBLIC_CONTRACT_ADDRESS=0x742d35Cc6634C0532925a3b8D0C9964E5Bfe4d4B
NEXT_PUBLIC_CHAIN_ID=80001
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
`;
        fs.writeFileSync(envPath, basicEnv);
        console.log('✅ Basic .env file created');
    }
} else {
    console.log('✅ .env file already exists');
}

console.log('\n🔧 Setup Instructions:');
console.log('======================\n');

console.log('1. 🌐 THIRDWEB SETUP:');
console.log('   • Go to https://thirdweb.com');
console.log('   • Create account and new project');
console.log('   • Deploy NFT Collection contract on Polygon Mumbai');
console.log('   • Copy Client ID and Secret Key to .env file');
console.log('   • Update CONTRACT_ADDRESS in .env file\n');

console.log('2. 🔐 GOOGLE OAUTH2 SETUP:');
console.log('   • Go to https://console.cloud.google.com');
console.log('   • Create new project or select existing');
console.log('   • Enable Google Identity API');
console.log('   • Create OAuth2 credentials');
console.log('   • Update GOOGLE_CLIENT_ID in .env file');
console.log('   • Update manifest.json with OAuth2 client ID\n');

console.log('3. 🚀 CHROME EXTENSION SETUP:');
console.log('   • Open Chrome Extensions (chrome://extensions/)');
console.log('   • Enable Developer Mode');
console.log('   • Click "Load unpacked"');
console.log('   • Select the dist/ folder');
console.log('   • Extension should load successfully\n');

console.log('4. 🧪 TESTING:');
console.log('   • Use Chrome Canary for Chrome AI APIs');
console.log('   • Enable chrome://flags/#optimization-guide-on-device-model');
console.log('   • Enable chrome://flags/#prompt-api-for-gemini-nano');
console.log('   • Test with sample audio files\n');

// Check current configuration
console.log('📊 Current Configuration Status:');
console.log('================================\n');

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    const hasThirdwebClientId = !envContent.includes('your_thirdweb_client_id_here');
    const hasThirdwebSecret = !envContent.includes('your_thirdweb_secret_key_here');
    const hasGoogleClientId = !envContent.includes('your_google_client_id.apps.googleusercontent.com');
    
    console.log(`Thirdweb Client ID: ${hasThirdwebClientId ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`Thirdweb Secret Key: ${hasThirdwebSecret ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`Google OAuth2: ${hasGoogleClientId ? '✅ Configured' : '❌ Not configured'}`);
    
    // Check manifest.json
    const manifestPath = path.join(__dirname, 'dist', 'manifest.json');
    if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const hasOAuth2 = manifest.oauth2 && !manifest.oauth2.client_id.includes('YOUR_GOOGLE_CLIENT_ID');
        console.log(`Manifest OAuth2: ${hasOAuth2 ? '✅ Configured' : '❌ Not configured'}`);
    } else {
        console.log('Manifest OAuth2: ❌ manifest.json not found');
    }
    
    console.log('\n🎯 Next Steps:');
    if (!hasThirdwebClientId || !hasThirdwebSecret) {
        console.log('• Complete Thirdweb setup and update .env file');
    }
    if (!hasGoogleClientId) {
        console.log('• Complete Google OAuth2 setup and update .env file');
        console.log('• Update manifest.json with OAuth2 client ID');
    }
    if (hasThirdwebClientId && hasThirdwebSecret && hasGoogleClientId) {
        console.log('• All credentials configured! Test the extension.');
    }
    
} catch (error) {
    console.log('❌ Error reading configuration:', error.message);
}

console.log('\n🆘 Need Help?');
console.log('=============');
console.log('• Check README.md for detailed instructions');
console.log('• Review setup documentation in docs/ folder');
console.log('• Ensure all dependencies are installed: npm install');
console.log('• Test with sample audio files in test-audio/ folder\n');

console.log('🎵 BeatsChain setup complete! Happy minting! 🚀');