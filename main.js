const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { startOAuth, getTokenFromCode, oAuth2Client, isTokenExpired } = require('./modules/auth');
const { createPermissionSheet, listWorkspaces } = require('./modules/sheetManager');
const TOKEN_PATH = path.join(__dirname, 'token.json');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload/preload.js')
        }
    });

    handleTokenAndLoadWindow();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function handleTokenAndLoadWindow() {
    if (fs.existsSync(TOKEN_PATH)) {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
        oAuth2Client.setCredentials(token);

        if (isTokenExpired()) {
            fs.unlinkSync(TOKEN_PATH);
            mainWindow.loadFile('pages/login.html');
        } else {
            mainWindow.loadFile('pages/workspaceSelection.html');
        }
    } else {
        mainWindow.loadFile('pages/login.html');
    }
}

app.whenReady().then(createWindow);

// OAuth處理
ipcMain.handle('start-oauth', async () => {
    try {
        const authUrl = await startOAuth();
        let authWindow = new BrowserWindow({
            width: 500,
            height: 600,
            parent: mainWindow,
            modal: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            }
        });

        authWindow.loadURL(authUrl);

        authWindow.on('closed', () => {
            authWindow = null;
        });

        return new Promise((resolve, reject) => {
            authWindow.webContents.on('did-finish-load', async () => {
                const currentUrl = authWindow.webContents.getURL();
                if (currentUrl.startsWith('http://localhost')) {
                    const urlParams = new URLSearchParams(new URL(currentUrl).search);
                    const code = urlParams.get('code');
                    if (code) {
                        const tokens = await getTokenFromCode(code);
                        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
                        oAuth2Client.setCredentials(tokens);
                        mainWindow.loadFile('pages/workspaceSelection.html');
                        authWindow.close();
                        resolve(tokens);
                    }
                }
            });

            authWindow.on('closed', () => {
                reject(new Error('OAuth窗口已關閉'));
            });
        });
    } catch (error) {
        console.error('OAuth 過程中發生錯誤:', error);
    }
});

// 創建新工作空間
ipcMain.handle('createNewWorkspace', async (event, workspaceName) => {
    if (!workspaceName || typeof workspaceName !== 'string' || workspaceName.trim() === '') {
        console.error('工作空間名稱無效');
        return;
    }

    try {
        const newSheetId = await createPermissionSheet(workspaceName.trim());
        if (newSheetId) {
            mainWindow.loadFile('pages/workspaceSelection.html');
        }
    } catch (error) {
        console.error('創建工作空間時發生錯誤:', error);
    }
});

// 列出工作空間
ipcMain.handle('listWorkspaces', async () => {
    try {
        const sheetsList = await listWorkspaces(oAuth2Client);
        return sheetsList.map(sheet => ({
            id: sheet.spreadsheetId,
            name: sheet.name
        }));
    } catch (error) {
        console.error('列出工作空間時發生錯誤:', error);
        throw error;
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// 选择工作空间
ipcMain.handle('selectWorkspace', async (event, workspaceId) => {
    try {
        // 可以在此處加入任何與選擇工作空間相關的邏輯
        console.log(`選擇的工作空間 ID: ${workspaceId}`);

        // 加載 dashboard 頁面
        mainWindow.loadFile('pages/dashboard.html');

        // 當 DOM 加載完成後發送工作空間信息到渲染進程
        mainWindow.webContents.once('dom-ready', () => {
            mainWindow.webContents.send('workspace-selected', workspaceId); // 傳遞工作空間 ID
        });
    } catch (error) {
        console.error('選擇工作空間時發生錯誤:', error);
    }
});

// 返回到工作空间选择页面
ipcMain.handle('back-to-workspace-selection', async () => {
    try {
        mainWindow.loadFile('pages/workspaceSelection.html');
    } catch (error) {
        console.error('返回工作空间选择页面时发生错误:', error);
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
