// AD module
const adMod = 'ytp-ad-module';
// ミュートボタン
const muteButton = 'ytp-mute-button';

const promiseChannel = Promise.withResolvers();

function $c(className, doc = document) {
  return doc.getElementsByClassName(className ?? '')[0];
}

function $q(className, doc = document) {
  return doc.querySelector(className ?? '');
}

function isDisplayNone(target$) {
  return target$?.style.getPropertyValue('display') === 'none';
}

function getVideoEl() {
  return $c('html5-main-video');
}

function setPlaybackRate(rate) {
  getVideoEl().playbackRate = rate;
}

function getPlaybackRate() {
  return getVideoEl().playbackRate;
}

function getSkipButton() {
  const className = [...$c(adMod).getElementsByTagName('button')]
    .flatMap((btn) => [...btn.classList])
    .find((n) => n.includes('skip'));
  return $c(className);
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
  const mute$ = $c(muteButton);
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
  if (!target$) {
    return {};
  }
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
  const [channelImg$, channelInfo$] = document.querySelectorAll('ytd-video-owner-renderer a');
  if (!channelImg$) {
    return {};
  }
  const img = channelImg$?.querySelector('img').src;
  const title = channelInfo$.textContent;
  const [, channelId] = /(?<=\/)([^/]+$)/.exec(channelImg$.href) || [];
  return { channelId, title, img };
}

async function checkExcludeChannel(exChannels) {
  const channelInfo = await promiseChannel.promise;
  const result = exChannels.some(([id]) => id === channelInfo.channelId);
  /// #if mode == 'development'
  console.log('checkExcludeChannel', result, channelInfo);
  /// #endif
  return result;
}

async function setBadge() {
  const channelInfo = getChannelInfo();
  if (!channelInfo.channelId) {
    return;
  }
  promiseChannel.resolve(channelInfo);
  promiseChannel.promise = promiseChannel.promise.then(() => channelInfo);
  const options = await getOptions();
  const isExcludeChannel = options.exChannels.some(([id]) => id === channelInfo.channelId);
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

function setChannelObserver(retries = 0) {
  const pageManager$ = $q('ytd-page-manager');
  if (!pageManager$) {
    if (retries < 8) {
      setTimeout(() => setChannelObserver(retries + 1), 500);
    }
    return;
  }
  setObserver(pageManager$, (_, observerPageManager) => {
    /// #if mode == 'development'
    console.log('Observe 1');
    /// #endif
    if (!isWatchPage()) {
      return;
    }
    const watchMetadata$ = $q('ytd-watch-metadata');
    if (!watchMetadata$) {
      return;
    }
    observerPageManager.disconnect();
    setObserver(watchMetadata$, (__, observerWatchMetadata) => {
      /// #if mode == 'development'
      console.log('Observe 2');
      /// #endif
      const formattedString$ = $q('ytd-video-owner-renderer #img');
      if (!formattedString$) {
        return;
      }
      observerWatchMetadata.disconnect();
      setObserver(formattedString$, () => {
        /// #if mode == 'development'
        console.log('setBadge 1');
        /// #endif
        setBadge();
      }, {
        attributes: true,
        attributeFilter: ['src'],
      });
      const watchFlexy$ = $q('ytd-watch-flexy');
      setObserver(watchFlexy$, () => {
        if (watchFlexy$.hasAttribute('hidden')) {
          return;
        }
        /// #if mode == 'development'
        console.log('setBadge 2');
        /// #endif
        setBadge();
      }, {
        attributes: true,
        attributeFilter: ['hidden'],
      });
      if (formattedString$.src) {
        /// #if mode == 'development'
        console.log('setBadge 0');
        /// #endif
        setBadge();
      }
    }, {
      childList: true,
      subtree: true,
    });
  }, {
    childList: true,
    subtree: true,
  });
}

async function run(retries = 0) {
  /// #if mode == 'development'
  console.log('run');
  /// #endif

  // Ad module
  const adMod$ = $c(adMod);

  if (!adMod$) {
    if (retries < 8) {
      setTimeout(() => run(retries + 1), 500);
    }
    return;
  }

  let muted = isMuted();
  let defer = Promise.resolve(true);
  let playbackRate = getPlaybackRate();
  let options = await getOptions();

  setChannelObserver();

  let isExcludeChannel = await checkExcludeChannel(options.exChannels);

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
      isExcludeChannel = await checkExcludeChannel(options.exChannels);
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
}

chrome.runtime.onMessage.addListener(({ msg }, __, sendResponse) => {
  if (msg === 'get-channel-info') {
    if (!isWatchPage()) {
      sendResponse({});
      return false;
    }
    promiseChannel.promise.then(sendResponse);
    return true;
  }
  if (msg === 'exists') {
    sendResponse({ exists: true });
  }
  return false;
});

/// #if mode == 'development'
console.log('window.scripting', window.scripting);
/// #endif

if (!window.scripting) {
  window.scripting = 'done';
  run();
}
