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
  const $skip = $('.ytp-ad-skip-button.ytp-button,.ytp-ad-skip-button-modern.ytp-button');
  $skip?.click();
}

function readySkip() {
  const target$ = $('.ytp-ad-skip-button-slot');

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

  if ($adModOuter.children.length > 0) {
    mute(true);
    readySkip();
  }

  let muted = isMuted();

  setObserver(
    $adModOuter,
    ([record]) => {
      if (!record?.addedNodes?.length) {
        if (!muted) {
          mute(false);
        }
        return;
      }
      muted = isMuted();
      mute(true);
      readySkip();
    },
    { childList: true },
  );
}

chrome.runtime.onMessage.addListener((_, __, sendMessage) => {
  sendMessage({ msg: 'done' });
});

if (!window.scripting) {
  run(true);
}

window.scripting = 'done';
