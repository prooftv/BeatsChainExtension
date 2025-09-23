# Thirdweb Infrastructure Setup Guide
**Date:** 2025-01-23 09:27  
**Context:** Complete Thirdweb integration setup for BeatsChain MVP

## 🚀 Thirdweb Setup Steps

### 1. Thirdweb Dashboard Setup
- Create account at [thirdweb.com](https://thirdweb.com)
- Create new project: "BeatsChain"
- Choose network: **Polygon Mumbai** (testnet) or **Base Sepolia**
- Deploy NFT Collection contract (ERC-721)

### 2. Contract Configuration
```javascript
// NFT Collection Settings
{
  name: "BeatsChain Music NFTs",
  symbol: "BEATS",
  description: "Music NFTs with AI-generated licensing",
  image: "ipfs://...", // BeatsChain logo
  external_link: "https://beatschain.app",
  seller_fee_basis_points: 250, // 2.5% royalty
  fee_recipient: "0x..." // Your wallet address
}
```

### 3. Required Environment Variables
```env
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id
NEXT_PUBLIC_THIRDWEB_SECRET_KEY=your_secret_key
NEXT_PUBLIC_CONTRACT_ADDRESS=your_nft_contract_address
NEXT_PUBLIC_CHAIN_ID=80001 # Mumbai testnet
```

## 📦 Project Structure Setup

### Chrome Extension Structure
```
BeatsChainExtention/
├── manifest.json
├── popup/
│   ├── index.html
│   ├── popup.js
│   └── popup.css
├── background/
│   └── service-worker.js
├── lib/
│   ├── thirdweb.js
│   ├── chrome-ai.js
│   └── storage.js
├── assets/
│   ├── icons/
│   └── images/
└── package.json
```

## 🔧 Initial Setup Commands

### 1. Initialize Project
```bash
npm init -y
npm install @thirdweb-dev/sdk @thirdweb-dev/storage
npm install --save-dev webpack webpack-cli
```

### 2. Key Dependencies
- `@thirdweb-dev/sdk` - Core blockchain interactions
- `@thirdweb-dev/storage` - IPFS metadata storage
- Chrome Extensions API (built-in)
- Chrome AI APIs (built-in)

## 🎯 MVP Implementation Priority

### Phase 1: Basic Extension
1. Create manifest.json (MV3)
2. Setup popup UI structure
3. Integrate Thirdweb SDK
4. Test basic NFT minting

### Phase 2: AI Integration
1. Chrome AI APIs setup
2. Licensing generation workflow
3. Metadata enhancement

### Phase 3: Authentication
1. Google Sign-In integration
2. Wallet management
3. WalletConnect fallback

## 🧪 Testing Strategy
- **Testnet**: Polygon Mumbai for development
- **Mock Data**: Sample audio files and metadata
- **AI Testing**: Chrome Canary with AI flags enabled
- **Extension Testing**: Chrome Developer Mode