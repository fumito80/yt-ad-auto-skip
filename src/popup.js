/* eslint-disable no-param-reassign */
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

function setChangeListener(el$, storageKey, checked, disabled, addon) {
  if (disabled != null) {
    el$.disabled = disabled;
  }
  el$.checked = checked;
  el$.addEventListener('change', () => {
    setStorage(storageKey, el$.checked);
    if (addon) addon();
  });
}

const promiseSettings = chrome.storage.local.get();

const appEnabled$ = $('.app-enabled');
const mute$ = $('.mute');
const skip$ = $('.skip');
const playbackRates$ = $$('[name="playback-rate"]');
const channels$ = $('.ex-channels');

const {
  enabled, playbackRate, mute, skip, exChannels,
} = await promiseSettings;

setChangeListener(appEnabled$, 'enabled', enabled, undefined, () => {
  chrome.runtime.sendMessage({ msg: 'set-icon', value: appEnabled$.checked });
  mute$.disabled = !appEnabled$.checked;
  skip$.disabled = !appEnabled$.checked;
  playbackRates$.forEach((el) => {
    el.disabled = !appEnabled$.checked;
  });
});
setChangeListener(mute$, 'mute', mute, !enabled);
setChangeListener(skip$, 'skip', skip, !enabled);

playbackRates$.forEach((el) => {
  el.disabled = !enabled;
  el.checked = Number(el.value) === playbackRate;
  el.addEventListener('change', () => {
    const { value } = playbackRates$.find((el2) => el2.checked);
    setStorage('playbackRate', Number(value));
  });
});

setTimeout(() => $('main').classList.remove('initialize'), 200);

function createChannelEl([id, title, img]) {
  const item = document.createElement('div');
  item.id = id;
  item.textContent = title;
  item.title = title;
  item.style.backgroundImage = `url(${img})`;
  const btn = item.appendChild(document.createElement('button'));
  btn.innerHTML = '&times;';
  btn.classList.add('btn', 'btn-sm', 'btn-danger');
  btn.title = 'Remove channel';
  return item;
}

function makeExChannels(channels) {
  channels$.innerHTML = '';
  channels$.append(...channels.map(createChannelEl));
}

makeExChannels(exChannels);

async function saveChannels(currentChannels, excludeId, addChannels = []) {
  const newChannels = [...addChannels, ...currentChannels.filter(([id]) => id !== excludeId)];
  return chrome.storage.local.set({ exChannels: newChannels }).then(() => newChannels);
}

channels$.addEventListener('click', async (e) => {
  if (e.target.localName === 'button') {
    const target = e.target.parentElement;
    const channels = await chrome.storage.local.get('exChannels');
    await saveChannels(channels.exChannels, target.id);
    target.remove();
  }
});

const { channelId, title, img } = await chrome.tabs.query({ currentWindow: true, active: true })
  .then(([tab]) => chrome.tabs.sendMessage(tab.id, { msg: 'get-channel-info' }))
  .catch(() => ({}));

if (img) {
  const addChannel$ = $('.add-exchannel');
  addChannel$.removeAttribute('disabled');
  addChannel$.addEventListener('click', async () => {
    const newChannel = [channelId, title, img];
    await saveChannels(exChannels, channelId, [newChannel]);
    [...channels$.children].find((el) => el.id === channelId)?.remove();
    channels$.prepend(createChannelEl(newChannel));
  });
}
