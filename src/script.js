// AD module
const adMod = 'ytp-ad-module';
// ミュートボタン
const muteButton = 'ytp-mute-button';

function $(className, doc = document) {
  return doc.getElementsByClassName(className ?? '')[0];
}

function isDisplayNone(target$) {
  return target$?.style.getPropertyValue('display') === 'none';
}

function getVideoEl() {
  return $('html5-main-video');
}

function setPlaybackRate(rate) {
  getVideoEl().playbackRate = rate;
}

function getPlaybackRate() {
  return getVideoEl().playbackRate;
}

function getSkipButton() {
  const className = [...$(adMod).getElementsByTagName('button')]
    .flatMap((btn) => [...btn.classList])
    .find((n) => n.includes('skip'));
  return $(className);
}

function getVisibilityParent(target$) {
  if (!target$) {
    return undefined;
  }
  if (isDisplayNone(target$)) {
    return target$;
  }
  return getVisibilityParent(target$.parentElement);
}

function isMuted() {
  return getVideoEl().muted;
}

function mute(shouldMute) {
  const mute$ = $(muteButton);
  const muted = isMuted();
  /// #if mode == 'development'
  console.log('mute', { shouldMute, muted });
  /// #endif
  if (shouldMute) {
    if (!muted) {
      mute$.click();
    }
    return;
  }
  if (muted) {
    mute$.click();
  }
}

function setObserver(target$, callback, filter) {
  const observer = (new MutationObserver(callback));
  observer.observe(target$, filter);
  return observer;
}

function isWatchPage() {
  return document.URL.startsWith('https://www.youtube.com/watch');
}

async function getOptions() {
  return chrome.storage.local.get();
}

function getChannelInfo() {
  let title;
  let channelId$;
  const [channelImg$, channelInfo1$] = document.querySelectorAll('ytd-video-owner-renderer a');
  const img = channelImg$?.querySelector('img').src;
  if (channelInfo1$) {
    channelId$ = channelImg$;
    title = channelInfo1$.textContent;
    // } else if (is1stTime) {
    //   const channelInfo2$ = document.querySelector('[itemprop="author"]');
    //   channelId$ = channelInfo2$?.querySelector('[itemprop="url"]');
    //   title = channelInfo2$?.querySelector('[itemprop="name"]')?.getAttribute('content');
  }
  const [, channelId] = /(?<=\/)([^/]+$)/.exec(channelId$?.href) || [];
  return { channelId, title, img };
}

function checkExcludeChannel(exChannels) {
  const channelInfo = getChannelInfo();
  const result = exChannels.some(([id]) => id === channelInfo.channelId);
  /// #if mode == 'development'
  console.log('checkExcludeChannel', result, channelInfo);
  /// #endif
  return result;
}

async function setBadge() {
  const options = await getOptions();
  if (!options.enabled) {
    return;
  }
  const isExcludeChannel = checkExcludeChannel(options.exChannels);
  chrome.runtime.sendMessage({ msg: 'set-badge-text', value: isExcludeChannel ? 'Ex' : '' });
}

async function readySkip(options) {
  if (options.mute) mute(true);

  setPlaybackRate(options.playbackRate ?? 1);

  if (!options.skip) {
    return undefined;
  }

  const skipButton$ = getSkipButton();
  // スキップボタン／親要素
  const target$ = getVisibilityParent(skipButton$);

  if (!target$) {
    return undefined;
  }

  if (!isDisplayNone(target$)) {
    skipButton$.click();
    return undefined;
  }

  return new Promise((resolve) => {
    let timer;
    const callback = ([record], observer) => {
      if (isDisplayNone(record?.target)) {
        return;
      }
      clearTimeout(timer);
      observer.disconnect();
      skipButton$.click();
      resolve();
    };

    const filter = {
      attributes: true,
      attributeFilter: ['style'],
    };

    const observer = setObserver(target$, callback, filter);
    timer = setTimeout(() => {
      observer.disconnect();
      resolve();
    }, 10000);
  });
}

async function run(retrys) {
  /// #if mode == 'development'
  console.log('run');
  /// #endif

  // Ad module
  const adMod$ = $(adMod);

  if (!adMod$) {
    if (retrys < 5) {
      setTimeout(() => run(retrys + 1), 1000);
    }
    return;
  }

  let muted = isMuted();
  let defer = Promise.resolve(true);
  let playbackRate = getPlaybackRate();
  let options = await getOptions();
  let isExcludeChannel = checkExcludeChannel(options.exChannels);

  /// #if mode == 'development'
  console.log('isExcludeChannel', isExcludeChannel);
  /// #endif

  if (adMod$.children.length > 0 && options.enabled && !isExcludeChannel) {
    readySkip(options);
    /// #if mode == 'development'
    console.log('adMod$.children.length > 0');
    /// #endif
  }

  setObserver(
    adMod$,
    async ([record]) => {
      if (!record?.addedNodes?.length) {
        setPlaybackRate(playbackRate);
        if (!muted) {
          mute(false);
        }
        defer = defer.then(() => true);
        return;
      }
      /// #if mode == 'development'
      console.log('observe', (new Date()).toLocaleTimeString(), defer);
      /// #endif
      options = await getOptions();
      if (!options.enabled) {
        return;
      }
      isExcludeChannel = checkExcludeChannel(options.exChannels);
      if (isExcludeChannel) {
        return;
      }
      defer = defer.then((restart) => {
        if (!restart) {
          return undefined;
        }
        muted = isMuted();
        playbackRate = getPlaybackRate();
        return readySkip(options);
      });
    },
    { childList: true },
  );

  const pageManager$ = document.querySelector('ytd-page-manager');
  setObserver(pageManager$, async ([record]) => {
    if (record?.addedNodes?.length) {
      if (!isWatchPage()) {
        return;
      }
      const watchFlrxy$ = document.querySelector('ytd-watch-flexy');
      setObserver(watchFlrxy$, async ([record2]) => {
        if (record2.target && !record2.target.hasAttribute('hidden')) {
          /// #if mode == 'development'
          console.log('setBadge 1');
          /// #endif
          setBadge();
        }
      }, {
        childList: true,
        // attributes: true,
        // attributeFilter: ['hidden'],
      });

      const watchMetadata$ = document.querySelector('ytd-watch-metadata');
      if (watchMetadata$.children.length) {
        /// #if mode == 'development'
        console.log('setBadge 2');
        /// #endif
        setBadge();
      }
      setObserver(watchMetadata$, async ([record2]) => {
        /// #if mode == 'development'
        console.log('setBadge 3');
        /// #endif
        setBadge();
      }, {
        childList: true,
      });
    }
  }, { childList: true });
}

chrome.runtime.onMessage.addListener(({ msg }, __, sendResponse) => {
  if (msg === 'get-channel-info') {
    if (!isWatchPage()) {
      sendResponse({});
      return;
    }
    const channelInfo = getChannelInfo();
    sendResponse(channelInfo);
    return;
  }
  if (msg === 'exists') {
    sendResponse({ exists: true });
  }
});

/// #if mode == 'development'
console.log('window.scripting', window.scripting);
/// #endif

if (!window.scripting) {
  window.scripting = 'done';
  run(0);
}
