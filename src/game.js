// 熊出没按键游戏核心逻辑

document.addEventListener('DOMContentLoaded', () => {
    // 元素获取
    const startScreen = document.getElementById('start-screen');
    const startBtn = document.getElementById('start-btn');
    const bgLayer = document.getElementById('background');
    const charLayer = document.getElementById('character-layer');
    const fxCanvas = document.getElementById('fx-canvas');
    const ctx = fxCanvas.getContext('2d');
    const exitOverlay = document.getElementById('exit-overlay');
    const exitProgress = document.getElementById('exit-progress');
    
    // 闪烁层注入
    const flashLayer = document.createElement('div');
    flashLayer.id = 'flash-layer';
    document.getElementById('game-container').appendChild(flashLayer);

    // 游戏状态
    let isPlaying = false;
    let keyCount = 0;
    
    // 退出机制密码（上上下下左右左右）
    const exitCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'];
    let exitCodeIndex = 0;
    
    // 长按退出机制
    let exitTimer = null;
    let isExitKeyHeld = false;
    const EXIT_HOLD_TIME = 3000; // 3秒

    // 调整画布尺寸
    function resizeCanvas() {
        fxCanvas.width = window.innerWidth;
        fxCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // 开始游戏
    startBtn.addEventListener('click', async () => {
        // 初始化声音引擎（必须在用户交互后调用）
        window.soundEngine.init();
        
        // 尝试全屏
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
        }, 500);
    });

    // --- 按键拦截核心逻辑 ---
    
    // 禁用右键菜单
    document.addEventListener('contextmenu', e => e.preventDefault());
    
    // 拦截所有可以拦截的按键
    window.addEventListener('keydown', (e) => {
        if (!isPlaying) return;
        
        // 强力拦截：阻止绝大部分系统级按键 (ESC, F1-F12, Alt, Command, Tab等)
        e.preventDefault();
        e.stopPropagation();
        
        // --- 检查退出机制 1: 密码 ---
        if (e.code === exitCode[exitCodeIndex]) {
            exitCodeIndex++;
            if (exitCodeIndex === exitCode.length) {
                exitGame();
                return;
            }
        } else {
            exitCodeIndex = 0;
        }

        // --- 检查退出机制 2: 长按 Command (Mac) / Ctrl (Win) + Shift + W ---
        // e.metaKey is Command on Mac. e.ctrlKey is for Windows fallback.
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.code === 'KeyW') {
            if (!isExitKeyHeld) {
                isExitKeyHeld = true;
                exitOverlay.classList.remove('hidden');
                exitOverlay.style.opacity = '1';
                exitProgress.style.width = '100%';
                exitProgress.style.transition = `width ${EXIT_HOLD_TIME/1000}s linear`;
                
                exitTimer = setTimeout(() => {
                    exitGame();
                }, EXIT_HOLD_TIME);
            }
            return; // 不触发其他特效
        }

        // 触发互动特效
        if (!e.repeat) { // 防止长按重复触发太多次
            triggerRandomEffect(e);
        }
    }, { capture: true });

    window.addEventListener('keyup', (e) => {
        if (!isPlaying) return;
        e.preventDefault();
        e.stopPropagation();
        
        // 停止长按退出
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

    // --- 互动特效逻辑 ---
    function triggerRandomEffect(e) {
        keyCount++;
        
        // 1. 播放声音
        window.soundEngine.playRandom();
        
        // 2. 屏幕特效 (震动 & 闪光)
        const randEffect = Math.random();
        if (randEffect < 0.1) {
            // 强力震动
            document.body.classList.remove('anim-shake', 'anim-shake-hard');
            void document.body.offsetWidth; // trigger reflow
            document.body.classList.add('anim-shake-hard');
        } else if (randEffect < 0.3) {
            // 普通震动
            document.body.classList.remove('anim-shake', 'anim-shake-hard');
            void document.body.offsetWidth;
            document.body.classList.add('anim-shake');
        }
        
        // 偶尔闪屏 (类似打雷或拍照)
        if (Math.random() < 0.05) {
            flashLayer.classList.remove('anim-flash');
            void flashLayer.offsetWidth;
            flashLayer.classList.add('anim-flash');
        }

        // 3. 随机角色动画 (熊大、熊二、光头强) - 增加概率
        if (Math.random() < 0.6) {
            spawnCharacter();
        }

        // 4. 文字特效弹出 (使用按键对应字符如果可用，否则随机表情)
        let text = e.key;
        // 过滤掉系统按键比如 "Escape", "Meta", "Shift" 避免在屏幕上打出长串文字
        if (text.length > 1) {
            // 加入更多与森林和熊出没相关的元素
            const emojis = ['🌲', '🐻', '🍯', '🪵', '🪓', '🍄', '🍎', '🍓', '🦋', '🐞', '☀️', '☁️', '🐿️', '🌈', '🐾', '🍃', '✨'];
            text = emojis[Math.floor(Math.random() * emojis.length)];
        }
        spawnBigText(text);
        
        // 5. 每隔 M 次按键切换森林的日/夜景 (增强频率让孩子更容易看到变化)
        if (keyCount % 30 === 0) {
            bgLayer.classList.toggle('night');
        }
    }

    // 生成角色
    function spawnCharacter() {
        // 大量增加熊大熊二光头强的出现频率
        const characters = ['bear-big.png', 'bear-big.png', 'bear-small.png', 'bear-small.png', 'logger.png', 'logger.png'];
        const charType = characters[Math.floor(Math.random() * characters.length)];
        
        const el = document.createElement('div');
        el.className = 'sprite';
        el.style.backgroundImage = `url('assets/${charType}')`;
        // 随机大小，有些很大有些小
        const size = Math.random() * 300 + 200; 
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.top = `${Math.random() * (window.innerHeight - size)}px`;
        
        // 更多样的动画：从左、从右、中心旋转放大
        const animType = Math.random();
        if (animType < 0.4) {
            el.style.left = `-${size}px`;
            el.classList.add('anim-slide-right');
        } else if (animType < 0.8) {
            el.style.left = `${window.innerWidth}px`;
            el.style.transform = 'scaleX(-1)'; // 翻转
            el.classList.add('anim-slide-left');
        } else {
            // 中心弹出并旋转消失
            el.style.left = `${window.innerWidth/2 - size/2}px`;
            el.style.top = `${window.innerHeight/2 - size/2}px`;
            el.classList.add('anim-pop');
            setTimeout(() => {
                el.classList.remove('anim-pop');
                el.classList.add('anim-spin-out');
            }, 1000);
        }
        
        charLayer.appendChild(el);
        
        // 动画结束后移除
        setTimeout(() => {
            el.remove();
        }, 3000);
    }

    // 生成大字体
    function spawnBigText(text) {
        const el = document.createElement('div');
        el.className = 'big-text';
        el.innerText = text.toUpperCase();
        el.style.left = `${Math.random() * (window.innerWidth - 200) + 100}px`;
        el.style.top = `${Math.random() * (window.innerHeight - 200) + 100}px`;
        
        const colors = ['#FF5252', '#FF4081', '#E040FB', '#7C4DFF', '#536DFE', '#448AFF', '#40C4FF', '#18FFFF', '#64FFDA', '#69F0AE', '#B2FF59', '#EEFF41', '#FFFF00', '#FFD740', '#FFAB40', '#FF6E40'];
        el.style.color = colors[Math.floor(Math.random() * colors.length)];
        
        charLayer.appendChild(el);
        
        setTimeout(() => {
            el.remove();
        }, 1500);
    }

    // 绘制一些简单的粒子 (可以作为扩展)
    // function drawParticles() { ... }

    // 退出游戏
    function exitGame() {
        isPlaying = false;
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(e => console.log(e));
        }
        exitOverlay.innerHTML = "<p>已退出游戏</p><p style='font-size:1.5rem; margin-top:20px'>可以关闭此页面或刷新重新开始</p>";
        exitOverlay.classList.remove('hidden');
        exitOverlay.style.opacity = '1';
    }

    // 防止右键菜单和触摸缩放
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
});
