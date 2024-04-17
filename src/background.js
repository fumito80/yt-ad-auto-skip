chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  const url = changeInfo.url || await chrome.tabs.get(tabId).then((tab) => tab.url);
  if (url?.startsWith('https://www.youtube.com/watch')) {
    const { msg } = await chrome.tabs.sendMessage(tabId, {}).catch(() => ({}));
    if (msg === 'done') {
      return;
    }
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['script.js'],
    });
  }
});
