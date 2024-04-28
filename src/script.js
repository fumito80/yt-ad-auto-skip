chrome.runtime.onMessage.addListener((_, __, sendMessage) => {
  sendMessage({ msg: 'done' });
});

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

async function readySkip() {
  mute(true);
  setPlaybackRate(16);

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

function run(isInit) {
  /// #if mode == 'development'
  console.log('run');
  /// #endif

  // Ad module
  const adMod$ = $(adMod);

  if (!adMod$) {
    if (isInit) {
      setTimeout(run, 1000);
    }
    return;
  }

  let muted = isMuted();
  let defer = Promise.resolve(true);
  let playbackRate = getPlaybackRate();

  if (adMod$.children.length > 0) {
    readySkip();
    /// #if mode == 'development'
    console.log('adMod$.children.length > 0');
    /// #endif
  }

  setObserver(
    adMod$,
    ([record]) => {
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
      defer = defer.then((restart) => {
        if (!restart) {
          return undefined;
        }
        muted = isMuted();
        playbackRate = getPlaybackRate();
        return readySkip();
      });
    },
    { childList: true },
  );
}

/// #if mode == 'development'
console.log('window.scripting', window.scripting);
/// #endif

if (!window.scripting) {
  window.scripting = 'done';
  run(true);
}
