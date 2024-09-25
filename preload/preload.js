const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    startOAuth: () => ipcRenderer.invoke('start-oauth'),
    
    // 傳遞的 workspaceName 確保是字符串
    createNewWorkspace: (workspaceName) => {
        if (typeof workspaceName === 'string') {
            ipcRenderer.invoke('createNewWorkspace', workspaceName.trim());
        } else {
            console.error('傳遞的工作空間名稱不是字符串');
        }
    },

    // 獲取工作空間列表
    listWorkspaces: () => ipcRenderer.invoke('listWorkspaces'),

    selectWorkspace: (workspaceId) => ipcRenderer.invoke('selectWorkspace', workspaceId),
    backToWorkspaceSelection: () => ipcRenderer.invoke('back-to-workspace-selection'),

    // 接收工作空間名稱，顯示列表中的按鈕
    sendWorkspaceName: (workspaceName) => ipcRenderer.send('workspace-name', workspaceName),
    
    receive: (channel, func) => {
        const validChannels = ['workspace-selected'];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    }
});
