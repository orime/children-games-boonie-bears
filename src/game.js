// 熊出没按键游戏核心逻辑 — v2.1 (迷你游戏版)

document.addEventListener('DOMContentLoaded', () => {
    // 元素获取
    const startScreen = document.getElementById('start-screen');
    const startBtn = document.getElementById('start-btn');
    const bgLayer = document.getElementById('background');
    const charLayer = document.getElementById('character-layer');
    const particleLayer = document.getElementById('particle-layer');
    const fxCanvas = document.getElementById('fx-canvas');
    const ctx = fxCanvas.getContext('2d');
    const exitOverlay = document.getElementById('exit-overlay');
    const exitProgress = document.getElementById('exit-progress');
    const seasonIndicator = document.getElementById('season-indicator');
    const seasonEmoji = document.getElementById('season-emoji');
    const seasonName = document.getElementById('season-name');

    // 闪烁层注入
    const flashLayer = document.createElement('div');
    flashLayer.id = 'flash-layer';
    document.getElementById('game-container').appendChild(flashLayer);

    // 游戏状态
    let isPlaying = false;
    let keyCount = 0;
    const MAX_DOM_SPRITES = 15; // DOM 元素上限，防止内存泄漏

    // 四季系统
    const seasons = [
        { name: '春天', emoji: '🌸', css: 'season-spring', particles: ['🌸', '🌺', '🦋', '💐'] },
        { name: '夏天', emoji: '☀️', css: 'season-summer', particles: ['☀️', '🌻', '🐝', '🌿'] },
        { name: '秋天', emoji: '🍂', css: 'season-autumn', particles: ['🍂', '🍁', '🍎', '🌰'] },
        { name: '冬天', emoji: '❄️', css: 'season-winter', particles: ['❄️', '⛄', '🌨️', '✨'] },
    ];
    let currentSeason = 0;

    // 角色+道具列表
    const characters = [
        'bear-big.png', 'bear-big.png',
        'bear-small.png', 'bear-small.png',
        'logger.png',
        'jiji-king.png',
        'bengbeng.png',
        'honey-pot.png',
        'mushroom.png',
        'log-cabin.png',
        'tree-stump.png',
        'butterflies.png',
        'logging-truck.png'
    ];

    // 退出机制
    const exitCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'];
    let exitCodeIndex = 0;
    let exitTimer = null;
    let isExitKeyHeld = false;
    const EXIT_HOLD_TIME = 3000;

    // 粒子定时器
    let particleInterval = null;

    // 调整画布尺寸
    function resizeCanvas() {
        fxCanvas.width = window.innerWidth;
        fxCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // ===== 开始游戏 =====
    startBtn.addEventListener('click', async () => {
        window.soundEngine.init();

        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            }
        } catch (e) {
            console.log("全屏请求被拒绝", e);
        }

        startScreen.style.opacity = '0';
        setTimeout(() => {
            startScreen.style.display = 'none';
            isPlaying = true;
            seasonIndicator.classList.add('show');
            startParticles();
        }, 500);
    });

    // ===== 四季切换 =====
    function switchSeason() {
        currentSeason = (currentSeason + 1) % seasons.length;
        const s = seasons[currentSeason];
        bgLayer.className = s.css;
        seasonEmoji.textContent = s.emoji;
        seasonName.textContent = s.name;

        const banner = document.getElementById('task-banner');
        const taskText = document.getElementById('task-text');
        taskText.textContent = `${s.emoji} ${s.name}来了！${s.emoji}`;
        banner.classList.remove('hidden');
        setTimeout(() => banner.classList.add('hidden'), 2000);
    }

    // ===== 粒子系统 =====
    function startParticles() {
        if (particleInterval) clearInterval(particleInterval);
        particleInterval = setInterval(spawnParticle, 600);
    }

    function spawnParticle() {
        if (!isPlaying) return;
        const s = seasons[currentSeason];
        const p = document.createElement('span');
        p.className = 'particle';
        p.textContent = s.particles[Math.floor(Math.random() * s.particles.length)];
        p.style.left = `${Math.random() * 100}%`;
        p.style.fontSize = `${1 + Math.random() * 2}rem`;
        p.style.animationDuration = `${3 + Math.random() * 4}s`;
        particleLayer.appendChild(p);
        setTimeout(() => p.remove(), 7000);
    }

    // ===== 按键拦截核心 =====
    document.addEventListener('contextmenu', e => e.preventDefault());

    window.addEventListener('keydown', (e) => {
        if (!isPlaying) return;
        e.preventDefault();
        e.stopPropagation();

        // 退出机制 1: 方向键密码（只在无迷你游戏时检测）
        const anyMiniActive = isMiniGameActive();
        if (!anyMiniActive) {
            if (e.code === exitCode[exitCodeIndex]) {
                exitCodeIndex++;
                if (exitCodeIndex === exitCode.length) {
                    exitGame();
                    return;
                }
            } else {
                exitCodeIndex = 0;
            }
        }

        // 退出机制 2: 长按 Cmd+Shift+W
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === 'KeyW') {
            if (!isExitKeyHeld) {
                isExitKeyHeld = true;
                exitOverlay.classList.remove('hidden');
                exitOverlay.style.opacity = '1';
                exitProgress.style.width = '100%';
                exitProgress.style.transition = `width ${EXIT_HOLD_TIME/1000}s linear`;
                exitTimer = setTimeout(() => exitGame(), EXIT_HOLD_TIME);
            }
            return;
        }

        // 不重复触发
        if (!e.repeat) {
            routeInput(e);
        }
    }, { capture: true });

    window.addEventListener('keyup', (e) => {
        if (!isPlaying) return;
        e.preventDefault();
        e.stopPropagation();

        if (e.code === 'KeyW' || e.key === 'Meta' || e.key === 'Control' || e.key === 'Shift') {
            if (isExitKeyHeld) {
                isExitKeyHeld = false;
                clearTimeout(exitTimer);
                exitOverlay.classList.add('hidden');
                exitProgress.style.transition = 'none';
                exitProgress.style.width = '0%';
            }
        }
    }, { capture: true });

    // ===== 辅助：检查迷你游戏状态 =====
    function isMiniGameActive() {
        return (window.MiniMapGame && window.MiniMapGame.getIsActive()) ||
               (window.RhythmGame && window.RhythmGame.getIsActive()) ||
               (window.ColorMatchGame && window.ColorMatchGame.getIsActive());
    }

    // ===== 统一输入路由 =====
    function routeInput(e) {
        keyCount++;

        // 1. 优先：迷你游戏输入
        if (window.MiniMapGame && window.MiniMapGame.getIsActive()) {
            if (window.MiniMapGame.handleInput(e.code)) return;
        }
        if (window.RhythmGame && window.RhythmGame.getIsActive()) {
            if (window.RhythmGame.handleInput(e.code)) return;
        }
        if (window.ColorMatchGame && window.ColorMatchGame.getIsActive()) {
            if (window.ColorMatchGame.handleInput(e.key)) return;
        }

        // 2. 战斗系统
        if (window.TaskSystem && window.TaskSystem.getIsInBattle()) {
            window.TaskSystem.handleBattleInput(e.code);
            return;
        }

        // 3. 播放声音
        window.soundEngine.playRandom();

        // 4. 数字键 → 数字认知模块
        if (window.NumberTask && window.NumberTask.isNumberKey(e.key)) {
            window.NumberTask.showNumber(e.key);
            return;
        }

        // 5. 彩蛋检查
        if (window.TaskSystem) {
            const eggTriggered = window.TaskSystem.checkEasterEggs(e.key);
            window.TaskSystem.maybeSwitch();
            if (eggTriggered) return;
        }

        // 6. 随机触发迷你游戏
        if (window.TaskSystem && window.TaskSystem.maybeStartMiniGame(keyCount)) {
            return;
        }

        // 7. 闪光
        if (Math.random() < 0.04) {
            flashLayer.classList.remove('anim-flash');
            void flashLayer.offsetWidth;
            flashLayer.classList.add('anim-flash');
        }

        // 8. 随机角色飞入
        if (Math.random() < 0.55) {
            spawnCharacter();
        }

        // 9. 文字/Emoji 弹出
        let text = e.key;
        if (text.length > 1) {
            const emojis = ['🌲', '🐻', '🍯', '🪵', '🪓', '🍄', '🍎', '🍓', '🦋', '🐞', '☀️', '☁️', '🐿️', '🌈', '🐾', '🍃', '✨', '🌺', '🍂', '❄️'];
            text = emojis[Math.floor(Math.random() * emojis.length)];
        }
        spawnBigText(text);

        // 10. 四季切换
        if (keyCount % 40 === 0) {
            switchSeason();
        }
    }

    // ===== 生成角色 =====
    function spawnCharacter() {
        // DOM 限制
        if (charLayer.children.length >= MAX_DOM_SPRITES) return;

        const charType = characters[Math.floor(Math.random() * characters.length)];
        const el = document.createElement('div');
        el.className = 'sprite';
        el.style.backgroundImage = `url('assets/${charType}')`;
        const size = Math.random() * 250 + 180;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.top = `${Math.random() * (window.innerHeight - size)}px`;

        const animType = Math.random();
        if (animType < 0.35) {
            el.style.left = `-${size}px`;
            el.classList.add('anim-slide-right');
        } else if (animType < 0.7) {
            el.style.left = `${window.innerWidth}px`;
            el.style.transform = 'scaleX(-1)';
            el.classList.add('anim-slide-left');
        } else {
            el.style.left = `${window.innerWidth/2 - size/2}px`;
            el.style.top = `${window.innerHeight/2 - size/2}px`;
            el.classList.add('anim-pop');
            setTimeout(() => {
                el.classList.remove('anim-pop');
                el.classList.add('anim-spin-out');
            }, 1000);
        }

        charLayer.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }

    // ===== 生成大字体 =====
    function spawnBigText(text) {
        if (charLayer.children.length >= MAX_DOM_SPRITES) return;

        const el = document.createElement('div');
        el.className = 'big-text';
        el.innerText = text.toUpperCase();
        el.style.left = `${Math.random() * (window.innerWidth - 200) + 100}px`;
        el.style.top = `${Math.random() * (window.innerHeight - 200) + 100}px`;

        const colors = ['#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', '#448AFF', '#40C4FF', '#18FFFF', '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41', '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'];
        el.style.color = colors[Math.floor(Math.random() * colors.length)];

        charLayer.appendChild(el);
        setTimeout(() => el.remove(), 1500);
    }

    // ===== 退出游戏 =====
    function exitGame() {
        isPlaying = false;
        if (particleInterval) clearInterval(particleInterval);
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(e => console.log(e));
        }
        exitOverlay.innerHTML = "<p>已退出游戏</p><p style='font-size:1.5rem; margin-top:20px'>可以关闭此页面或刷新重新开始</p>";
        exitOverlay.classList.remove('hidden');
        exitOverlay.style.opacity = '1';
    }

    // 防止触摸缩放
    document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
});
