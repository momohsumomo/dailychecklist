const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    startOAuth: () => ipcRenderer.invoke('start-oauth'),
    createNewWorkspace: (workspaceName) => ipcRenderer.invoke('createNewWorkspace', workspaceName),
    listWorkspaces: () => ipcRenderer.invoke('listWorkspaces'),
    selectWorkspace: (workspaceId) => ipcRenderer.invoke('selectWorkspace', workspaceId),
    backToWorkspaceSelection: () => ipcRenderer.invoke('back-to-workspace-selection')
});
