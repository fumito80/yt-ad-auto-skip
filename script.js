function $(selector, doc = document) {
  return doc.querySelector(selector);
}

const mask$ = document.body.appendChild(document.createElement('div'));
Object.assign(mask$.style, {
  width: '100svw',
  height: '100svb',
  'background-color': 'rgba(0, 0, 0, 0.8)',
  position: 'fixed',
  display: 'none',
});

function isDisplay(target) {
  return target.style.getPropertyValue('display') !== 'none';
}

function setObserver(target$, callback, filter) {
  (new MutationObserver(callback)).observe(target$, filter);
}

function mute(shouldMute) {
  const mute$ = $('.ytp-mute-button');
  const muted = !$('.ytp-svg-volume-animation-speaker', mute$);
  if (!shouldMute) {
    if (muted) {
      mute$.click();
    }
    mask$.style.display = 'none';
    return;
  }
  if (!muted) {
    mute$.click();
  }
  mask$.style.display = 'unset';
}

function clickSkip() {
  const $skip = $('.ytp-ad-skip-button.ytp-button,.ytp-ad-skip-button-modern.ytp-button');
  $skip?.click();
}

function readySkip(shuoldObserve) {

  const target$ = $('.ytp-ad-skip-button-slot');

  console.info(`readySkip: shuoldObserve: ${shuoldObserve}, target: ${!!target$}`);

  const callback = ([record], observer) => {
    console.info(`callback: readySkip`);
    if (!isDisplay(record?.target)) {
      return;
    }
    observer.disconnect();
    clickSkip();
  }

  const filter = {
    attributes: true,
    attributeFilter: ['style'],
  };

  if (target$) {
    if (isDisplay(target$)) {
      clickSkip();
    } else if (shuoldObserve) {
      setObserver(target$, callback, filter);
    }
  }
}

const $adModOuter = $('.video-ads.ytp-ad-module');

if ($adModOuter) {

  setObserver(
    $adModOuter,
    ([record]) => {
      console.info(`callback: 1st: addNodes.length: ${record?.addedNodes?.length}`);
      if (!record?.addedNodes?.length) {
        mute(false);
        return;
      }
      mute(true);
      readySkip(true);
    },
    {
      childList: true,
    },
  );
}

readySkip();
