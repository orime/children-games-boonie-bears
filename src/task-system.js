// 简单互动任务系统 + 隐藏彩蛋

window.TaskSystem = (() => {
    // --- 隐藏彩蛋追踪 ---
    let lastKey = '';
    let sameKeyCount = 0;
    let spaceCount = 0;
    let rapidKeyTimestamps = [];

    // --- 光标切换 ---
    const cursors = [
        'default',
        "url('assets/cursor-paw.cur'), auto",   // 会回退到 emoji 方案
    ];
    const cursorEmojis = ['🐾', '🪓', '🍯', '🦋', '⭐', '🐻', '🌲'];
    let cursorIndex = 0;

    function checkEasterEggs(key) {
        // 彩蛋1: 连续按同一个键 10 次 → 光头强砍树全屏动画
        if (key === lastKey) {
            sameKeyCount++;
        } else {
            lastKey = key;
            sameKeyCount = 1;
        }

        if (sameKeyCount === 10) {
            sameKeyCount = 0;
            triggerLoggerChop();
            return true;
        }

        // 彩蛋2: 连按空格 5 次 → 熊大熊二跳舞
        if (key === ' ') {
            spaceCount++;
            if (spaceCount >= 5) {
                spaceCount = 0;
                triggerBearDance();
                return true;
            }
        } else {
            spaceCount = 0;
        }

        // 彩蛋3: 疯狂模式（1秒内超过8次按键）
        const now = Date.now();
        rapidKeyTimestamps.push(now);
        rapidKeyTimestamps = rapidKeyTimestamps.filter(t => now - t < 1000);
        if (rapidKeyTimestamps.length >= 8) {
            rapidKeyTimestamps = [];
            triggerCrazyMode();
            return true;
        }

        return false;
    }

    function triggerLoggerChop() {
        const layer = document.getElementById('character-layer');
        const el = document.createElement('div');
        el.className = 'easter-egg-fullscreen';
        el.innerHTML = `
            <div class="egg-scene">
                <img src="assets/logger.png" class="egg-char egg-logger-chop" />
                <div class="egg-text">🪓 光头强在砍树！🌲💥</div>
            </div>
        `;
        layer.appendChild(el);
        if (window.soundEngine) window.soundEngine.playRandom();
        setTimeout(() => el.remove(), 3000);
    }

    function triggerBearDance() {
        const layer = document.getElementById('character-layer');
        const el = document.createElement('div');
        el.className = 'easter-egg-fullscreen';
        el.innerHTML = `
            <div class="egg-scene">
                <img src="assets/bear-big.png" class="egg-char egg-dance-left" />
                <img src="assets/bear-small.png" class="egg-char egg-dance-right" />
                <div class="egg-text">🎶 熊大熊二一起跳舞！💃🕺</div>
            </div>
        `;
        layer.appendChild(el);
        if (window.soundEngine) window.soundEngine.playCelebration();
        setTimeout(() => el.remove(), 4000);
    }

    function triggerCrazyMode() {
        const layer = document.getElementById('character-layer');
        // 同时弹出所有角色
        const chars = ['bear-big.png', 'bear-small.png', 'logger.png', 'jiji-king.png', 'bengbeng.png'];
        chars.forEach((c, i) => {
            const el = document.createElement('div');
            el.className = 'sprite anim-pop';
            el.style.backgroundImage = `url('assets/${c}')`;
            el.style.mixBlendMode = 'multiply';
            const size = 200 + Math.random() * 200;
            el.style.width = `${size}px`;
            el.style.height = `${size}px`;
            el.style.left = `${(i * 20) + Math.random() * 10}%`;
            el.style.top = `${Math.random() * 60 + 10}%`;
            el.style.animationDelay = `${i * 0.1}s`;
            layer.appendChild(el);
            setTimeout(() => el.remove(), 2500);
        });

        // 疯狂模式文字
        const banner = document.getElementById('task-banner');
        const taskText = document.getElementById('task-text');
        taskText.textContent = '🔥 疯狂模式！所有角色集合！🔥';
        banner.classList.remove('hidden');
        setTimeout(() => banner.classList.add('hidden'), 2500);
    }

    // --- 光标切换 ---
    function switchCursor() {
        cursorIndex = (cursorIndex + 1) % cursorEmojis.length;
        const emoji = cursorEmojis[cursorIndex];
        
        // 创建 emoji 光标 (使用 canvas 绘制 emoji 作为 cursor)
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.font = '28px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 16, 16);
        
        const dataURL = canvas.toDataURL('image/png');
        document.body.style.cursor = `url(${dataURL}) 16 16, auto`;
    }

    // 每隔一段时间或特定触发就切换光标
    let cursorSwitchCounter = 0;
    function maybeSwitch() {
        cursorSwitchCounter++;
        if (cursorSwitchCounter % 15 === 0) {
            switchCursor();
        }
    }

    return { checkEasterEggs, switchCursor, maybeSwitch };
})();
