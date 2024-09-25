const { google } = require('googleapis');
const { oAuth2Client, isTokenExpired } = require('./auth');
const fs = require('fs');
const path = require('path');
const TOKEN_PATH = path.join(__dirname, 'token.json');

const sheets = google.sheets('v4');
const drive = google.drive('v3');

// 讀取並刷新 Token，如果 Token 過期則進行刷新
async function refreshAuthToken() {
    if (isTokenExpired()) {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
        oAuth2Client.setCredentials(token);

        try {
            const newToken = await oAuth2Client.refreshAccessToken();
            oAuth2Client.setCredentials(newToken.credentials);
            fs.writeFileSync(TOKEN_PATH, JSON.stringify(newToken.credentials));
            console.log('Token 已刷新');
        } catch (error) {
            console.error('刷新 Token 失敗:', error);
        }
    } else {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
        oAuth2Client.setCredentials(token);
    }
}

// 創建新的 Google Sheets 工作表
async function createPermissionSheet(workspaceName) {
    await refreshAuthToken();

    // 檢查 workspaceName 是否為有效的字符串
    if (typeof workspaceName !== 'string' || workspaceName.trim() === '') {
        console.error('工作空間名稱無效，必須是一個非空字符串');
        throw new Error('工作空間名稱無效，必須是一個非空字符串');
    }

    const trimmedName = workspaceName.trim();
    console.log(`準備創建工作表，名稱為: "${trimmedName}"`);

    const resource = {
        properties: {
            title: trimmedName
        },
        sheets: [
            { properties: { title: '待辦事項' } },
            { properties: { title: '日程安排' } },
            { properties: { title: '完成的任務' } }
        ]
    };

    try {
        const response = await sheets.spreadsheets.create({
            auth: oAuth2Client,
            resource,
        });

        const spreadsheetId = response.data.spreadsheetId;
        console.log(`創建的工作表 ID: ${spreadsheetId}`);
        return spreadsheetId;
    } catch (error) {
        console.error('創建工作表時發生錯誤:', error);
        throw error;
    }
}

// 列出所有工作空間（Google Sheets 文件）
async function listWorkspaces() {
    await refreshAuthToken();

    try {
        const res = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed = false",
            fields: 'files(id, name)',
            auth: oAuth2Client
        });

        const files = res.data.files;
        if (files.length) {
            return files.map(file => ({
                spreadsheetId: file.id,
                name: file.name
            }));
        } else {
            console.log('沒有找到任何工作空間。');
            return [];
        }
    } catch (error) {
        console.error('列出工作空間時發生錯誤:', error);
        throw error;
    }
}

module.exports = {
    createPermissionSheet,
    listWorkspaces,  // 正確地導出 listWorkspaces 函數
};
