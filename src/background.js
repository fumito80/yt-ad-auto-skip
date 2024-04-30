function setIcon(enabled) {
  const path = enabled ? 'icon48.png' : 'icon48-dis.png';
  chrome.action.setIcon({ path });
}

function setBadgeText(tabId, text = '') {
  chrome.action.setBadgeText({ tabId, text });
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') {
    return;
  }
  if (!tab.url?.startsWith('https://www.youtube.com/watch')) {
    return;
  }
  const msg = await chrome.tabs.sendMessage(tabId, { msg: 'exists' }).catch(() => ({}));
  /// #if mode == 'development'
  console.log('msg', msg);
  /// #endif
  if (msg?.exists) {
    return;
  }
  const promise = chrome.scripting.executeScript({
    target: { tabId },
    files: ['script.js'],
  });
});

chrome.runtime.onMessage.addListener(({ msg, value }, sender) => {
  if (msg === 'set-icon') {
    setIcon(value);
  }
  if (msg === 'set-badge-text') {
    setBadgeText(sender.tab.id, value);
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
    playbackRate: 2,
    exChannels: [],
  });
  setIcon(true);
});
