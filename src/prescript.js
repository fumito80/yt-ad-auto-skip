function ytAdMaxDig(el, els = []) {
  if (!el) {
    return [...els, window];
  }
  return ytAdMaxDig(el.parentElement, [el, ...els]);
}

HTMLButtonElement.prototype.addEventListenerOrg ??= HTMLButtonElement.prototype.addEventListener;
HTMLButtonElement.prototype.addEventListener = function a(type, listener, options) {
  if (type !== 'click') {
    return this.addEventListenerOrg(type, listener, options);
  }
  const hookListener = (...args) => {
    const [arg1, ...rest] = args;
    if (arg1.clientX !== 999999) {
      return listener(...args);
    }
    const els = ytAdMaxDig(this);
    return listener({
      ...arg1,
      isTrusted: true,
      preventDefault: () => true,
      composedPath: () => els,
    }, ...rest);
  };
  return this.addEventListenerOrg(type, hookListener, options);
};
