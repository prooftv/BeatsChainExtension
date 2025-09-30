
// === background/service-worker.js ===
// BeatsChain Background Service Worker
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
            storeNFTData(request.data);
            sendResponse({ success: true });
            break;
        case 'get_nfts':
            getNFTData().then(sendResponse);
            return true;
        case 'increment_ai_usage':
            incrementAIUsage();
            sendResponse({ success: true });
            break;
        default:
            sendResponse({ error: 'Unknown action' });
    }
});

async function storeNFTData(nftData) {
    try {
        const result = await chrome.storage.local.get(['user_nfts']);
        const nfts = result.user_nfts || [];
        nfts.push({...nftData, timestamp: Date.now()});
        await chrome.storage.local.set({ 'user_nfts': nfts });
    } catch (error) {
        console.error('Failed to store NFT data:', error);
    }
}

async function getNFTData() {
    try {
        const result = await chrome.storage.local.get(['user_nfts']);
        return { nfts: result.user_nfts || [] };
    } catch (error) {
        return { nfts: [] };
    }
}

async function incrementAIUsage() {
    try {
        const result = await chrome.storage.local.get(['ai_usage_count']);
        const count = (result.ai_usage_count || 0) + 1;
        await chrome.storage.local.set({ 'ai_usage_count': count });
    } catch (error) {
        console.error('Failed to increment AI usage:', error);
    }
}

chrome.alarms.create('cleanup', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'cleanup') {
        cleanupOldData();
    }
});

async function cleanupOldData() {
    try {
        const result = await chrome.storage.local.get(['user_nfts']);
        const nfts = result.user_nfts || [];
        if (nfts.length > 100) {
            const recentNFTs = nfts.slice(-100);
            await chrome.storage.local.set({ 'user_nfts': recentNFTs });
        }
    } catch (error) {
        console.error('Cleanup failed:', error);
    }
}
