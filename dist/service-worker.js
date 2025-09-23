// BeatsChain Background Service Worker - Minimal Version
chrome.runtime.onInstalled.addListener(() => {
    console.log('BeatsChain extension installed');
    
    chrome.storage.local.set({
        'beatschain_initialized': true,
        'user_nfts': [],
        'ai_usage_count': 0
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case 'store_nft':
            chrome.storage.local.get(['user_nfts'], (result) => {
                const nfts = result.user_nfts || [];
                nfts.push({ ...request.data, timestamp: Date.now() });
                chrome.storage.local.set({ 'user_nfts': nfts });
                sendResponse({ success: true });
            });
            return true;
            
        case 'get_nfts':
            chrome.storage.local.get(['user_nfts'], (result) => {
                sendResponse({ nfts: result.user_nfts || [] });
            });
            return true;
            
        default:
            sendResponse({ error: 'Unknown action' });
    }
});