/* eslint-disable func-names */
HTMLButtonElement.prototype.addEventListenerOrg = HTMLButtonElement.prototype.addEventListener;
HTMLButtonElement.prototype.addEventListener = function (type, listener, options) {
  if (type !== 'click') {
    return this.addEventListenerOrg(type, listener, options);
  }
  const newListener = (...args) => {
    const [arg1, ...rest] = args;
    if (arg1.clientX !== 999999) {
      return listener(...args);
    }
    return listener(...[{ ...arg1, isTrusted: true, preventDefault: () => true }, ...rest]);
  };
  return this.addEventListenerOrg(type, newListener, options);
};
