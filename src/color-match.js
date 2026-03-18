// 🌈 颜色配对迷你游戏
// 认识颜色，数字键1/2/3选择

window.ColorMatchGame = (() => {
    let isActive = false;
    let overlay = null;
    let correctIndex = -1;

    const colors = [
        { name: '红色', emoji: '🔴', css: '#FF5252' },
        { name: '蓝色', emoji: '🔵', css: '#448AFF' },
        { name: '绿色', emoji: '🟢', css: '#69F0AE' },
        { name: '黄色', emoji: '🟡', css: '#FFD740' },
        { name: '紫色', emoji: '🟣', css: '#E040FB' },
        { name: '橙色', emoji: '🟠', css: '#FF9800' },
    ];

    let targetColor = null;
    let options = [];

    function start() {
        if (isActive) return;
        isActive = true;

        // 随机选一个目标颜色
        targetColor = colors[Math.floor(Math.random() * colors.length)];

        // 生成3个选项（含正确答案）
        options = [targetColor];
        const others = colors.filter(c => c.name !== targetColor.name);
        while (options.length < 3) {
            const pick = others[Math.floor(Math.random() * others.length)];
            if (!options.find(o => o.name === pick.name)) {
                options.push(pick);
            }
        }
        // 打乱顺序
        options.sort(() => Math.random() - 0.5);
        correctIndex = options.findIndex(o => o.name === targetColor.name);

        overlay = document.getElementById('color-match-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'color-match-overlay';
            document.getElementById('game-container').appendChild(overlay);
        }
        overlay.classList.remove('hidden');
        overlay.innerHTML = '';

        // 标题
        const title = document.createElement('div');
        title.className = 'color-title';
        title.textContent = '🌈 这是什么颜色？';
        overlay.appendChild(title);

        // 大色块
        const bigCircle = document.createElement('div');
        bigCircle.className = 'color-big-circle';
        bigCircle.style.backgroundColor = targetColor.css;
        bigCircle.textContent = targetColor.emoji;
        overlay.appendChild(bigCircle);

        // 3个选项
        const optContainer = document.createElement('div');
        optContainer.className = 'color-options';
        options.forEach((opt, i) => {
            const btn = document.createElement('div');
            btn.className = 'color-option';
            btn.innerHTML = `<span class="color-key">${i + 1}</span> ${opt.name}`;
            optContainer.appendChild(btn);
        });
        overlay.appendChild(optContainer);

        // 反馈区
        const feedback = document.createElement('div');
        feedback.className = 'color-feedback';
        feedback.id = 'color-feedback';
        feedback.textContent = '按数字键 1、2 或 3 选择';
        overlay.appendChild(feedback);

        if (window.soundEngine) window.soundEngine.playBoing();
    }

    function handleInput(key) {
        if (!isActive) return false;

        const idx = parseInt(key) - 1;
        if (idx < 0 || idx > 2) return true; // 非1/2/3忽略

        const feedback = document.getElementById('color-feedback');
        if (idx === correctIndex) {
            // 正确！
            if (feedback) feedback.innerHTML = `✅ 对了！这是${targetColor.name}！${targetColor.emoji}`;
            if (window.soundEngine) window.soundEngine.playCelebration();
            if (window.TaskSystem && window.TaskSystem.spawnConfettiPublic) {
                window.TaskSystem.spawnConfettiPublic();
            }
            setTimeout(() => {
                isActive = false;
                if (overlay) overlay.classList.add('hidden');
            }, 2500);
        } else {
            // 错误
            if (feedback) {
                feedback.innerHTML = `❌ 不对哦，再试试！`;
                feedback.classList.add('hint-wrong');
                setTimeout(() => feedback.classList.remove('hint-wrong'), 500);
            }
            if (window.soundEngine) window.soundEngine.playWah();
        }

        return true;
    }

    return {
        start,
        handleInput,
        getIsActive: () => isActive,
    };
})();
