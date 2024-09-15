// 顯示新增工作空間的輸入框
function showWorkspaceInput() {
    document.getElementById('workspace-name-input').style.display = 'block';
}

// 從主進程獲取工作空間列表並顯示
async function loadWorkspaces() {
    try {
        const workspaces = await window.api.listWorkspaces();
        const workspaceList = document.getElementById('workspace-list');
        workspaceList.innerHTML = ''; // 清空現有的列表

        // 動態生成工作空間列表
        workspaces.forEach(workspace => {
            const li = document.createElement('li');
            li.textContent = workspace.name;
            li.onclick = () => selectWorkspace(workspace.id);
            workspaceList.appendChild(li);
        });
    } catch (error) {
        console.error('獲取工作空間列表時發生錯誤:', error);
    }
}

// 選擇工作空間
async function selectWorkspace(workspaceId) {
    try {
        await window.api.selectWorkspace(workspaceId);
    } catch (error) {
        console.error('選擇工作空間時發生錯誤:', error);
    }
}

// 新增工作空間
function addNewWorkspace() {
    const workspaceName = document.getElementById('new-workspace-name').value;
    if (workspaceName) {
        window.api.createNewWorkspace(workspaceName)
            .then(() => {
                console.log('工作位置新增成功');
                // 重新加載工作空間列表，並隱藏輸入框
                loadWorkspaces();
                document.getElementById('workspace-name-input').style.display = 'none';
            })
            .catch((error) => {
                console.error('新增工作位置時發生錯誤:', error);
            });
    } else {
        alert('工作空間名稱不能為空');
    }
}

// 初始化
loadWorkspaces();
