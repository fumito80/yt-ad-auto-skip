function $(selector, doc = document) {
  return doc.querySelector(selector);
}

function isDisplay(target$) {
  return target$.style.getPropertyValue('display') !== 'none';
}

function isMuted() {
  return !$('.ytp-svg-volume-animation-speaker');
}

function setObserver(target$, callback, filter) {
  const observer = (new MutationObserver(callback));
  observer.observe(target$, filter);
  return observer;
}

function mute(shouldMute) {
  const mute$ = $('.ytp-mute-button');
  const muted = isMuted();
  /// #if mode == 'DEBUG'
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

function getSkipButton() {
  return $('.ytp-ad-skip-button-slot');
}

function clickSkip() {
  const $skip = $('.ytp-ad-skip-button.ytp-button,.ytp-ad-skip-button-modern.ytp-button');
  $skip?.click();
}

function readySkip() {
  mute(true);

  const target$ = getSkipButton();

  if (!target$) {
    return;
  }

  if (isDisplay(target$)) {
    clickSkip();
    return;
  }

  let timer;
  const callback = ([record], observer) => {
    if (!isDisplay(record?.target)) {
      return;
    }
    clearTimeout(timer);
    observer.disconnect();
    clickSkip();
  };

  const filter = {
    attributes: true,
    attributeFilter: ['style'],
  };

  const observer = setObserver(target$, callback, filter);
  timer = setTimeout(() => observer.disconnect(), 10000);
}

function run(isInit) {
  const $adModOuter = $('.video-ads.ytp-ad-module');

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

  let defer = Promise.resolve();

  setObserver(
    $adModOuter,
    ([record]) => {
      if (!record?.addedNodes?.length) {
        if (!muted) {
          mute(false);
        }
        return;
      }
      /// #if mode == 'DEBUG'
      const t = new Date();
      // eslint-disable-next-line no-console
      console.log('observe', t.toLocaleTimeString(), t.getMilliseconds());
      /// #endif
      defer = defer.then((done) => new Promise((resolve) => {
        if (done) {
          resolve(true);
          return;
        }
        muted = isMuted();
        readySkip();
        setTimeout(() => {
          resolve(true);
          defer = Promise.resolve();
        }, 500);
      }));
    },
    { childList: true },
  );
}

if (!window.scripting) {
  window.scripting = 'done';
  run(true);
}
