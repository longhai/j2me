/* Theme-aware gamepad settings shared by both library pages. */
(function (global) {
    'use strict';
    var activeDialog = null;
    var names = {
        '0': 'A', '1': 'B', '2': 'X', '3': 'Y', '4': 'Nút vai trái L1', '5': 'Nút vai phải R1',
        '6': 'Cò trái L2', '7': 'Cò phải R2', '8': 'Nút Select', '9': 'Nút Start',
        '10': 'Nhấn cần trái', '11': 'Nhấn cần phải', '12': 'D-pad lên', '13': 'D-pad xuống',
        '14': 'D-pad trái', '15': 'D-pad phải', '16': 'MODE',
        'left-up': 'Cần trái lên', 'left-down': 'Cần trái xuống', 'left-left': 'Cần trái qua trái', 'left-right': 'Cần trái qua phải',
        'right-up': 'Cần phải lên', 'right-down': 'Cần phải xuống', 'right-left': 'Cần phải qua trái', 'right-right': 'Cần phải qua phải'
    };
    var labels = {
        SOFTLEFT: 'Phím trái', SOFTRIGHT: 'Phím phải', FIRE: 'OK',
        UP: 'Lên ↑', DOWN: 'Xuống ↓', LEFT: 'Trái ←', RIGHT: 'Phải →', STAR: '*', POUND: '#'
    };
    var groups = [
        { title: 'Phím điều hướng & chức năng', keys: ['UP', 'DOWN', 'LEFT', 'RIGHT', 'FIRE', 'SOFTLEFT', 'SOFTRIGHT'] },
        { title: 'Phím số', keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'STAR', '0', 'POUND'] }
    ];
    function label(key) { return labels[key] || key; }
    function open(options) {
        if (activeDialog) { activeDialog.focus(); return; }
        options = options || {};
        var config = global.J2MEGamepadConfig;
        var mapping = config.load();
        var editing = null;
        var previousInputs = {};
        var previousPad = null;
        var rows = {};
        var opener = document.activeElement;
        var oldOverflow = document.body.style.overflow;
        var background = [];
        var overlay = document.createElement('div');
        overlay.className = 'gamepad-settings-backdrop';
        overlay.innerHTML = '<section class="gamepad-settings-dialog" role="dialog" aria-modal="true" aria-labelledby="gamepad-settings-title" aria-describedby="gamepad-settings-help">' +
            '<header class="gamepad-settings-header"><div><h2 id="gamepad-settings-title">Ánh xạ nút tay cầm</h2><p id="gamepad-settings-help">Bấm "Cài đặt", rồi bấm nút tay cầm hoặc đẩy cần. Sửa xong tự lưu.</p></div>' +
            '<button type="button" class="gamepad-settings-close" aria-label="Đóng ánh xạ nút tay cầm">×</button></header>' +
            '<div class="gamepad-settings-connection"><span class="gamepad-settings-dot" aria-hidden="true"></span><span class="gamepad-settings-device">Chưa kết nối tay cầm · kết nối rồi bấm nút bất kỳ để đánh thức</span></div>' +
            '<p class="gamepad-settings-status" role="status" aria-live="polite">Cài đặt áp dụng cho mọi game</p>' +
            '<div class="gamepad-settings-list"></div>' +
            '<footer class="gamepad-settings-footer"><button type="button" class="btn" data-action="reset">Về mặc định</button>' +
            '<button type="button" class="btn" data-action="clear">Xóa hết</button>' +
            '<button type="button" class="btn btn-primary" data-action="done">Xong</button></footer></section>';
        var panel = overlay.querySelector('.gamepad-settings-dialog');
        var status = overlay.querySelector('.gamepad-settings-status');
        var device = overlay.querySelector('.gamepad-settings-device');
        var connection = overlay.querySelector('.gamepad-settings-connection');
        var closeButton = overlay.querySelector('.gamepad-settings-close');
        var list = overlay.querySelector('.gamepad-settings-list');
        function setStatus(message, error) {
            status.textContent = message;
            status.classList.toggle('is-error', !!error);
        }
        function refreshRows() {
            Object.keys(rows).forEach(function (key) {
                var row = rows[key];
                var code = mapping[key];
                row.value.textContent = editing === key ? 'Đang chờ bấm tay cầm…' : (code === '' ? 'Chưa gán' : (names[code] || 'Nút ' + code));
                row.value.classList.toggle('is-empty', code === '');
                row.container.classList.toggle('is-editing', editing === key);
                row.button.textContent = editing === key ? 'Hủy' : 'Cài đặt';
                row.button.setAttribute('aria-label', (editing === key ? 'Hủy cài đặt' : 'Cài đặt') + label(key));
            });
        }
        function getPad() {
            var pads = config.getGamepads();
            for (var i = 0; i < pads.length; i++) if (pads[i]) return pads[i];
            return null;
        }
        function inputsFor(pad) {
            var inputs = {};
            if (!pad) return inputs;
            pad.buttons.forEach(function (button, index) {
                if ((index === 6 || index === 7) ? button.value >= config.triggerActivationThreshold : button.pressed) inputs[String(index)] = true;
            });
            var directions = ['left-left', 'left-right', 'left-up', 'left-down', 'right-left', 'right-right', 'right-up', 'right-down'];
            for (var i = 0; i < 4; i++) {
                if (pad.axes[i] <= -config.stickActivationThreshold) inputs[directions[i * 2]] = true;
                if (pad.axes[i] >= config.stickActivationThreshold) inputs[directions[i * 2 + 1]] = true;
            }
            return inputs;
        }
        function save(message) {
            var saved = config.save(mapping);
            setStatus(saved ? message : 'Không lưu được cài đặt, hãy cho phép trình duyệt dùng bộ nhớ cục bộ', !saved);
        }
        groups.forEach(function (group) {
            var heading = document.createElement('h3');
            heading.className = 'gamepad-settings-group';
            heading.textContent = group.title;
            list.appendChild(heading);
            group.keys.forEach(function (key) {
                var row = document.createElement('div');
                row.className = 'gamepad-settings-row';
                var title = document.createElement('span');
                title.className = 'gamepad-settings-key';
                title.textContent = label(key);
                var value = document.createElement('span');
                value.className = 'gamepad-settings-value';
                value.setAttribute('data-target-key', key);
                var button = document.createElement('button');
                button.type = 'button';
                button.className = 'gamepad-settings-bind';
                button.onclick = function () {
                    if (editing === key) {
                        editing = null;
                        setStatus('Đã hủy cài đặt');
                    } else {
                        var pad = getPad();
                        if (!pad) { setStatus('Hãy kết nối tay cầm trước, rồi bấm nút bất kỳ để đánh thức', true); return; }
                        editing = key;
                        previousPad = pad.index;
                        previousInputs = inputsFor(pad);
                        setStatus('Đang cài đặt "' + label(key) + '": bấm nút tay cầm hoặc đẩy cần');
                    }
                    refreshRows();
                };
                row.appendChild(title);
                row.appendChild(value);
                row.appendChild(button);
                list.appendChild(row);
                rows[key] = { container: row, value: value, button: button };
            });
        });
        function poll() {
            if (document.hidden) return;
            var pad = getPad();
            var text = pad ? 'Đã kết nối · ' + pad.id : 'Chưa kết nối tay cầm · kết nối rồi bấm nút bất kỳ để đánh thức';
            if (device.textContent !== text) device.textContent = text;
            connection.classList.toggle('is-connected', !!pad);
            if (!pad && editing) {
                editing = null;
                setStatus('Tay cầm đã ngắt kết nối, hãy kết nối lại rồi cài đặt', true);
                refreshRows();
            }
            var inputs = inputsFor(pad);
            if (pad && previousPad !== pad.index) previousInputs = inputs;
            if (editing) {
                var pressed = Object.keys(inputs).filter(function (input) { return !previousInputs[input]; });
                if (pressed.length) {
                    var key = editing;
                    var code = pressed[0];
                    var conflicts = [];
                    Object.keys(mapping).forEach(function (other) {
                        if (other !== key && mapping[other] === code) { mapping[other] = ''; conflicts.push(label(other)); }
                    });
                    mapping[key] = code;
                    editing = null;
                    save(conflicts.length ? 'Đã lưu, đã gỡ các phím trùng:' + conflicts.join('、') : 'Đã lưu "' + label(key) + '"');
                    refreshRows();
                }
            }
            previousInputs = inputs;
            previousPad = pad ? pad.index : null;
        }
        overlay.querySelector('[data-action="reset"]').onclick = function () {
            editing = null; mapping = config.defaults(); save('Đã về ánh xạ mặc định'); refreshRows();
        };
        overlay.querySelector('[data-action="clear"]').onclick = function () {
            editing = null; Object.keys(mapping).forEach(function (key) { mapping[key] = ''; });
            save('Đã xóa hết ánh xạ'); refreshRows();
        };
        function keydown(event) {
            if (event.key === 'Escape' || event.keyCode === 27) {
                event.preventDefault(); event.stopPropagation(); close();
            } else if (event.key === 'Tab' || event.keyCode === 9) {
                var buttons = panel.querySelectorAll('button');
                var first = buttons[0], last = buttons[buttons.length - 1];
                if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
                    event.preventDefault(); last.focus();
                } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
                    event.preventDefault(); first.focus();
                }
            }
        }
        function storageChanged(event) {
            if (event.key === config.storageKey || event.key === null) {
                mapping = config.load(); editing = null; refreshRows(); setStatus('Đã cập nhật ánh xạ tay cầm');
            }
        }
        function close() {
            if (!activeDialog) return;
            clearInterval(timer);
            document.removeEventListener('keydown', keydown, true);
            global.removeEventListener('storage', storageChanged);
            global.removeEventListener('pagehide', close);
            overlay.remove();
            document.body.style.overflow = oldOverflow;
            background.forEach(function (item) {
                item.element.inert = item.inert;
                if (item.hidden === null) item.element.removeAttribute('aria-hidden');
                else item.element.setAttribute('aria-hidden', item.hidden);
            });
            activeDialog = null;
            if (opener && opener.isConnected) opener.focus();
            if (options.onClose) options.onClose();
        }
        overlay.onclick = function (event) { if (event.target === overlay) close(); };
        closeButton.onclick = close;
        overlay.querySelector('[data-action="done"]').onclick = close;
        Array.prototype.forEach.call(document.body.children, function (element) {
            background.push({ element: element, inert: element.inert, hidden: element.getAttribute('aria-hidden') });
            element.inert = true;
            element.setAttribute('aria-hidden', 'true');
        });
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', keydown, true);
        global.addEventListener('storage', storageChanged);
        global.addEventListener('pagehide', close);
        activeDialog = { focus: function () { closeButton.focus(); } };
        refreshRows();
        poll();
        var timer = setInterval(poll, 60);
        closeButton.focus();
    }
    global.J2MEGamepadSettings = { open: open };
})(window);
