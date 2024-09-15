
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { startOAuth, getTokenFromCode, oAuth2Client, isTokenExpired } = require('./modules/auth');
const { createPermissionSheet, listWorkspaces, loadWorkspaceData } = require('./modules/sheetManager');
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

    // 驗證 Token 並選擇畫面
    handleTokenAndLoadWindow();
    
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function handleTokenAndLoadWindow() {
    if (fs.existsSync(TOKEN_PATH)) {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
        oAuth2Client.setCredentials(token);

        // Token 過期檢查
        if (isTokenExpired()) {
            console.log('Token 過期，請重新登入');
            fs.unlinkSync(TOKEN_PATH);
            mainWindow.loadFile('pages/login.html');
        } else {
            mainWindow.loadFile('pages/workspaceSelection.html'); // 直接進入工作空間
        }
    } else {
        mainWindow.loadFile('pages/login.html'); // 無 Token 時跳到登入畫面
    }
}

app.whenReady().then(createWindow);

// OAuth 登入處理
ipcMain.handle('start-oauth', async () => {
    // 不用每次寫入 token
    await handleOAuthProcess();
});

// 處理 OAuth 流程
async function handleOAuthProcess() {
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
                reject(new Error('OAuth window was closed by the user'));
            });
        });
    } catch (error) {
        console.error('Error during OAuth process:', error);
    }
}

// 列出工作空間
ipcMain.handle('listWorkspaces', async () => {
    try {
        const sheetsList = await listWorkspaces(oAuth2Client);
        return sheetsList.map(sheet => ({
            id: sheet.spreadsheetId,
            name: sheet.name
        }));
    } catch (error) {
        console.error('Error listing workspaces:', error);
        throw error;
    }
});

// 創建新工作空間
ipcMain.handle('createNewWorkspace', async (event, workspaceName) => {
    if (!workspaceName) {
        console.error("必須輸入工作空間名稱");
        return;
    }
    try {
        const newSheetId = await createPermissionSheet(oAuth2Client, workspaceName);
        if (newSheetId) {
            mainWindow.loadFile('pages/workspaceSelection.html'); // 回到選擇頁面重新載入列表
        }
    } catch (error) {
        console.error('創建工作空間時發生錯誤:', error);
    }
});

// 選擇工作空間
ipcMain.handle('selectWorkspace', async (event, workspaceId) => {
    try {
        console.log('已選擇工作空間 ID:', workspaceId);
        mainWindow.loadFile('pages/dashboard.html'); // 成功選擇後進入主介面
    } catch (error) {
        console.error('選擇工作空間時發生錯誤:', error);
    }
});

ipcMain.handle('back-to-workspace-selection', async () => {
    // 切換回到工作空間選擇頁面
    mainWindow.loadFile('pages/workspaceSelection.html');
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
