// 🐿️ 松鼠回家 - 小地图迷你游戏
// 5x5 格子，方向键导航蹦蹦回到小木屋

window.MiniMapGame = (() => {
    let isActive = false;
    let overlay = null;
    let gridSize = 5;
    let squirrelPos = { x: 0, y: 0 };
    let homePos = { x: 4, y: 4 };
    let correctPath = [];
    let pathIndex = 0;

    // 方向映射
    const dirMap = {
        'ArrowUp':    { dx: 0, dy: -1, label: '⬆️' },
        'ArrowDown':  { dx: 0, dy: 1,  label: '⬇️' },
        'ArrowLeft':  { dx: -1, dy: 0, label: '⬅️' },
        'ArrowRight': { dx: 1, dy: 0,  label: '➡️' },
    };

    function generatePath() {
        // 从起点到终点生成一条随机路径
        correctPath = [];
        let cx = 0, cy = 0;
        while (cx !== homePos.x || cy !== homePos.y) {
            const moves = [];
            if (cx < homePos.x) moves.push('ArrowRight');
            if (cy < homePos.y) moves.push('ArrowDown');
            if (cx > homePos.x) moves.push('ArrowLeft');
            if (cy > homePos.y) moves.push('ArrowUp');
            const pick = moves[Math.floor(Math.random() * moves.length)];
            const d = dirMap[pick];
            cx += d.dx;
            cy += d.dy;
            correctPath.push(pick);
        }
        pathIndex = 0;
    }

    function start() {
        if (isActive) return;
        isActive = true;
        squirrelPos = { x: 0, y: 0 };
        generatePath();

        overlay = document.getElementById('mini-map-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'mini-map-overlay';
            document.getElementById('game-container').appendChild(overlay);
        }
        overlay.classList.remove('hidden');
        overlay.innerHTML = '';

        // 标题
        const title = document.createElement('div');
        title.className = 'minimap-title';
        title.textContent = '🐿️ 帮蹦蹦回家！用方向键走路！🏠';
        overlay.appendChild(title);

        // 提示：下一步方向
        const hint = document.createElement('div');
        hint.id = 'minimap-hint';
        hint.className = 'minimap-hint';
        overlay.appendChild(hint);

        // 格子
        const grid = document.createElement('div');
        grid.className = 'map-grid';
        grid.id = 'map-grid';
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'map-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                if (x === homePos.x && y === homePos.y) {
                    cell.innerHTML = '🏠';
                    cell.classList.add('map-home');
                }
                grid.appendChild(cell);
            }
        }
        overlay.appendChild(grid);

        renderGrid();
        updateHint();

        if (window.soundEngine) window.soundEngine.playBoing();
    }

    function renderGrid() {
        const cells = document.querySelectorAll('#map-grid .map-cell');
        cells.forEach(c => {
            c.classList.remove('map-squirrel', 'map-visited');
            const cx = parseInt(c.dataset.x);
            const cy = parseInt(c.dataset.y);
            if (cx === squirrelPos.x && cy === squirrelPos.y) {
                c.innerHTML = '🐿️';
                c.classList.add('map-squirrel');
            } else if (cx === homePos.x && cy === homePos.y) {
                c.innerHTML = '🏠';
            } else {
                // 显示路径上的草地
                c.innerHTML = '🌿';
            }
        });
    }

    function updateHint() {
        const hint = document.getElementById('minimap-hint');
        if (!hint || pathIndex >= correctPath.length) return;
        const nextDir = correctPath[pathIndex];
        const d = dirMap[nextDir];
        hint.innerHTML = `下一步：<span class="hint-arrow">${d.label}</span>`;
    }

    function handleInput(code) {
        if (!isActive) return false;

        const dir = dirMap[code];
        if (!dir) return true; // 非方向键忽略但不传给其他系统

        const expectedDir = correctPath[pathIndex];
        if (code === expectedDir) {
            // 正确！移动松鼠
            squirrelPos.x += dir.dx;
            squirrelPos.y += dir.dy;
            pathIndex++;
            renderGrid();

            if (window.soundEngine) window.soundEngine.playPop();

            // 到家了？
            if (squirrelPos.x === homePos.x && squirrelPos.y === homePos.y) {
                win();
            } else {
                updateHint();
            }
        } else {
            // 错误方向！不移动，提示
            const hint = document.getElementById('minimap-hint');
            if (hint) {
                hint.innerHTML = `❌ 方向不对哦！试试 <span class="hint-arrow">${dirMap[expectedDir].label}</span>`;
                hint.classList.add('hint-wrong');
                setTimeout(() => {
                    hint.classList.remove('hint-wrong');
                    updateHint();
                }, 800);
            }
            if (window.soundEngine) window.soundEngine.playWah();
        }

        return true; // 消费了这个按键
    }

    function win() {
        const hint = document.getElementById('minimap-hint');
        if (hint) hint.innerHTML = '🎉 蹦蹦到家了！太棒了！🏠✨';

        if (window.soundEngine) window.soundEngine.playCelebration();

        // 撒花
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
