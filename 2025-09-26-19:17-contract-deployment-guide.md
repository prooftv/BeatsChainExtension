# BeatsChain Contract Deployment Guide
**Date**: 2025-09-26 19:17  
**Purpose**: Deploy real NFT contract on Polygon Mumbai

## 🚀 **Quick Deployment Options**

### **Option 1: Thirdweb Dashboard** (Recommended - No Code)
1. Go to [thirdweb.com/dashboard](https://thirdweb.com/dashboard)
2. Click "Deploy new contract"
3. Select "NFT Collection" (ERC-721)
4. Fill in details:
   ```
   Name: BeatsChain Music NFTs
   Symbol: BEATS
   Description: Music NFTs with AI-generated licensing
   Royalty: 2.5%
   Network: Polygon Mumbai
   ```
5. Click "Deploy Now"
6. Copy the contract address
7. Update extension with new address

### **Option 2: Command Line** (Advanced)
```bash
# Install Thirdweb SDK
npm install @thirdweb-dev/sdk

# Run deployment script
node 2025-09-26-19:17-deploy-contract.js
```

## 💰 **Prerequisites**

### **Mumbai MATIC Required**
- **Amount needed**: ~0.01 MATIC for deployment
- **Get testnet MATIC**: https://faucet.polygon.technology/
- **Your wallet**: Connect MetaMask to Mumbai testnet

### **Network Setup**
```
Network Name: Polygon Mumbai
RPC URL: https://rpc-mumbai.maticvigil.com/
Chain ID: 80001
Currency: MATIC
Block Explorer: https://mumbai.polygonscan.com/
```

## 🔧 **After Deployment**

### **Update Extension**
1. Copy the new contract address
2. Update these files:
   ```javascript
   // In popup.js
   contractAddress: 'YOUR_NEW_CONTRACT_ADDRESS'
   
   // In .env
   NEXT_PUBLIC_CONTRACT_ADDRESS=YOUR_NEW_CONTRACT_ADDRESS
   ```

### **Test Real Minting**
1. Load updated extension
2. Upload audio file
3. Generate license
4. Mint NFT (will use real blockchain!)
5. Check transaction on PolygonScan

## 📊 **Contract Features**

### **BeatsChain NFT Collection**
- **Standard**: ERC-721 (NFT)
- **Network**: Polygon Mumbai Testnet
- **Royalties**: 2.5% on secondary sales
- **Metadata**: IPFS storage via Pinata
- **Features**: 
  - Mint music NFTs
  - Store licensing terms
  - Audio file references
  - Artist attribution

### **Smart Contract Functions**
- `mint()` - Create new music NFT
- `tokenURI()` - Get NFT metadata
- `royaltyInfo()` - Royalty information
- `ownerOf()` - Check NFT ownership

## 🎯 **Expected Results**

### **After Successful Deployment**
- ✅ Real contract address on Mumbai testnet
- ✅ Verifiable on PolygonScan
- ✅ Listed on OpenSea testnet
- ✅ Extension can mint real NFTs
- ✅ Transactions appear on blockchain

### **Contract Address Format**
```
0x1234567890abcdef1234567890abcdef12345678
```

## 🔍 **Verification Steps**

### **Check Contract is Live**
1. Visit: `https://mumbai.polygonscan.com/address/YOUR_CONTRACT_ADDRESS`
2. Should show contract details and transactions
3. Contract should be verified and readable

### **Test Minting**
1. Use extension to mint test NFT
2. Check transaction appears on PolygonScan
3. Verify NFT appears on OpenSea testnet

## 🆘 **Troubleshooting**

### **Common Issues**
- **Insufficient funds**: Get more Mumbai MATIC
- **Network error**: Check Mumbai RPC connection
- **Gas estimation failed**: Try again with higher gas limit

### **Support Resources**
- Thirdweb Discord: https://discord.gg/thirdweb
- Polygon Faucet: https://faucet.polygon.technology/
- Mumbai Explorer: https://mumbai.polygonscan.com/

## 🎵 **Ready to Deploy!**

Choose your preferred method and deploy the BeatsChain NFT contract. Once deployed, update the extension and you'll have real blockchain functionality! 🚀