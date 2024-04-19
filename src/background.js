chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') {
    return;
  }
  if (!tab.url?.startsWith('https://www.youtube.com/watch')) {
    return;
  }
  chrome.scripting.executeScript({
    target: { tabId },
    files: ['script.js'],
  });
});
