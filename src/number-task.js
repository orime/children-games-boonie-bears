// 数字认知模块 — 按 1-9,0 显示超大数字+中文+计数动画

window.NumberTask = (() => {
    const numberMap = {
        '1': { cn: '一', emoji: '🦋', count: 1 },
        '2': { cn: '二', emoji: '🐿️', count: 2 },
        '3': { cn: '三', emoji: '🍎', count: 3 },
        '4': { cn: '四', emoji: '⭐', count: 4 },
        '5': { cn: '五', emoji: '🌸', count: 5 },
        '6': { cn: '六', emoji: '🍄', count: 6 },
        '7': { cn: '七', emoji: '🐞', count: 7 },
        '8': { cn: '八', emoji: '🐻', count: 8 },
        '9': { cn: '九', emoji: '🍯', count: 9 },
        '0': { cn: '十', emoji: '🌈', count: 10 },
    };

    // 追踪完成进度
    const recognized = new Set();

    function isNumberKey(key) {
        return key >= '0' && key <= '9';
    }

    function showNumber(key) {
        const info = numberMap[key];
        if (!info) return;

        const displayNum = key === '0' ? '10' : key;

        // 显示大数字
        const container = document.getElementById('number-display');
        const bigNum = document.getElementById('number-big');
        const cnText = document.getElementById('number-chinese');
        const countArea = document.getElementById('number-count-area');

        bigNum.textContent = displayNum;
        cnText.textContent = info.cn;
        
        // 计数动画：生成对应数量的 emoji
        countArea.innerHTML = '';
        for (let i = 0; i < info.count; i++) {
            const span = document.createElement('span');
            span.className = 'count-emoji';
            span.textContent = info.emoji;
            span.style.animationDelay = `${i * 0.15}s`;
            countArea.appendChild(span);
        }

        container.classList.remove('hidden');
        container.classList.add('anim-number-show');

        // 记录已认识的数字
        recognized.add(key);

        // 2.5秒后隐藏
        setTimeout(() => {
            container.classList.add('hidden');
            container.classList.remove('anim-number-show');

            // 检查是否全部认识了
            if (recognized.size === 10) {
                triggerCelebration();
                recognized.clear();
            }
        }, 2500);
    }

    function triggerCelebration() {
        // 彩虹庆祝动画
        const layer = document.getElementById('character-layer');
        const celebration = document.createElement('div');
        celebration.className = 'celebration-overlay';
        celebration.innerHTML = '<div class="celebration-text">🎉 太棒了！你认识了所有数字！🌈</div>';
        layer.appendChild(celebration);

        // 播放庆祝音效
        if (window.soundEngine) {
            window.soundEngine.playCelebration();
        }

        setTimeout(() => celebration.remove(), 4000);
    }

    return { isNumberKey, showNumber };
})();
