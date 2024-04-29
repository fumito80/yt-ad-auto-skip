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

function setIcon(enabled) {
  const path = enabled ? 'icon48.png' : 'icon48-dis.png';
  chrome.action.setIcon({ path });
}

chrome.runtime.onMessage.addListener(({ msg, value }) => {
  if (msg === 'set-icon') {
    setIcon(value);
  }
});

chrome.storage.local.get().then(({ enabled }) => {
  if (enabled != null) {
    setIcon(enabled);
    return;
  }
  chrome.storage.local.set({
    enabled: true,
    mute: true,
    skip: true,
    playbackRate: 16,
    exChannels: [],
  });
  setIcon(true);
});
