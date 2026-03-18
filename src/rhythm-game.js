// 🎵 节奏跟拍迷你游戏
// 方向键跟着节奏按，连续答对6次→欢呼

window.RhythmGame = (() => {
    let isActive = false;
    let overlay = null;
    let sequence = [];
    let currentStep = 0;
    let showingStep = -1;
    const TOTAL_STEPS = 6;

    const directions = [
        { code: 'ArrowUp',    emoji: '⬆️', color: '#FF5252' },
        { code: 'ArrowDown',  emoji: '⬇️', color: '#448AFF' },
        { code: 'ArrowLeft',  emoji: '⬅️', color: '#69F0AE' },
        { code: 'ArrowRight', emoji: '➡️', color: '#FFD740' },
    ];

    function generateSequence() {
        sequence = [];
        for (let i = 0; i < TOTAL_STEPS; i++) {
            sequence.push(directions[Math.floor(Math.random() * directions.length)]);
        }
        currentStep = 0;
    }

    function start() {
        if (isActive) return;
        isActive = true;
        generateSequence();

        overlay = document.getElementById('rhythm-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'rhythm-overlay';
            document.getElementById('game-container').appendChild(overlay);
        }
        overlay.classList.remove('hidden');
        overlay.innerHTML = '';

        // 标题
        const title = document.createElement('div');
        title.className = 'rhythm-title';
        title.textContent = '🎵 跟着节奏按方向键！';
        overlay.appendChild(title);

        // 节奏显示区
        const display = document.createElement('div');
        display.className = 'rhythm-display';
        display.id = 'rhythm-display';
        overlay.appendChild(display);

        // 进度
        const progress = document.createElement('div');
        progress.className = 'rhythm-progress';
        progress.id = 'rhythm-progress';
        overlay.appendChild(progress);

        // 高亮当前要按的方向
        showCurrentStep();

        if (window.soundEngine) window.soundEngine.playBoing();
    }

    function showCurrentStep() {
        if (currentStep >= TOTAL_STEPS) return;
        const display = document.getElementById('rhythm-display');
        if (!display) return;

        const step = sequence[currentStep];
        display.innerHTML = `<div class="rhythm-arrow" style="color:${step.color}">${step.emoji}</div>`;
        display.querySelector('.rhythm-arrow').classList.add('rhythm-pulse');

        // 更新进度
        const progress = document.getElementById('rhythm-progress');
        if (progress) {
            progress.innerHTML = '';
            for (let i = 0; i < TOTAL_STEPS; i++) {
                const dot = document.createElement('span');
                dot.className = 'rhythm-dot';
                if (i < currentStep) dot.classList.add('rhythm-dot-done');
                if (i === currentStep) dot.classList.add('rhythm-dot-current');
                dot.textContent = i < currentStep ? '✅' : '⭕';
                progress.appendChild(dot);
            }
        }
    }

    function handleInput(code) {
        if (!isActive) return false;

        const expected = sequence[currentStep];
        if (!expected) return true;

        // 只处理方向键
        if (!directions.some(d => d.code === code)) return true;

        if (code === expected.code) {
            // 正确！
            currentStep++;
            if (window.soundEngine) window.soundEngine.playPop();

            const display = document.getElementById('rhythm-display');
            if (display) {
                display.innerHTML = '<div class="rhythm-feedback">✅ 对了！</div>';
            }

            if (currentStep >= TOTAL_STEPS) {
                win();
            } else {
                setTimeout(() => showCurrentStep(), 500);
            }
        } else {
            // 错误，温柔提示
            const display = document.getElementById('rhythm-display');
            if (display) {
                display.innerHTML = `<div class="rhythm-feedback" style="color:#FF9800">再试试 ${expected.emoji}</div>`;
            }
            if (window.soundEngine) window.soundEngine.playWah();
            setTimeout(() => showCurrentStep(), 600);
        }

        return true;
    }

    function win() {
        const display = document.getElementById('rhythm-display');
        if (display) {
            display.innerHTML = '<div class="rhythm-feedback" style="font-size:3rem">🎉 完美节奏！太棒了！🎶</div>';
        }
        if (window.soundEngine) window.soundEngine.playCelebration();
        if (window.TaskSystem && window.TaskSystem.spawnConfettiPublic) {
            window.TaskSystem.spawnConfettiPublic();
        }
        setTimeout(() => {
            isActive = false;
            if (overlay) overlay.classList.add('hidden');
        }, 3000);
    }

    return {
        start,
        handleInput,
        getIsActive: () => isActive,
    };
})();
