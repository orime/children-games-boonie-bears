const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    // 创建浏览器窗口
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        frame: false,         // 无边框模式
        kiosk: true,          // 信息亭模式（全屏、置顶、无法退出）
        alwaysOnTop: true,    // 强制置顶
        skipTaskbar: true,    // 不在任务栏显示
        fullscreen: true,     // 确保全屏
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // 加载 index.html
    mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

    // 防止窗口被意外关闭
    mainWindow.on('close', (e) => {
        // 如果不是通过专门的退出逻辑调用，阻止关闭
        if (!app.isQuiting) {
            e.preventDefault();
        }
    });

    // 禁用默认菜单
    mainWindow.setMenu(null);
}

app.whenReady().then(() => {
    createWindow();

    // --- 全局按键拦截核心机制 ---

    // 1. 注册最高权限的安全退出键: Command+Shift+W (或者 Win+Shift+W)
    const exitShortcut = 'CommandOrControl+Shift+W';
    
    // Electron的globalShortcut优先级通常高于系统大部分默认快捷键
    globalShortcut.register(exitShortcut, () => {
        console.log('安全退出指令触发');
        app.isQuiting = true;
        app.quit();
    });

    // 2. 尝试吞掉其他常见的系统切换键，防止小孩切出程序 (Command+Tab, Command+Space等)
    // 注意: 在不同系统下，底层系统键(如Ctrl+Alt+Del)可能无法完全阻止，但结合 kiosk 模式已能防御绝大部分情况
    const blockKeys = [
        'CommandOrControl+Tab',
        'CommandOrControl+Shift+Tab',
        'CommandOrControl+Space',
        'CommandOrControl+Q',
        'Alt+Tab',
        'Alt+F4',
        'Option+Space',
        'Super+Tab' // Win/Cmd+Tab 变体
    ];

    blockKeys.forEach(key => {
        try {
            globalShortcut.register(key, () => {
                // 拦截到了，但不做任何动作 (黑洞)
                console.log(`已拦截尝试切出的按键: ${key}`);
            });
        } catch(e) {
            // 某些键如果系统级独占可能注册失败，静默忽略
        }
    });

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// 当所有窗口被关闭时退出（macOS 上通常不退出，但这里我们强制一致）
app.on('window-all-closed', function () {
    app.quit();
});

// 在退出前取消注册所有快捷键
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});
