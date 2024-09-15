// dashboard.js
function selectWorkspace() {
    const selectedWorkspaceId = document.getElementById('workspace-list').value;
    window.api.selectWorkspace(selectedWorkspaceId)
        .then(() => {
            // 隱藏工作空間選擇，顯示工作空間詳情
            document.getElementById('workspace-selection').style.display = 'none';
            document.getElementById('workspace-details').style.display = 'block';
        })
        .catch((error) => {
            console.error('Error selecting workspace:', error);
        });
}

// dashboard.js
function backToWorkspaceSelection() {
    console.log('嘗試返回工作空間選擇頁面'); // 調試信息
    window.api.backToWorkspaceSelection()
        .then(() => {
            console.log('成功返回工作空間選擇頁面');
        })
        .catch((error) => {
            console.error('返回工作空間選擇頁面時發生錯誤:', error);
        });
}

// 初始時隱藏工作空間詳情
document.getElementById('workspace-details').style.display = 'none';
