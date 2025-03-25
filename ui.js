document.addEventListener('DOMContentLoaded', () => {
    // 確保遊戲已初始化
    if (!window.game) {
        window.game = new NumberGuessingGame();
    }

    // DOM 元素
    const difficultySelect = document.getElementById('difficulty-select');
    const startGameBtn = document.getElementById('start-game-btn');
    const restartGameBtn = document.getElementById('restart-game-btn');
    const showRulesBtn = document.getElementById('show-rules-btn');
    const rulesModal = document.getElementById('rules-modal');
    const closeModalBtn = document.querySelector('.close-btn');
    
    const numberSetup = document.getElementById('number-setup');
    const setupNumberInputs = document.querySelectorAll('#number-setup .digit-input');
    const setNumberBtn = document.getElementById('set-number-btn');
    const gameBoard = document.getElementById('game-board');
    
    const guessInputs = document.querySelectorAll('#game-board .digit-input');
    const submitGuessBtn = document.getElementById('submit-guess-btn');
    const playerGuessHistory = document.getElementById('player-guess-history');
    const aiGuessHistory = document.getElementById('ai-guess-history');
    const gameMessage = document.getElementById('game-message');

    // 遊戲狀態
    let gameStarted = false;
    let gameEnded = false;

    // 難度設置
    const difficultyMap = {
        'easy': '簡易',
        'medium': '中等',
        'hard': '困難',
        'nightmare': '地獄'
    };

    // 從 localStorage 讀取之前的難度設置
    const savedDifficulty = localStorage.getItem('gameDifficulty');
    if (savedDifficulty) {
        difficultySelect.value = savedDifficulty;
    }

    // 更新難度選擇
    difficultySelect.addEventListener('change', () => {
        const difficulty = difficultySelect.value;
        window.game.setDifficulty(difficulty);
        localStorage.setItem('gameDifficulty', difficulty);
    });

    // 遊戲規則模態框控制
    showRulesBtn.addEventListener('click', () => {
        rulesModal.style.display = 'flex';
    });

    closeModalBtn.addEventListener('click', () => {
        rulesModal.style.display = 'none';
    });

    // 點擊模態框外部關閉模態框
    window.addEventListener('click', (e) => {
        if (e.target === rulesModal) {
            rulesModal.style.display = 'none';
        }
    });

    // 數字輸入控制
    function setupDigitInputEvents(inputs) {
        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                // 只允許數字
                e.target.value = e.target.value.replace(/[^\d]/g, '');
                
                // 移動到下一個輸入框
                if (e.target.value.length === 1 && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
                
                // 移除自動提交功能，讓用戶點擊按鈕或按Enter提交
            });

            input.addEventListener('keydown', (e) => {
                // 退格鍵移動到上一個輸入框
                if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
                    inputs[index - 1].focus();
                }
                
                // 左右箭頭鍵在輸入框之間移動
                if (e.key === 'ArrowLeft' && index > 0) {
                    inputs[index - 1].focus();
                }
                if (e.key === 'ArrowRight' && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
                
                // 添加Enter鍵提交功能
                if (e.key === 'Enter') {
                    const allFilled = Array.from(inputs).every(input => input.value.length === 1);
                    if (allFilled) {
                        if (inputs === setupNumberInputs && !setNumberBtn.disabled) {
                            setNumberBtn.click();
                        } else if (inputs === guessInputs && !submitGuessBtn.disabled) {
                            submitGuessBtn.click();
                        }
                    }
                }
            });
        });
    }

    // 設置輸入框事件
    setupDigitInputEvents(setupNumberInputs);
    setupDigitInputEvents(guessInputs);

    // 開始遊戲按鈕
    startGameBtn.addEventListener('click', () => {
        if (gameStarted) return;
        
        // 初始化/重置遊戲
        window.game.reset();
        
        // 設置難度
        const difficulty = difficultySelect.value;
        window.game.setDifficulty(difficulty);
        
        // 清空輸入框
        setupNumberInputs.forEach(input => {
            input.value = '';
            input.disabled = false;
        });
        guessInputs.forEach(input => input.value = '');
        
        // 清空猜測歷史
        playerGuessHistory.innerHTML = '';
        aiGuessHistory.innerHTML = '';
        
        // 清空遊戲消息
        gameMessage.textContent = '';
        
        // 確保猜測區隱藏，設置區顯示
        numberSetup.style.display = 'block';
        gameBoard.style.display = 'none';
        
        // 移除可能存在的秘密數字顯示
        const existingSecretNumber = gameBoard.querySelector('.player-secret-number');
        if (existingSecretNumber) {
            gameBoard.removeChild(existingSecretNumber);
        }
        
        // 啟用/禁用按鈕
        startGameBtn.disabled = true;
        restartGameBtn.disabled = false;
        setNumberBtn.disabled = false;
        submitGuessBtn.disabled = false;
        
        // 聚焦到第一個輸入框
        setupNumberInputs[0].focus();
        
        gameStarted = true;
        gameEnded = false;
    });

    // 重新開始按鈕
    restartGameBtn.addEventListener('click', () => {
        // 不管遊戲狀態，都重置
        startGameBtn.disabled = false;
        restartGameBtn.disabled = true;
        
        // 重置界面
        numberSetup.style.display = 'block';
        gameBoard.style.display = 'none';
        
        // 清空輸入和歷史
        setupNumberInputs.forEach(input => {
            input.value = '';
            input.disabled = false;
        });
        guessInputs.forEach(input => input.value = '');
        playerGuessHistory.innerHTML = '';
        aiGuessHistory.innerHTML = '';
        gameMessage.textContent = '';
        
        // 移除可能存在的秘密數字顯示
        const existingSecretNumber = gameBoard.querySelector('.player-secret-number');
        if (existingSecretNumber) {
            gameBoard.removeChild(existingSecretNumber);
        }
        
        gameStarted = false;
        gameEnded = false;
    });

    // 確認數字按鈕
    setNumberBtn.addEventListener('click', () => {
        // 收集數字
        const playerNumber = Array.from(setupNumberInputs)
            .map(input => input.value)
            .join('');
        
        // 驗證數字是否不重複
        const isValid = /^(\d)(?!\1)(\d)(?![\1\2])(\d)(?![\1\2\3])(\d)$/.test(playerNumber);
        
        if (isValid) {
            // 設置玩家數字
            window.game.setPlayerNumber(playerNumber);
            
            // 生成AI的數字
            window.game.generateAINumber();
            
            // 顯示遊戲區域，隱藏設置區域
            numberSetup.style.display = 'none';
            gameBoard.style.display = 'block';
            
            // 禁用設置數字區域
            setupNumberInputs.forEach(input => input.disabled = true);
            setNumberBtn.disabled = true;
            
            // 創建並顯示玩家秘密數字提示
            const playerSecretNumber = document.createElement('div');
            playerSecretNumber.className = 'player-secret-number';
            playerSecretNumber.innerHTML = `<p>您的秘密數字: <strong>${playerNumber}</strong></p>`;
            gameBoard.insertBefore(playerSecretNumber, gameBoard.firstChild);
            
            // 聚焦到第一個猜測輸入框
            guessInputs[0].focus();
        } else {
            alert('請輸入4位不重複的數字');
        }
    });

    // 提交猜測按鈕
    submitGuessBtn.addEventListener('click', () => {
        if (gameEnded) return;
        
        // 收集猜測數字
        const playerGuess = Array.from(guessInputs)
            .map(input => input.value)
            .join('');
        
        // 驗證數字是否不重複
        const isValid = /^(\d)(?!\1)(\d)(?![\1\2])(\d)(?![\1\2\3])(\d)$/.test(playerGuess);
        
        if (!isValid) {
            alert('請輸入4位不重複的數字');
            return;
        }

        // 玩家回合
        const result = window.game.playerGuess(playerGuess);
        
        if (result.error) {
            alert(result.error);
            return;
        }

        // 添加到玩家猜測紀錄 - 最新的放在最上面
        const guessItem = document.createElement('li');
        guessItem.textContent = `您的猜測：${playerGuess} - ${result.result.a}A${result.result.b}B`;
        playerGuessHistory.insertBefore(guessItem, playerGuessHistory.firstChild);

        // 遊戲結束檢查
        if (result.winner === 'player') {
            gameMessage.textContent = '恭喜！您贏了！';
            submitGuessBtn.disabled = true;
            gameEnded = true;
            return;
        }

        // AI回合
        const aiResult = window.game.aiTurn();
        
        // 添加AI猜測到歷史記錄 - 最新的放在最上面
        const aiGuessItem = document.createElement('li');
        aiGuessItem.textContent = `AI的猜測：${aiResult.guess} - ${aiResult.result.a}A${aiResult.result.b}B`;
        aiGuessHistory.insertBefore(aiGuessItem, aiGuessHistory.firstChild);

        // 遊戲結束檢查
        if (aiResult.winner === 'ai') {
            gameMessage.textContent = `AI贏了！正確數字是 ${window.game.aiNumber}`;
            submitGuessBtn.disabled = true;
            gameEnded = true;
            return;
        }

        // 清空輸入
        guessInputs.forEach(input => input.value = '');
        guessInputs[0].focus();
    });

    // 自動開始新版本的遊戲流程
    // 只需要讓使用者能夠選擇難度並點擊開始，而不是直接開始
    startGameBtn.disabled = false;
    restartGameBtn.disabled = true;
});