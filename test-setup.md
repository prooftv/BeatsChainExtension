# BeatsChain Extension Testing Setup
**Date:** 2025-01-23 09:47  
**Context:** Quick testing guide for MVP functionality

## 🚀 Quick Start Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Extension
```bash
npm run build
```

### 3. Load in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the BeatsChain extension folder
5. Extension should appear in toolbar

### 4. Test Chrome AI APIs
**Requirements:**
- Chrome Canary (latest version)
- Enable AI flags: `chrome://flags/#optimization-guide-on-device-model`
- Restart Chrome after enabling flags

### 5. Test Workflow
1. **Upload Test**: Use any MP3/WAV file
2. **AI Generation**: Click "Generate with AI" 
3. **Mock Minting**: Will show success without actual blockchain transaction

## 🧪 Test Files Needed

### Audio Files
- `test-beat.mp3` (any music file)
- `test-beat.wav` (for format testing)

### Thirdweb Setup
1. Create account at thirdweb.com
2. Deploy NFT contract on Mumbai testnet
3. Copy contract address to `.env`

## 🔧 Development Mode

### File Structure Check
```
BeatsChainExtention/
├── manifest.json ✅
├── popup/
│   ├── index.html ✅
│   ├── popup.js ✅
│   └── popup.css ✅
├── background/
│   └── service-worker.js ✅
├── lib/
│   ├── chrome-ai.js ✅
│   └── thirdweb.js ✅
└── package.json ✅
```

### Next Steps
1. Test basic extension loading
2. Verify AI API availability
3. Test file upload flow
4. Setup Thirdweb credentials
5. End-to-end testing

## 🎯 MVP Success Criteria
- ✅ Extension loads without errors
- ✅ File upload works
- ✅ AI generates licensing text
- ✅ UI flows between sections
- 🔄 Thirdweb integration (needs credentials)
- 🔄 Actual NFT minting (needs testnet setup)