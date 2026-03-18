// 核心任务系统：保卫森林战斗模块 + 隐藏彩蛋 + 迷你游戏调度 (v2.1.1 bugfix)

window.TaskSystem = (() => {
    // --- 状态追踪 ---
    let lastKey = '';
    let sameKeyCount = 0;
    let spaceCount = 0;
    let rapidKeyTimestamps = [];
    
    // --- 战斗系统状态 ---
    let isInBattle = false;
    let loggerHP = 100;
    const ATTACK_POWER = 5;
    const ATTACK_POWER_AIMED = 10;
    let aimDirection = null;
    
    // --- 角色与元素 ---
    const attackers = ['bear-big.png', 'bear-small.png', 'jiji-king.png', 'bengbeng.png', 'bear-big-angry.png'];
    const cursorEmojis = ['🐾', '🪓', '🍯', '🦋', '⭐', '🐻', '🌲'];
    let cursorIndex = 0;

    // --- 迷你游戏调度 ---
    let miniGameCooldown = false;

    function isAnyGameActive() {
        return isInBattle ||
               (window.MiniMapGame && window.MiniMapGame.getIsActive()) ||
               (window.RhythmGame && window.RhythmGame.getIsActive()) ||
               (window.ColorMatchGame && window.ColorMatchGame.getIsActive());
    }

    function checkEasterEggs(key) {
        // 任何游戏活跃中或冷却中：不触发新彩蛋，但返回 false 让正常游戏继续
        if (isAnyGameActive() || miniGameCooldown) return false;

        // 彩蛋1: 连按同一键 15 次 → 光头强砍树战斗（提高门槛）
        if (key === lastKey) {
            sameKeyCount++;
        } else {
            lastKey = key;
            sameKeyCount = 1;
        }

        if (sameKeyCount === 15) {
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

        // 彩蛋3: 疯狂模式（1秒内超过10次按键）
        const now = Date.now();
        rapidKeyTimestamps.push(now);
        rapidKeyTimestamps = rapidKeyTimestamps.filter(t => now - t < 1000);
        if (rapidKeyTimestamps.length >= 10) {
            rapidKeyTimestamps = [];
            triggerCrazyMode();
            return true;
        }

        return false;
    }

    // ========= 战斗逻辑 (改进版) =========
    function startBattle() {
        if (isAnyGameActive()) return;
        isInBattle = true;
        loggerHP = 100;

        const overlay = document.getElementById('battle-overlay');
        const progress = document.getElementById('battle-progress');
        const logger = document.getElementById('battle-logger');

        overlay.classList.remove('hidden');
        progress.style.width = '100%';
        
        // 光头强在左，树在右（斧子朝右砍）
        logger.innerHTML = `
            <div class="battle-scene">
                <img src="assets/logger-chopping.png" class="battle-logger-img" />
                <img src="assets/big-tree.png" class="battle-tree" />
            </div>
            <div id="aim-indicator" class="aim-indicator"></div>
        `;

        showTaskBanner("🪓 光头强在砍树！快按方向键瞄准打他！🌲");
        if (window.soundEngine) window.soundEngine.playWah();
        updateAimDirection();
    }

    function updateAimDirection() {
        const dirs = [
            { code: 'ArrowUp', emoji: '⬆️' },
            { code: 'ArrowDown', emoji: '⬇️' },
            { code: 'ArrowLeft', emoji: '⬅️' },
            { code: 'ArrowRight', emoji: '➡️' },
        ];
        aimDirection = dirs[Math.floor(Math.random() * dirs.length)];
        const indicator = document.getElementById('aim-indicator');
        if (indicator) {
            indicator.textContent = aimDirection.emoji;
            indicator.classList.remove('aim-flash');
            void indicator.offsetWidth;
            indicator.classList.add('aim-flash');
        }
    }

    function handleBattleInput(code) {
        if (!isInBattle) return;

        let damage = 2;
        if (aimDirection && code === aimDirection.code) {
            damage = ATTACK_POWER_AIMED;
        } else if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(code)) {
            damage = ATTACK_POWER;
        } else {
            damage = 3;
        }

        loggerHP = Math.max(0, loggerHP - damage);
        const progress = document.getElementById('battle-progress');
        if (progress) progress.style.width = `${loggerHP}%`;

        spawnAttacker();
        if (window.soundEngine) window.soundEngine.playPop();

        if (damage >= ATTACK_POWER) updateAimDirection();
        if (loggerHP <= 0) winBattle();
    }

    function spawnAttacker() {
        const overlay = document.getElementById('battle-overlay');
        if (!overlay) return;
        const char = attackers[Math.floor(Math.random() * attackers.length)];
        const el = document.createElement('div');
        el.className = 'battle-character';
        el.style.backgroundImage = `url('assets/${char}')`;
        el.style.left = `${Math.random() * 30 + 10}%`;
        el.style.top = `${Math.random() * 30 + 50}%`;
        overlay.appendChild(el);
        setTimeout(() => el.remove(), 500);
    }

    function winBattle() {
        if (!isInBattle) return;
        isInBattle = false;

        const logger = document.getElementById('battle-logger');
        if (logger) {
            logger.innerHTML = `
                <div class="battle-scene">
                    <img src="assets/logger-defeated.png" class="battle-logger-img battle-defeated" />
                    <img src="assets/big-tree.png" class="battle-tree" />
                </div>
            `;
        }

        showTaskBanner("🎉 胜利！光头强被打跑了！🌲✨");
        if (window.soundEngine) window.soundEngine.playCelebration();
        spawnConfetti();

        // 1.5秒后消失，不设 cooldown 阻断按键
        setTimeout(() => {
            document.getElementById('battle-overlay').classList.add('hidden');
            document.getElementById('confetti-layer').innerHTML = '';
        }, 1500);
    }

    function spawnConfetti() {
        const layer = document.getElementById('confetti-layer');
        if (!layer) return;
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

    // ========= 通用辅助 =========
    function showTaskBanner(text) {
        const banner = document.getElementById('task-banner');
        const taskText = document.getElementById('task-text');
        if (!banner || !taskText) return;
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
        attackers.forEach((c, i) => {
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

    // 迷你游戏随机触发（均衡分配）
    function maybeStartMiniGame(keyCount) {
        if (isAnyGameActive() || miniGameCooldown) return false;

        // 每60次按键触发一次
        const shouldTrigger = (keyCount > 0 && keyCount % 60 === 0);
        if (!shouldTrigger) return false;

        miniGameCooldown = true;
        setTimeout(() => { miniGameCooldown = false; }, 10000); // 10秒冷却

        // 均衡分配：轮流触发
        const gamePool = [];
        if (window.MiniMapGame) gamePool.push(() => window.MiniMapGame.start());
        if (window.RhythmGame) gamePool.push(() => window.RhythmGame.start());
        if (window.ColorMatchGame) gamePool.push(() => window.ColorMatchGame.start());
        // 随机 0-20% 概率触发战斗
        gamePool.push(() => startBattle());
        gamePool.push(() => startBattle()); // 战斗权重低（2/5）

        const pick = gamePool[Math.floor(Math.random() * gamePool.length)];
        pick();
        return true;
    }

    return { 
        checkEasterEggs, 
        maybeSwitch, 
        handleBattleInput, 
        getIsInBattle: () => isInBattle,
        isAnyGameActive,
        spawnConfettiPublic: spawnConfetti,
        maybeStartMiniGame,
    };
})();
