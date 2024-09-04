const targetUrl = 'https://www.youtube.com/watch';

function setIcon(enabled) {
  const path = enabled ? 'icon48.png' : 'icon48-dis.png';
  chrome.action.setIcon({ path });
}

function setBadgeText(tabId, text = '') {
  chrome.action.setBadgeText({ tabId, text });
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url?.startsWith(targetUrl)) {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['prescript.js'],
      world: 'MAIN',
    });
    return;
  }
  if (changeInfo.status !== 'complete') {
    return;
  }
  if (!tab.url?.startsWith(targetUrl)) {
    setBadgeText(tabId);
    return;
  }
  const msg = await chrome.tabs.sendMessage(tabId, { msg: 'exists' }).catch(() => ({}));
  /// #if mode == 'development'
  console.log('msg', msg);
  /// #endif
  if (msg?.exists) {
    return;
  }
  chrome.scripting.executeScript({
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
  if (enabled == null) {
    chrome.storage.local.set({
      enabled: true,
      mute: true,
      skip: true,
      playbackRate: 1,
      exChannels: [],
    });
  }
  setIcon(enabled == null || enabled);
});

chrome.action.setBadgeTextColor({ color: '#222222' });
chrome.action.setBadgeBackgroundColor({ color: 'aliceblue' });
