# 🚀 BeatsChain Contract Deployment Guide

## Method 1: Thirdweb Dashboard (Recommended)

### Step 1: Access Thirdweb Dashboard
1. Go to [thirdweb.com/dashboard](https://thirdweb.com/dashboard)
2. Connect your wallet (MetaMask recommended)
3. Switch to **Polygon Mumbai** testnet

### Step 2: Deploy NFT Collection
1. Click **"Deploy new contract"**
2. Search for **"NFT Collection"** or **"ERC721"**
3. Select **"NFT Collection"** template
4. Fill in details:
   ```
   Name: BeatsChain Music NFTs
   Symbol: BEATS
   Description: Music NFTs with AI-generated licensing
   Royalty: 2.5% (250 basis points)
   ```

### Step 3: Configure Contract
- **Network**: Polygon Mumbai (Chain ID: 80001)
- **Primary Sales Recipient**: Your wallet address
- **Royalty Recipient**: Your wallet address
- **Platform Fee**: 0%

### Step 4: Deploy & Update Extension
1. Click **"Deploy Now"**
2. Confirm transaction in MetaMask
3. Copy the contract address
4. Update `.env` file:
   ```env
   NEXT_PUBLIC_CONTRACT_ADDRESS=YOUR_NEW_CONTRACT_ADDRESS
   ```

## Method 2: Quick CLI Deployment

Run the deployment script:
```bash
node deploy-real-contract.js
```

## Method 3: Manual Contract Creation

If both methods fail, use this minimal contract:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BeatsChainMusicNFTs is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    constructor() ERC721("BeatsChain Music NFTs", "BEATS") {}

    function mint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function tokenURI(uint256 tokenId) 
        public view override(ERC721, ERC721URIStorage) 
        returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721URIStorage)
        returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
```

Deploy this on [Remix IDE](https://remix.ethereum.org/) to Mumbai testnet.

## 🎯 Quick Test After Deployment

1. Update contract address in `.env`
2. Run `npm run build`
3. Load extension in Chrome
4. Test minting with a small audio file
5. Verify transaction on [Mumbai PolygonScan](https://mumbai.polygonscan.com/)

## 💰 Requirements

- **Mumbai MATIC**: Get free testnet tokens from [Polygon Faucet](https://faucet.polygon.technology/)
- **MetaMask**: Add Mumbai network if not already added
- **Thirdweb Account**: Free account at thirdweb.com

## 🚨 Fallback Option

If deployment fails, your current mock setup works perfectly for the contest! The extension demonstrates all features without requiring real blockchain transactions.

**For contest submission**: The simulation is actually better because it always works and shows all Chrome AI features! 🏆