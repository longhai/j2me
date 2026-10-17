(function () {
'use strict';
// 配置参数
const GAMEPAD_CONFIG = {
    deadzone: 0.1,               // 摇杆死区
    stickActivationThreshold: J2MEGamepadConfig.stickActivationThreshold, // 摇杆方向激活阈值
    triggerActivationThreshold: J2MEGamepadConfig.triggerActivationThreshold // 扳机键激活阈值
};

// 全局状态管理
const gamepadState = {
    gamepad: null,
    isRunning: false,
    frame: null,
    previous: {
        buttons: [],
        axes: [],
        stickDirections: {
            // 左摇杆方向
            'left-up': false,
            'left-down': false,
            'left-left': false,
            'left-right': false,
            // 右摇杆方向
            'right-up': false,
            'right-down': false,
            'right-left': false,
            'right-right': false
        },
        triggers: {
            left: false,
            right: false
        }
    }
};

// 初始化
function initGamepadHandler() {
    console.log("游戏手柄处理工具已初始化");
    window.addEventListener('gamepadconnected', handleConnect);
    window.addEventListener('gamepaddisconnected', handleDisconnect);
    window.addEventListener('storage', function (event) {
        if (event.key === J2MEGamepadConfig.storageKey || event.key === null) reloadMapping();
    });
    window.addEventListener('gamepadmappingchange', reloadMapping);
    window.addEventListener('pagehide', stopMonitoring);
    window.addEventListener('blur', stopMonitoring);
    window.addEventListener('focus', resumeMonitoring);
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) stopMonitoring();
        else resumeMonitoring();
    });
    checkExistingGamepads();
}

// 检查已连接的手柄
function checkExistingGamepads(excludedIndex) {
    const gamepads = J2MEGamepadConfig.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i] && i !== excludedIndex) {
            gamepadState.gamepad = gamepads[i];
            initStateTracking(gamepadState.gamepad);
            startMonitoring();
            handleInputEvent('system', 'connected', gamepadState.gamepad.id);
            break;
        }
    }
}

// 初始化状态跟踪
function initStateTracking(gamepad) {
    gamepadState.previous.buttons = new Array(gamepad.buttons.length).fill(false);
    gamepadState.previous.axes = new Array(gamepad.axes.length).fill(0);
    Object.keys(gamepadState.previous.stickDirections).forEach(key => gamepadState.previous.stickDirections[key] = false);
    gamepadState.previous.triggers = { left: false, right: false };
}

// 手柄连接处理
function handleConnect(event) {
    if (gamepadState.gamepad) return;
    gamepadState.gamepad = event.gamepad;
    initStateTracking(gamepadState.gamepad);
    startMonitoring();
    handleInputEvent('system', 'connected', event.gamepad.id);
}

// 手柄断开处理
function handleDisconnect(event) {
    if (!gamepadState.gamepad || event.gamepad.index !== gamepadState.gamepad.index) return;
    stopMonitoring();
    handleInputEvent('system', 'disconnected', event.gamepad.id);
    gamepadState.gamepad = null;
    checkExistingGamepads(event.gamepad.index);
}

function stopMonitoring() {
    gamepadState.isRunning = false;
    if (gamepadState.frame !== null) cancelAnimationFrame(gamepadState.frame);
    gamepadState.frame = null;
    releaseAllGamepadKeys();
    if (gamepadState.gamepad) initStateTracking(gamepadState.gamepad);
}

function resumeMonitoring() {
    if (document.hidden) return;
    if (gamepadState.gamepad) startMonitoring();
    else checkExistingGamepads();
}

// 开始监控
function startMonitoring() {
    if (!document.hidden && !gamepadState.isRunning && gamepadState.gamepad) {
        gamepadState.isRunning = true;
        gameLoop();
    }
}

// 游戏循环
function gameLoop() {
    if (!gamepadState.isRunning || !gamepadState.gamepad) {
        gamepadState.isRunning = false;
        return;
    }

    const updatedGamepad = J2MEGamepadConfig.getGamepads()[gamepadState.gamepad.index];
    if (updatedGamepad) {
        gamepadState.gamepad = updatedGamepad;
        processInputs();
    } else {
        handleDisconnect({ gamepad: gamepadState.gamepad });
        return;
    }

    gamepadState.frame = requestAnimationFrame(gameLoop);
}

// 处理所有输入
function processInputs() {
    processButtons();
    processAxes();
    processTriggers();
}

// 处理按钮
function processButtons() {
    gamepadState.gamepad.buttons.forEach((button, index) => {
        // Triggers use their analogue threshold below; do not emit them twice.
        if (index === 6 || index === 7) return;
        const isPressed = button.pressed;
        if (isPressed !== gamepadState.previous.buttons[index]) {
            // 调用统一处理函数
            handleInputEvent(
                'button',
                isPressed ? 'pressed' : 'released',
                index,
                { value: button.value }
            );
            gamepadState.previous.buttons[index] = isPressed;
        }
    });
}

// 处理摇杆
function processAxes() {
    const axes = gamepadState.gamepad.axes;

    // 处理左摇杆 (通常是前两个轴)
    if (axes.length >= 2) {
        const x = Math.abs(axes[0]) < GAMEPAD_CONFIG.deadzone ? 0 : axes[0];
        const y = Math.abs(axes[1]) < GAMEPAD_CONFIG.deadzone ? 0 : axes[1];

        // 上
        const isUp = y <= -GAMEPAD_CONFIG.stickActivationThreshold;
        if (isUp !== gamepadState.previous.stickDirections['left-up']) {
            handleInputEvent('stick', isUp ? 'pressed' : 'released', 'left-up', { x, y });
            gamepadState.previous.stickDirections['left-up'] = isUp;
        }

        // 下
        const isDown = y >= GAMEPAD_CONFIG.stickActivationThreshold;
        if (isDown !== gamepadState.previous.stickDirections['left-down']) {
            handleInputEvent('stick', isDown ? 'pressed' : 'released', 'left-down', { x, y });
            gamepadState.previous.stickDirections['left-down'] = isDown;
        }

        // 左
        const isLeft = x <= -GAMEPAD_CONFIG.stickActivationThreshold;
        if (isLeft !== gamepadState.previous.stickDirections['left-left']) {
            handleInputEvent('stick', isLeft ? 'pressed' : 'released', 'left-left', { x, y });
            gamepadState.previous.stickDirections['left-left'] = isLeft;
        }

        // 右
        const isRight = x >= GAMEPAD_CONFIG.stickActivationThreshold;
        if (isRight !== gamepadState.previous.stickDirections['left-right']) {
            handleInputEvent('stick', isRight ? 'pressed' : 'released', 'left-right', { x, y });
            gamepadState.previous.stickDirections['left-right'] = isRight;
        }
    }

    // 处理右摇杆 (通常是后两个轴)
    if (axes.length >= 4) {
        const x = Math.abs(axes[2]) < GAMEPAD_CONFIG.deadzone ? 0 : axes[2];
        const y = Math.abs(axes[3]) < GAMEPAD_CONFIG.deadzone ? 0 : axes[3];

        // 上
        const isUp = y <= -GAMEPAD_CONFIG.stickActivationThreshold;
        if (isUp !== gamepadState.previous.stickDirections['right-up']) {
            handleInputEvent('stick', isUp ? 'pressed' : 'released', 'right-up', { x, y });
            gamepadState.previous.stickDirections['right-up'] = isUp;
        }

        // 下
        const isDown = y >= GAMEPAD_CONFIG.stickActivationThreshold;
        if (isDown !== gamepadState.previous.stickDirections['right-down']) {
            handleInputEvent('stick', isDown ? 'pressed' : 'released', 'right-down', { x, y });
            gamepadState.previous.stickDirections['right-down'] = isDown;
        }

        // 左
        const isLeft = x <= -GAMEPAD_CONFIG.stickActivationThreshold;
        if (isLeft !== gamepadState.previous.stickDirections['right-left']) {
            handleInputEvent('stick', isLeft ? 'pressed' : 'released', 'right-left', { x, y });
            gamepadState.previous.stickDirections['right-left'] = isLeft;
        }

        // 右
        const isRight = x >= GAMEPAD_CONFIG.stickActivationThreshold;
        if (isRight !== gamepadState.previous.stickDirections['right-right']) {
            handleInputEvent('stick', isRight ? 'pressed' : 'released', 'right-right', { x, y });
            gamepadState.previous.stickDirections['right-right'] = isRight;
        }
    }
}

// 处理扳机键
function processTriggers() {
    const buttons = gamepadState.gamepad.buttons;

    // 左扳机
    if (buttons.length >= 7) {
        const value = buttons[6].value;
        const isActive = value >= GAMEPAD_CONFIG.triggerActivationThreshold;
        if (isActive !== gamepadState.previous.triggers.left) {
            handleInputEvent(
                'trigger',
                isActive ? 'pressed' : 'released',
                'left',
                { value }
            );
            gamepadState.previous.triggers.left = isActive;
        }
    }

    // 右扳机
    if (buttons.length >= 8) {
        const value = buttons[7].value;
        const isActive = value >= GAMEPAD_CONFIG.triggerActivationThreshold;
        if (isActive !== gamepadState.previous.triggers.right) {
            handleInputEvent(
                'trigger',
                isActive ? 'pressed' : 'released',
                'right',
                { value }
            );
            gamepadState.previous.triggers.right = isActive;
        }
    }
}

// Retain the mapping used for each press so remapping cannot leave a key held.
let gamepadMapping = J2MEGamepadConfig.load();
const heldInputs = new Map();
const heldKeyCounts = new Map();

function releaseAllGamepadKeys() {
    heldKeyCounts.forEach((count, code) => {
        if (window.MIDP) window.MIDP.sendKeyRelease(code);
    });
    heldKeyCounts.clear();
    heldInputs.clear();
}

function reloadMapping() {
    releaseAllGamepadKeys();
    gamepadMapping = J2MEGamepadConfig.load();
    if (gamepadState.gamepad) initStateTracking(gamepadState.gamepad);
}

function handleInputEvent(type, action, key, data = {}) {
    if (type === 'system') {
        const modalContent = document.createElement('div');
        const title = document.createElement('h3');
        title.textContent = action === 'connected' ? '手柄已连接' : '手柄已断开';
        const name = document.createElement('p');
        name.textContent = key;
        modalContent.appendChild(title);
        modalContent.appendChild(name);
        const modal = createModal({ contentElement: modalContent });
        modal.show();
        setTimeout(() => modal.hide(), 3000);
        return;
    }
    const input = type === 'trigger' ? (key === 'left' ? '6' : '7') : String(key);
    if (action === 'pressed') {
        if (heldInputs.has(input) || !window.MIDP || typeof window.MIDP.sendKeyPress !== 'function') return;
        const codes = Object.keys(gamepadMapping)
            .filter(logicKey => gamepadMapping[logicKey] === input)
            .map(logicKey => J2MEGamepadConfig.keyCodes[logicKey]);
        heldInputs.set(input, codes);
        codes.forEach(code => {
            const count = heldKeyCounts.get(code) || 0;
            if (count === 0) window.MIDP.sendKeyPress(code);
            heldKeyCounts.set(code, count + 1);
        });
    } else if (action === 'released' && heldInputs.has(input)) {
        heldInputs.get(input).forEach(code => {
            const count = heldKeyCounts.get(code) - 1;
            if (count === 0) {
                if (window.MIDP) window.MIDP.sendKeyRelease(code);
                heldKeyCounts.delete(code);
            } else heldKeyCounts.set(code, count);
        });
        heldInputs.delete(input);
    }
}

// Versioned scripts may arrive after window.load.
if (document.readyState === 'complete') initGamepadHandler();
else window.addEventListener('load', initGamepadHandler);

function createModal(options) {
    const {
        contentElement,
        onClose = () => { }
    } = options;

    // 创建覆盖层
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.opacity = '0';
    overlay.style.visibility = 'hidden';
    overlay.style.transition = 'opacity 0.3s ease, visibility 0.3s ease';
    overlay.style.zIndex = '9999';

    // 创建模态框
    const modal = document.createElement('div');
    modal.style.backgroundColor = 'var(--bg-card, white)';
    modal.style.borderRadius = '8px';
    modal.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    modal.style.padding = '20px';
    modal.style.width = '400px';
    modal.style.maxWidth = 'calc(100vw - 32px)';
    modal.style.color = 'var(--text-primary, #222)';
    modal.style.transform = 'scale(0.8)';
    modal.style.transition = 'transform 0.3s ease';

    // 创建关闭按钮
    const closeButton = document.createElement('span');
    closeButton.textContent = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '20px';
    closeButton.style.color = '#888';
    closeButton.addEventListener('click', () => {
        overlay.style.opacity = '0';
        overlay.style.visibility = 'hidden';
        overlay.remove();
        onClose();
    });

    // 将传入的内容元素添加到模态框
    modal.appendChild(contentElement);
    // 将关闭按钮添加到模态框
    modal.appendChild(closeButton);

    // 将模态框添加到覆盖层
    overlay.appendChild(modal);

    // 将覆盖层添加到文档中
    document.body.appendChild(overlay);

    return {
        show: () => {
            overlay.style.opacity = '1';
            overlay.style.visibility = 'visible';
            modal.style.transform = 'scale(1)';
        },
        hide: () => {
            overlay.style.opacity = '0';
            overlay.style.visibility = 'hidden';
            overlay.remove();
            onClose();
        }
    };
}
})();
