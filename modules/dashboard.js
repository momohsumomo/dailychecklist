document.addEventListener('DOMContentLoaded', () => {
    // 绑定返回按鈕的事件处理
    const backButton = document.getElementById('back-button');
    if (backButton) {
        backButton.addEventListener('click', backToWorkspaceSelection);
    }

    // 初始時隱藏工作空間詳情
    document.getElementById('workspace-details').style.display = 'none';
});

// 监听 'workspace-selected' 事件并更新页面标题和显示任务
window.api.receive('workspace-selected', (workspaceName) => {
    const titleElement = document.getElementById('workspace-title');
    const detailsElement = document.getElementById('workspace-details');

    if (titleElement) {
        console.log(`接收到的工作空間名稱: ${workspaceName}`); 
        titleElement.textContent = workspaceName || '未知的工作空間'; 
    }

    // 顯示工作空間詳情
    detailsElement.style.display = 'block';
    loadDailyTasks(sampleTasks); // 加载示例任务
});

function backToWorkspaceSelection() {
    window.api.backToWorkspaceSelection()
        .then(() => {
            console.log('成功返回工作空間選擇頁面');
        })
        .catch((error) => {
            console.error('返回工作空間選擇頁面時發生錯誤:', error);
        });
}

// 加載每日任務邏輯
const taskContainer = document.getElementById('taskList');

function loadDailyTasks(tasks) {
    taskContainer.innerHTML = ''; // 清空現有任務
    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.classList.add('task-item');
        taskElement.innerHTML = `
            <h3>${task.name}</h3>
            <p>狀態: ${task.status}</p>
            <p>剩餘時間: ${task.remainingTime} 天</p>
        `;
        taskContainer.appendChild(taskElement);
    });
}

// 模擬載入任務
const sampleTasks = [
  { name: '設計企劃', status: '進行中', remainingTime: 3 },
  { name: '開發測試', status: '已完成', remainingTime: 0 }
];

// 新增任務邏輯
const addTaskBtn = document.getElementById('addTaskBtn');
const addTaskModal = document.getElementById('addTaskModal');
const closeModalBtn = document.querySelector('.close-btn');
const saveTaskBtn = document.getElementById('saveTaskBtn');

addTaskBtn.onclick = () => {
    addTaskModal.style.display = 'block';
};

closeModalBtn.onclick = () => {
    addTaskModal.style.display = 'none';
};

saveTaskBtn.onclick = () => {
    const taskName = document.getElementById('taskName').value;
    const taskOwner = document.getElementById('taskOwner').value;

    if (taskName && taskOwner) {
        // 創建新任務
        const newTask = { name: taskName, status: '進行中', remainingTime: '未知' };
        // 將新任務添加到任務列表中
        sampleTasks.push(newTask);
        // 更新畫面上的任務列表
        loadDailyTasks(sampleTasks);

        addTaskModal.style.display = 'none';
        console.log(`任務: ${taskName}, 負責人: ${taskOwner} 已儲存並顯示`);
    } else {
        alert('請填寫完整的任務名稱和負責人');
    }
};

// 迷你月曆點擊事件
const miniCalendar = document.getElementById('miniCalendar');
miniCalendar.onclick = () => {
    // 顯示完整月曆的邏輯
    console.log('迷你月曆被點擊，進入完整月曆視圖');
    alert('此處顯示完整月曆功能');
};

// 語音輸入按鈕邏輯（先檢查是否有可用設備）
const voiceInputBtn = document.getElementById('voiceInputBtn');

voiceInputBtn.onclick = () => {
    // 檢查是否存在音訊輸入設備
    navigator.mediaDevices.enumerateDevices()
        .then(function(devices) {
            const hasMicrophone = devices.some(device => device.kind === 'audioinput');
            
            if (hasMicrophone) {
                // 檢查麥克風權限
                navigator.mediaDevices.getUserMedia({ audio: true })
                    .then(function(stream) {
                        // 麥克風權限取得後啟動語音識別
                        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                        recognition.lang = 'zh-TW'; // 設定語言

                        recognition.onresult = (event) => {
                            const transcript = event.results[0][0].transcript;
                            console.log('語音輸入結果:', transcript);
                            alert(`你說了: ${transcript}`);
                        };

                        recognition.onerror = (event) => {
                            console.error('語音識別錯誤:', event.error);
                        };

                        recognition.start();
                    })
                    .catch(function(err) {
                        console.error('無法取得麥克風權限:', err);
                        alert('請允許麥克風權限來使用語音輸入功能');
                    });
            } else {
                // 沒有可用的音訊設備
                alert('無法找到麥克風設備，請連接麥克風後再嘗試使用語音輸入功能');
            }
        })
        .catch(function(err) {
            console.error('檢查設備時出現錯誤:', err);
            alert('檢查設備時發生錯誤，請重試或檢查瀏覽器設定');
        });
};


// 設置彈窗外部點擊關閉
window.onclick = function(event) {
    if (event.target == addTaskModal) {
        addTaskModal.style.display = "none";
    }
};
