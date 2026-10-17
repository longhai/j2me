/* In-game options: colors/layouts apply immediately and share library preferences. */
(function () {
  'use strict';
  var button = document.getElementById('player-more');
  var panel = document.getElementById('player-more-panel');
  var colors = document.getElementById('player-color-options');
  var layouts = document.getElementById('player-layout-options');
  var status = document.getElementById('player-more-status');
  var exportButton = document.getElementById('player-export-save');
  var importButton = document.getElementById('player-import-save');
  var input = document.getElementById('importSaveFile');
  var busy = false;
  var keyboardIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h.01M12 9h.01M17 9h.01M7 13h.01M12 13h.01M17 13h.01M8 16h8"/></svg>';
  function t(key) { return window.I18n ? I18n.t(key) : key; }
  function close(restoreFocus) {
    panel.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('player-more-open');
    document.documentElement.classList.remove('player-more-open');
    if (restoreFocus) button.focus();
    J2MEPlayerControls.revealToolbar();
  }
  function refresh() {
    colors.textContent = '';
    var colorNames = ['color.white', 'color.black', 'color.purple', 'color.orange', 'color.red', 'color.green'];
    KeyboardLayouts.BG_COLORS.forEach(function (color, index) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'player-color-swatch';
      item.style.backgroundColor = color.value || '#ffffff';
      item.title = t(colorNames[index]);
      item.setAttribute('aria-label', item.title);
      item.setAttribute('aria-pressed', String(KeyboardLayouts.getBgColor() === color.value));
      item.dataset.color = color.value;
      item.addEventListener('click', function () {
        KeyboardLayouts.setBgColor(color.value);
        applyGameBgColor();
        applyPlayerBackground();
        colors.querySelectorAll('button').forEach(function (el) { el.setAttribute('aria-pressed', String(el === item)); });
      });
      colors.appendChild(item);
    });
    layouts.textContent = '';
    var current = _resolveLayout();
    KeyboardLayouts.PRESETS.concat(KeyboardLayouts.getCustomLayouts()).forEach(function (layout) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'player-option';
      item.dataset.layout = layout.name;
      item.innerHTML = keyboardIcon;
      var label = document.createElement('span');
      label.textContent = window.I18n ? I18n.layoutName(layout.name) : layout.name;
      item.appendChild(label);
      item.setAttribute('aria-pressed', String(!!current && current.name === layout.name));
      item.addEventListener('click', function () {
        setPlayerKeyboardLayout(layout);
        close(false);
      });
      layouts.appendChild(item);
    });
  }
  button.addEventListener('click', function () {
    if (!panel.hidden) { close(false); return; }
    if (window.releaseAllKeys) releaseAllKeys();
    refresh();
    panel.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    document.body.classList.add('player-more-open');
    document.documentElement.classList.add('player-more-open');
    J2MEPlayerControls.revealToolbar();
  });
  document.addEventListener('pointerdown', function (event) {
    if (!panel.hidden && !panel.contains(event.target) && !button.contains(event.target)) close(false);
  });
  document.addEventListener('keydown', function (event) {
    if (!panel.hidden && event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    }
  }, true);
  panel.addEventListener('keydown', function (event) { event.stopPropagation(); });
  panel.addEventListener('keyup', function (event) { event.stopPropagation(); });
  panel.addEventListener('focusout', function () {
    setTimeout(function () {
      if (!panel.hidden && !panel.contains(document.activeElement) && document.activeElement !== button && document.activeElement !== document.body) close(false);
    }, 0);
  });
  function setBusy(value) {
    busy = value;
    exportButton.disabled = importButton.disabled = value;
  }
  function message(key) {
    status.removeAttribute('data-i18n');
    status.textContent = t(key);
  }
  exportButton.addEventListener('click', function () {
    if (busy) return;
    setBusy(true);
    message('player.exporting');
    if (typeof myflushAll === 'function') myflushAll();
    SaveManager.exportSaveToZip('j2me', function (blob) {
      setBusy(false);
      if (!blob) { message('player.saveFailed'); return; }
      SaveManager.downloadZip(blob, 'j2me-saves-' + new Date().toISOString().slice(0, 10) + '.zip');
      message('player.exported');
    });
  });
  importButton.addEventListener('click', function () { if (!busy) input.click(); });
  input.addEventListener('change', function () {
    var file = input.files && input.files[0];
    input.value = '';
    if (!file || busy) return;
    if (!window.confirm(t('player.importConfirm'))) return;
    setBusy(true);
    message('player.importing');
    if (typeof myflushAll === 'function') myflushAll();
    SaveManager.importSaveFromZip(file, function (ok) {
      setBusy(false);
      if (!ok) { message('player.saveFailed'); return; }
      window.location.reload();
    });
  });
})();
