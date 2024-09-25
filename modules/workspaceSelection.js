// 從主進程獲取工作空間列表並檢查其有效性
async function loadWorkspaces() {
    try {
        const workspaces = await window.api.listWorkspaces();
        const workspaceList = document.getElementById('workspace-list');
        workspaceList.innerHTML = ''; // 清空現有的列表

        for (const workspace of workspaces) {
            const li = document.createElement('li');
            li.textContent = workspace.name;
            li.addEventListener('click', () => selectWorkspace(workspace.id, workspace.name));
            workspaceList.appendChild(li);
        }
    } catch (error) {
        console.error('獲取工作空間列表時發生錯誤:', error);
    }
}

// 選擇工作空間
async function selectWorkspace(workspaceId, workspaceName) {
    try {
        await window.api.selectWorkspace(workspaceId);
        window.api.sendWorkspaceName(workspaceName); // 顯示傳遞工作空間名稱
    } catch (error) {
        console.error('選擇工作空間時發生錯誤:', error);
    }
}

// 顯示輸入框
function showWorkspaceInput() {
    document.getElementById('workspace-name-input').style.display = 'block';
}

// 新增工作空間
async function addNewWorkspace() {
    const newWorkspaceName = document.getElementById('new-workspace-name').value;
    if (newWorkspaceName) {
        try {
            console.log(`即將創建工作空間，名稱為: "${newWorkspaceName}"`);
            await window.api.createNewWorkspace(newWorkspaceName);
            loadWorkspaces();
        } catch (error) {
            console.error('創建工作空間時發生錯誤:', error);
        }
    } else {
        alert('請輸入有效的工作空間名稱');
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadWorkspaces();

    document.getElementById('show-input-button').addEventListener('click', showWorkspaceInput);
    document.getElementById('add-workspace-button').addEventListener('click', addNewWorkspace);
});
