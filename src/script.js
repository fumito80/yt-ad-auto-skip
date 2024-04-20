// スキップボタン／親要素
const skipButtonParent = '.ytp-ad-skip-button-slot,.ytp-skip-ad-button';
// スキップボタン
const skipButton = '.ytp-ad-skip-button.ytp-button,.ytp-ad-skip-button-modern.ytp-button,.ytp-skip-ad-button';
// ミュートボタン
const muteButton = '.ytp-mute-button';
// ミュートボタンSVG
const mutedSvg = '.ytp-svg-volume-animation-speaker';
// AD module
const adMod = '.video-ads.ytp-ad-module';

function $(selector, doc = document) {
  return doc.querySelector(selector);
}

function isDisplay(target$) {
  return target$.style.getPropertyValue('display') !== 'none';
}

function isMuted() {
  // ミュートボタン
  return !$(mutedSvg);
}

function setObserver(target$, callback, filter) {
  const observer = (new MutationObserver(callback));
  observer.observe(target$, filter);
  return observer;
}

function mute(shouldMute) {
  const mute$ = $(muteButton);
  const muted = isMuted();
  /// #if mode == 'development'
  // eslint-disable-next-line no-console
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

function clickSkip() {
  $(skipButton)?.click();
}

async function readySkip() {
  mute(true);

  // スキップボタン親要素
  const target$ = $(skipButtonParent);

  if (!target$) {
    return undefined;
  }

  if (isDisplay(target$)) {
    clickSkip();
    return undefined;
  }

  return new Promise((resolve) => {
    let timer;
    const callback = ([record], observer) => {
      if (!isDisplay(record?.target)) {
        return;
      }
      clearTimeout(timer);
      observer.disconnect();
      clickSkip();
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
  // Ad module
  const $adModOuter = $(adMod);

  if (!$adModOuter) {
    if (isInit) {
      setTimeout(run, 3000);
    }
    return;
  }

  let muted = isMuted();

  if ($adModOuter.children.length > 0) {
    readySkip();
  }

  let defer = Promise.resolve(true);

  setObserver(
    $adModOuter,
    ([record]) => {
      if (!record?.addedNodes?.length) {
        if (!muted) {
          mute(false);
        }
        defer = defer.then(() => true);
        return;
      }
      /// #if mode == 'development'
      // eslint-disable-next-line no-console
      console.log('observe', (new Date()).toLocaleTimeString(), defer);
      /// #endif
      defer = defer.then((restart) => {
        if (!restart) {
          return undefined;
        }
        muted = isMuted();
        return readySkip();
      });
    },
    { childList: true },
  );
}

if (!window.scripting) {
  window.scripting = 'done';
  run(true);
}
