// BeatsChain Service Worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'store_nft') {
    chrome.storage.local.get(['nft_history'], (result) => {
      const history = result.nft_history || [];
      history.unshift(request.data);
      chrome.storage.local.set({ nft_history: history.slice(0, 50) });
    });
  } else if (request.action === 'store_radio_submission') {
    chrome.storage.local.get(['radio_submissions'], (result) => {
      const history = result.radio_submissions || [];
      history.unshift(request.data);
      chrome.storage.local.set({ radio_submissions: history.slice(0, 50) });
    });
  } else if (request.action === 'get_nft_history') {
    chrome.storage.local.get(['nft_history'], (result) => {
      sendResponse({ data: result.nft_history || [] });
    });
    return true;
  } else if (request.action === 'get_radio_history') {
    chrome.storage.local.get(['radio_submissions'], (result) => {
      sendResponse({ data: result.radio_submissions || [] });
    });
    return true;
  }
});