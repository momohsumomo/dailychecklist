const { OAuth2Client } = require('google-auth-library');
const path = require('path');
const fs = require('fs');
require('dotenv').config(); // 載入環境變數

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const TOKEN_PATH = path.join(__dirname, 'token.json');

const oAuth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

async function startOAuth() {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file'],
    });
    return authUrl;
}

async function getTokenFromCode(code) {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    if (!tokens || !tokens.access_token) {
        throw new Error('獲取 Token 失敗');
    }

    // 寫入 token
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    return tokens;
}

// 確認 Token 是否過期
function isTokenExpired() {
    if (!fs.existsSync(TOKEN_PATH)) {
        return true;
    }
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    const now = Date.now();
    return !token.expiry_date || token.expiry_date < now;
}

module.exports = { startOAuth, getTokenFromCode, oAuth2Client, isTokenExpired };
