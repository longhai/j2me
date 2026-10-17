/**
 * 从 config/build-version.json 读取版本号，为脚本与样式追加 ?v= 参数，避免缓存旧文件。
 * ES5 兼容（含 KaiOS / 旧 Firefox）。
 */
(function (global) {
  var VERSION_JSON = 'config/build-version.json';

  function withV(url, v) {
    return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'v=' + encodeURIComponent(v);
  }

  /** 固定 URL + 重新校验，避免每次启动制造一个新的缓存条目。 */
  function fetchVersionJson(cb) {
    var x = new XMLHttpRequest();
    var finished = false;
    function done(err, data) {
      if (finished) return;
      finished = true;
      cb(err, data);
    }
    x.open('GET', VERSION_JSON, true);
    x.setRequestHeader('Cache-Control', 'no-cache');
    x.timeout = 8000;
    x.onload = function () {
      if (x.status >= 200 && x.status < 300) {
        try {
          done(null, JSON.parse(x.responseText));
        } catch (e) {
          done(e);
        }
      } else {
        done(new Error('HTTP ' + x.status));
      }
    };
    x.onerror = function () {
      done(new Error('network'));
    };
    x.ontimeout = x.onabort = function () { done(new Error('version request timed out or aborted')); };
    x.send();
  }

  function loadScript(src, v, cb) {
    var s = document.createElement('script');
    s.type = 'text/javascript';
    // Dynamic classic scripts with async=false download in parallel but execute
    // in insertion order (also supported by Firefox 48 / Chrome 60).
    s.async = false;
    s.src = withV(src, v);
    s.onload = function () {
      if (cb) cb(null);
    };
    s.onerror = function () {
      if (cb) cb(new Error('load ' + src));
    };
    var head = document.head || document.getElementsByTagName('head')[0];
    head.appendChild(s);
  }

  function loadScriptsOrdered(urls, v, done) {
    var remaining = urls.length;
    var finished = false;
    if (!remaining) {
      done(null);
      return;
    }
    function loaded(err) {
      if (finished) return;
      if (err || --remaining === 0) {
        finished = true;
        done(err);
      }
    }
    for (var i = 0; i < urls.length; i++) loadScript(urls[i], v, loaded);
  }

  function preloadScripts(urls, v) {
    var head = document.head || document.getElementsByTagName('head')[0];
    var probe = document.createElement('link');
    // Older browsers still use parallel ordered scripts after the CSS loads.
    if (!probe.relList || !probe.relList.supports || !probe.relList.supports('preload')) return;
    for (var i = 0; i < urls.length; i++) {
      var link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'script';
      link.href = withV(urls[i], v);
      head.appendChild(link);
    }
  }

  function warmVersionedCache(urls, v) {
    if (!global.navigator || !navigator.serviceWorker) return;
    // Registration and cache warming never delay the ready callback. force-cache
    // in the worker reuses the HTTP responses this page has just downloaded.
    navigator.serviceWorker.register(withV('sw.js', v)).then(function (registration) {
      var worker = registration.installing || registration.waiting || registration.active;
      if (!worker) return;
      var assets = [];
      for (var i = 0; i < urls.length; i++) {
        var link = document.createElement('a');
        link.href = withV(urls[i], v);
        assets.push(link.href);
      }
      var manifest = document.createElement('a');
      manifest.href = VERSION_JSON;
      assets.push(manifest.href);
      worker.postMessage({ type: 'CACHE_VERSIONED_ASSETS', urls: assets });
    }).catch(function () { /* Storage / SW support is optional. */ });
  }

  function ensureCss(linkId, href, v, cb) {
    var targetHref = withV(href, v);
    var el = document.getElementById(linkId);
    if (!el) {
      el = document.createElement('link');
      el.id = linkId;
      el.rel = 'stylesheet';
      el.type = 'text/css';
      var head = document.head || document.getElementsByTagName('head')[0];
      head.appendChild(el);
    }
    if (el.getAttribute('data-loaded-href') === targetHref) {
      if (cb) cb(null);
      return;
    }
    var finished = false;
    function done(err) {
      if (finished) return;
      finished = true;
      el.onload = null;
      el.onerror = null;
      if (cb) cb(err || null);
    }
    el.onload = function () {
      el.setAttribute('data-loaded-href', targetHref);
      done(null);
    };
    el.onerror = function () {
      done(new Error('load css ' + href));
    };
    el.href = targetHref;
  }

  /**
   * 页面配置：head 与 body 合并预取，执行顺序保持不变。
   */
  var PROFILES = {
    index: {
      css: 'style/index.css',
      cssId: 'app-css-index',
      head: [
        'js/i18n.js',
        'js/encoding.js',
        'js/rawinflate.js',
        'bld/native.js',
        'config/default.js',
        'config/runtests.js',
        'config/build.js',
        'config/urlparams.js',
        'libs/compiled-method-cache.js',
        'bld/j2me.js',
        'bld/main-all.js',
        'js/jszip.min.js',
        'keyboard-layouts.js'
      ],
      body: ['gamelist.js', 'js/savemanager-index-ui.js', 'index.js', 'js/gamepad-config.js', 'js/gamepad-settings.js']
    },
    indexbatch: {
      css: 'style/index.css',
      cssId: 'app-css-index',
      head: [
        'js/i18n.js',
        'js/encoding.js',
        'js/rawinflate.js',
        'bld/native.js',
        'config/default.js',
        'config/runtests.js',
        'config/build.js',
        'config/urlparams.js',
        'libs/compiled-method-cache.js',
        'bld/j2me.js',
        'bld/main-all.js',
        'js/jszip.min.js',
        'keyboard-layouts.js',
        'js/zipfile.js',
        'js/FileSaver.js',
        'js/savemanager.js'
      ],
      body: ['js/savemanager-batch-ui.js', 'index.js', 'js/gamepad-config.js', 'js/gamepad-settings.js']
    },
    main: {
      css: 'style/main.css',
      cssId: 'app-css-main',
      head: [
        'js/i18n.js',
        'js/rawinflate.js',
        'js/encoding.js',
        'js/PicoAudio.js',
        'js/webaudio-tinysynth.min.js',
        'js/BenzAMRRecorder.min.js',
        'js/midiplayer.js',
        'js/adlmidi-player.js',
        'bld/native.js',
        'config/default.js',
        'config/runtests.js',
        'config/build.js',
        'config/urlparams.js',
        'libs/compiled-method-cache.js',
        'bld/j2me.js',
        'bld/main-all.js',
        'js/emulator-speed.js',
        'js/device-profile.js',
        'keyboard-layouts.js',
        'keymap.js',
        'js/player-controls.js',
        'js/jszip.min.js',
        'js/player-more.js',
        'js/gamepad-config.js',
        'js/gamepadHandlerWithRightStick.js'
      ],
      body: []
    }
  };

  global.__BUILD_VERSION__ = '';

  /**
   * @param {string} profileName - 'index' | 'indexbatch' | 'main'
   * @param {function(Error|null)=} onReady - CSS + 全部脚本加载完成后回调
   */
  global.loadVersionedPage = function (profileName, onReady) {
    var prof = PROFILES[profileName];
    if (!prof) {
      if (onReady) onReady(new Error('unknown profile: ' + profileName));
      return;
    }
    fetchVersionJson(function (err, data) {
      var v = '1';
      if (!err && data && data.version != null) {
        v = String(data.version);
      }
      global.__BUILD_VERSION__ = v;
      try {
        console.log('[build] version=' + v);
      } catch (eLog) {}

      var scripts = prof.head.concat(prof.body || []);
      ensureCss(prof.cssId || 'app-css', prof.css, v, function (cssErr) {
        if (cssErr) {
          if (onReady) onReady(cssErr);
          return;
        }
        loadScriptsOrdered(scripts, v, function (scriptErr) {
          if (!scriptErr) warmVersionedCache(scripts.concat([prof.css]), v);
          if (onReady) onReady(scriptErr || null);
        });
      });
      preloadScripts(scripts, v);
    });
  };
})(typeof window !== 'undefined' ? window : this);
