chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') {
    return;
  }
  if (!tab.url?.startsWith('https://www.youtube.com/watch')) {
    return;
  }
  const { msg } = await chrome.tabs.sendMessage(tabId, {}).catch(() => ({}));
  if (msg === 'done') {
    /// #if mode == 'development'
    console.log('msg', msg);
    /// #endif
    return;
  }
  const promise = chrome.scripting.executeScript({
    target: { tabId },
    files: ['script.js'],
  });
  /// #if mode == 'development'
  promise.then((result) => console.log('executeScript: result', result));
  /// #endif
});
