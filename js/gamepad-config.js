/* Shared by the gamepad settings page and the MIDlet input handler. */
(function (global) {
    'use strict';
    var storageKey = 'mrp_gamepad_config';
    var defaults = {
        POUND: '1', STAR: '0', '0': '3', '1': 'right-up', '2': 'left-up',
        '3': 'right-down', '4': 'left-left', '5': '2', '6': 'left-right',
        '7': 'right-left', '8': 'left-down', '9': 'right-right',
        SOFTLEFT: '4', SOFTRIGHT: '5', FIRE: '9',
        UP: '12', DOWN: '13', LEFT: '14', RIGHT: '15'
    };
    var keyCodes = {
        POUND: 35, STAR: 42, '0': 48, '1': 49, '2': 50, '3': 51, '4': 52,
        '5': 53, '6': 54, '7': 55, '8': 56, '9': 57,
        SOFTLEFT: -6, SOFTRIGHT: -7, FIRE: -5, UP: -1, DOWN: -2, LEFT: -3, RIGHT: -4
    };
    function normalize(value) {
        var result = {};
        var valid = value && typeof value === 'object' && !Array.isArray(value);
        Object.keys(defaults).forEach(function (key) {
            var code = valid && Object.prototype.hasOwnProperty.call(value, key) ? value[key] : defaults[key];
            code = typeof code === 'string' || typeof code === 'number' ? String(code) : defaults[key];
            result[key] = code === '' || /^(\d+|(left|right)-(up|down|left|right))$/.test(code) ? code : defaults[key];
        });
        return result;
    }
    function load() {
        try { return normalize(JSON.parse(global.localStorage.getItem(storageKey))); }
        catch (error) { return normalize(null); }
    }
    function save(value) {
        var mapping = normalize(value);
        try { global.localStorage.setItem(storageKey, JSON.stringify(mapping)); }
        catch (error) { return false; }
        global.dispatchEvent(new Event('gamepadmappingchange'));
        return true;
    }
    function getGamepads() {
        try { return global.navigator.getGamepads ? global.navigator.getGamepads() : []; }
        catch (error) { return []; }
    }
    global.J2MEGamepadConfig = {
        storageKey: storageKey, defaults: function () { return normalize(null); },
        keyCodes: keyCodes, load: load, save: save, getGamepads: getGamepads,
        stickActivationThreshold: 0.5, triggerActivationThreshold: 0.1
    };
})(window);
