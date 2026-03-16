// 核心任务系统：保卫森林战斗模块 + 隐藏彩蛋

window.TaskSystem = (() => {
    // --- 状态追踪 ---
    let lastKey = '';
    let sameKeyCount = 0;
    let spaceCount = 0;
    let rapidKeyTimestamps = [];
    
    // --- 战斗系统状态 ---
    let isInBattle = false;
    let loggerHP = 100;
    const ATTACK_POWER = 5; // 每次点击造成的伤害
    
    // --- 角色与元素 ---
    const attackers = ['bear-big.png', 'bear-small.png', 'jiji-king.png', 'bengbeng.png', 'bear-big-angry.png'];
    const cursorEmojis = ['🐾', '🪓', '🍯', '🦋', '⭐', '🐻', '🌲'];
    let cursorIndex = 0;

    function checkEasterEggs(key) {
        if (isInBattle) return true; // 战斗中不触发其他彩蛋

        // 彩蛋1: 连按同一键 8 次 → 触发光头强砍树危机（进入战斗模式）
        if (key === lastKey) {
            sameKeyCount++;
        } else {
            lastKey = key;
            sameKeyCount = 1;
        }

        if (sameKeyCount === 8) {
            sameKeyCount = 0;
            startBattle();
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

        // 随机小概率触发战斗 (0.5%)
        if (Math.random() < 0.005) {
            startBattle();
            return true;
        }

        return false;
    }

    // --- 战斗逻辑 ---
    function startBattle() {
        if (isInBattle) return;
        isInBattle = true;
        loggerHP = 100;

        const overlay = document.getElementById('battle-overlay');
        const progress = document.getElementById('battle-progress');
        const logger = document.getElementById('battle-logger');
        
        overlay.classList.remove('hidden');
        progress.style.width = '100%';
        logger.style.backgroundImage = "url('assets/logger-chopping.png')";
        logger.style.animation = "loggerChopAction 0.4s infinite alternate ease-in-out";

        showTaskBanner("🪓 警告！光头强在砍树！快把他打跑！🌲");
        if (window.soundEngine) window.soundEngine.playWah();
    }

    function handleBattleInput() {
        if (!isInBattle) return;

        // 造成伤害
        loggerHP -= ATTACK_POWER;
        const progress = document.getElementById('battle-progress');
        progress.style.width = `${loggerHP}%`;

        // 弹出攻击角色
        spawnAttacker();

        // 播放打击声
        if (window.soundEngine) window.soundEngine.playPop();

        if (loggerHP <= 0) {
            winBattle();
        }
    }

    function spawnAttacker() {
        const char = attackers[Math.floor(Math.random() * attackers.length)];
        const el = document.createElement('div');
        el.className = 'battle-character';
        el.style.backgroundImage = `url('assets/${char}')`;
        el.style.left = `${Math.random() * 30 + 10}%`;
        el.style.top = `${Math.random() * 30 + 50}%`;
        
        document.getElementById('battle-overlay').appendChild(el);
        setTimeout(() => el.remove(), 500);
    }

    function winBattle() {
        if (!isInBattle) return;
        isInBattle = false;

        const logger = document.getElementById('battle-logger');
        logger.style.backgroundImage = "url('assets/logger-defeated.png')";
        logger.style.animation = "none";
        logger.style.transform = "scale(1.2)";

        showTaskBanner("🎉 胜利！光头强被打跑了！🌲✨");
        if (window.soundEngine) window.soundEngine.playCelebration();
        
        spawnConfetti();

        // 4秒后结束战斗状态
        setTimeout(() => {
            document.getElementById('battle-overlay').classList.add('hidden');
            const confettiLayer = document.getElementById('confetti-layer');
            confettiLayer.innerHTML = '';
        }, 4000);
    }

    function spawnConfetti() {
        const layer = document.getElementById('confetti-layer');
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#FFE66D', '#FF9F43'];
        for (let i = 0; i < 50; i++) {
            const c = document.createElement('div');
            c.className = 'confetti';
            c.style.left = `${Math.random() * 100}%`;
            c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            c.style.animationDelay = `${Math.random() * 2}s`;
            c.style.width = `${Math.random() * 10 + 5}px`;
            c.style.height = c.style.width;
            layer.appendChild(c);
        }
    }

    // --- 通用辅助 ---
    function showTaskBanner(text) {
        const banner = document.getElementById('task-banner');
        const taskText = document.getElementById('task-text');
        taskText.textContent = text;
        banner.classList.remove('hidden');
        setTimeout(() => banner.classList.add('hidden'), 3000);
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
        const chars = attackers;
        chars.forEach((c, i) => {
            const el = document.createElement('div');
            el.className = 'sprite anim-pop';
            el.style.backgroundImage = `url('assets/${c}')`;
            const size = 200 + Math.random() * 200;
            el.style.width = `${size}px`;
            el.style.height = `${size}px`;
            el.style.left = `${(i * 20) + Math.random() * 10}%`;
            el.style.top = `${Math.random() * 60 + 10}%`;
            layer.appendChild(el);
            setTimeout(() => el.remove(), 2500);
        });
        showTaskBanner("🔥 疯狂模式！大家集合保护森林！🔥");
    }

    function switchCursor() {
        cursorIndex = (cursorIndex + 1) % cursorEmojis.length;
        const emoji = cursorEmojis[cursorIndex];
        const canvas = document.createElement('canvas');
        canvas.width = 32; canvas.height = 32;
        const ctx = canvas.getContext('2d');
        ctx.font = '28px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 16, 16);
        document.body.style.cursor = `url(${canvas.toDataURL('image/png')}) 16 16, auto`;
    }

    let cursorSwitchCounter = 0;
    function maybeSwitch() {
        cursorSwitchCounter++;
        if (cursorSwitchCounter % 15 === 0) switchCursor();
    }

    return { 
        checkEasterEggs, 
        maybeSwitch, 
        handleBattleInput, 
        getIsInBattle: () => isInBattle 
    };
})();
