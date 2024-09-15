const { google } = require('googleapis');
const sheets = google.sheets('v4');
const drive = google.drive('v3');

// 創建新的工作表
async function createPermissionSheet(auth, workspaceName) {
    const resource = {
        properties: {
            title: workspaceName
        }
    };
    try {
        const response = await sheets.spreadsheets.create({
            auth,
            resource,
        });
        const spreadsheetId = response.data.spreadsheetId;
        console.log(`創建的工作表 ID：${spreadsheetId}`);
        return spreadsheetId;
    } catch (error) {
        console.error('創建工作表時發生錯誤:', error);
        throw error;
    }
}

// 列出所有已創建的工作空間
async function listWorkspaces(auth) {
    try {
        const res = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.spreadsheet'",
            fields: 'files(id, name)',
            auth
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

// 載入特定工作空間的資料
async function loadWorkspaceData(auth, spreadsheetId) {
    try {
        const response = await sheets.spreadsheets.get({
            auth,
            spreadsheetId
        });
        return response.data;
    } catch (error) {
        console.error('載入工作空間資料時發生錯誤:', error);
        throw error;
    }
}

module.exports = { createPermissionSheet, listWorkspaces, loadWorkspaceData };
