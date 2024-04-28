import './popup.css';

function $(selector, doc = document) {
  return doc.querySelector(selector);
}

function $$(selector, doc = document) {
  return [...doc.querySelectorAll(selector)];
}

function setStorage(key, value) {
  chrome.storage.local.set({ [key]: value });
}

const promiseSettings = chrome.storage.local.get();

if (document.readyState === 'loding') {
  await new Promise((resolve) => {
    document.addEventListener('DOMContentLoaded', resolve);
  });
}

const {
  enabled, playbackRate, muted, skip,
} = (await promiseSettings) || {
  enabled: true,
  playbackRate: 16,
  muted: true,
  skip: true,
};

const appEnabled$ = $('.app-enabled');
const muted$ = $('.muted');
const skip$ = $('.skip');
const playbackRates$ = $$('[name="playback-rate"]');

appEnabled$.checked = enabled;
muted$.disabled = !enabled;
skip$.disabled = !enabled;

playbackRates$.forEach((el) => {
  // eslint-disable-next-line no-param-reassign
  el.disabled = !enabled;
  if (Number(el.value) === (playbackRate ?? 16)) {
    // eslint-disable-next-line no-param-reassign
    el.checked = true;
  }
  el.addEventListener('change', () => {
    const { value } = playbackRates$.find((el2) => el2.checked);
    setStorage('playbackRate', Number(value));
  });
});

appEnabled$.addEventListener('change', () => {
  setStorage('enabled', appEnabled$.checked);
  chrome.runtime.sendMessage({ msg: 'set-icon', value: appEnabled$.checked });
  muted$.disabled = !appEnabled$.checked;
  skip$.disabled = !appEnabled$.checked;
  playbackRates$.forEach((el) => {
    // eslint-disable-next-line no-param-reassign
    el.disabled = !appEnabled$.checked;
  });
});

muted$.checked = muted;
muted$.addEventListener('change', () => setStorage('muted', muted$.checked));

skip$.checked = skip;
skip$.addEventListener('change', () => setStorage('skip', skip$.checked));

setTimeout(() => document.body.classList.remove('initialize'), 200);
