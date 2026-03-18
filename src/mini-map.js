// 🐿️ 松鼠回家 - 小地图迷你游戏 (v2.1.1 修复版)
// 5x5 格子，方向键导航蹦蹦回到小木屋，路径可见

window.MiniMapGame = (() => {
    let isActive = false;
    let overlay = null;
    const gridSize = 5;
    let squirrelPos = { x: 0, y: 0 };
    let homePos = { x: 4, y: 4 };
    let correctPath = [];
    let pathIndex = 0;
    let pathCells = []; // 路径上的所有格子坐标

    const dirMap = {
        'ArrowUp':    { dx: 0, dy: -1, label: '⬆️' },
        'ArrowDown':  { dx: 0, dy: 1,  label: '⬇️' },
        'ArrowLeft':  { dx: -1, dy: 0, label: '⬅️' },
        'ArrowRight': { dx: 1, dy: 0,  label: '➡️' },
    };

    function generatePath() {
        correctPath = [];
        pathCells = [{ x: 0, y: 0 }]; // 起点
        let cx = 0, cy = 0;
        while (cx !== homePos.x || cy !== homePos.y) {
            const moves = [];
            if (cx < homePos.x) moves.push('ArrowRight');
            if (cy < homePos.y) moves.push('ArrowDown');
            // 偶尔加入"绕路"让路径更有趣
            if (cx > 0 && Math.random() < 0.15) moves.push('ArrowLeft');
            if (cy > 0 && Math.random() < 0.15) moves.push('ArrowUp');
            const pick = moves[Math.floor(Math.random() * moves.length)];
            const d = dirMap[pick];
            cx += d.dx;
            cy += d.dy;
            // 防止出界
            if (cx < 0 || cx >= gridSize || cy < 0 || cy >= gridSize) {
                cx -= d.dx;
                cy -= d.dy;
                continue;
            }
            correctPath.push(pick);
            pathCells.push({ x: cx, y: cy });
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

        const title = document.createElement('div');
        title.className = 'minimap-title';
        title.textContent = '🐿️ 帮蹦蹦回家！按方向键沿着路走！🏠';
        overlay.appendChild(title);

        const hint = document.createElement('div');
        hint.id = 'minimap-hint';
        hint.className = 'minimap-hint';
        overlay.appendChild(hint);

        const grid = document.createElement('div');
        grid.className = 'map-grid';
        grid.id = 'map-grid';
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'map-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                grid.appendChild(cell);
            }
        }
        overlay.appendChild(grid);

        renderGrid();
        updateHint();
        if (window.soundEngine) window.soundEngine.playBoing();
    }

    function isOnPath(x, y) {
        return pathCells.some(p => p.x === x && p.y === y);
    }

    function renderGrid() {
        const cells = document.querySelectorAll('#map-grid .map-cell');
        cells.forEach(c => {
            c.className = 'map-cell';
            const cx = parseInt(c.dataset.x);
            const cy = parseInt(c.dataset.y);

            if (cx === squirrelPos.x && cy === squirrelPos.y) {
                c.innerHTML = '🐿️';
                c.classList.add('map-squirrel');
            } else if (cx === homePos.x && cy === homePos.y) {
                c.innerHTML = '🏠';
                c.classList.add('map-home');
            } else if (isOnPath(cx, cy)) {
                c.innerHTML = '🟫'; // 路径格子
                c.classList.add('map-path');
            } else {
                c.innerHTML = '🌿'; // 草地
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
        if (!dir) return true;

        const expectedDir = correctPath[pathIndex];
        if (code === expectedDir) {
            squirrelPos.x += dir.dx;
            squirrelPos.y += dir.dy;
            pathIndex++;
            renderGrid();
            if (window.soundEngine) window.soundEngine.playPop();

            if (squirrelPos.x === homePos.x && squirrelPos.y === homePos.y) {
                win();
            } else {
                updateHint();
            }
        } else {
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

        return true;
    }

    function win() {
        const hint = document.getElementById('minimap-hint');
        if (hint) hint.innerHTML = '🎉 蹦蹦到家了！太棒了！🏠✨';

        if (window.soundEngine) window.soundEngine.playCelebration();
        if (window.TaskSystem && window.TaskSystem.spawnConfettiPublic) {
            window.TaskSystem.spawnConfettiPublic();
        }

        setTimeout(() => {
            isActive = false;
            if (overlay) overlay.classList.add('hidden');
        }, 2500);
    }

    return {
        start,
        handleInput,
        getIsActive: () => isActive,
    };
})();
