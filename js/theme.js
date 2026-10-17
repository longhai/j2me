/* Shared, synchronous theme bootstrap: run before styles to avoid a light flash. */
(function (global) {
  'use strict';
  /* Chrome 60 / Firefox 48: NodeList.forEach arrived later; UI scripts rely on it. */
  if (global.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
  }
  var passiveTrue = false;
  var passiveFalse = false;
  try {
    var probe = Object.defineProperty({}, 'passive', {
      get: function () {
        passiveTrue = { passive: true };
        passiveFalse = { passive: false };
      }
    });
    global.addEventListener('testpassive', null, probe);
    global.removeEventListener('testpassive', null, probe);
  } catch (e) {}
  global.__eventPassiveTrue = passiveTrue || false;
  global.__eventPassiveFalse = passiveFalse || false;
  var key = 'j2me.theme';
  var preference = 'system';
  var system = global.matchMedia('(prefers-color-scheme: dark)');
  function read() {
    try { preference = localStorage.getItem(key) || 'system'; } catch (e) {}
    if (['system', 'dark', 'light'].indexOf(preference) < 0) preference = 'system';
  }
  function apply() {
    var theme = preference === 'system' ? (system.matches ? 'dark' : 'light') : preference;
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    var select = document.getElementById('uiTheme');
    if (select) select.value = preference;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = theme === 'dark' ? '#0D0D0D' : '#F5F5F5';
  }
  global.J2METheme = {
    getPreference: function () { return preference; },
    setPreference: function (value) {
      preference = ['system', 'dark', 'light'].indexOf(value) >= 0 ? value : 'system';
      try { localStorage.setItem(key, preference); } catch (e) {}
      apply();
    }
  };
  read();
  apply();
  document.addEventListener('DOMContentLoaded', apply);
  if (system.addEventListener) system.addEventListener('change', apply);
  else system.addListener(apply);
  global.addEventListener('storage', function (event) {
    if (event.key === key || event.key === null) { read(); apply(); }
  });
})(window);
