// 遊戲狀態管理
class NumberGuessingGame {
    constructor() {
        this.difficulty = '';
        this.playerNumber = '';
        this.aiNumber = '';
        this.playerGuesses = [];
        this.aiGuesses = [];
        this.currentTurn = 'player';
        this.gameOver = false;
        this.ai = null; // AI 實例
    }

    // 設置遊戲難度
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        console.log(`難度已設置為：${difficulty}`);
        
        // 創建對應難度的 AI
        if (window.GameAI) {
            this.ai = window.GameAI.createAI(difficulty);
            console.log(`${difficulty} 難度 AI 已初始化`);
        } else {
            console.warn('GameAI 未定義，無法創建 AI 實例');
        }
        
        return true;
    }

    // 驗證數字是否有效（4位不重複）
    isValidNumber(number) {
        // 檢查是否為4位數
        if (number.length !== 4) return false;
        
        // 檢查是否只包含數字
        if (!/^\d+$/.test(number)) return false;
        
        // 檢查是否有重複數字
        const uniqueDigits = new Set(number);
        return uniqueDigits.size === 4;
    }

    // 設置玩家的秘密數字
    setPlayerNumber(number) {
        if (this.isValidNumber(number)) {
            this.playerNumber = number;
            return true;
        }
        return false;
    }

    // AI生成秘密數字
    generateAINumber() {
        let number;
        do {
            // 使用Set來確保不重複
            const digits = new Set();
            while(digits.size < 4) {
                digits.add(Math.floor(Math.random() * 10));
            }
            number = Array.from(digits).join('');
        } while (!this.isValidNumber(number));
        this.aiNumber = number;
        console.log('AI的秘密數字已生成');
        return number;
    }

    // 計算猜測結果 (A和B)
    calculateResult(secretNumber, guessNumber) {
        let a = 0, b = 0;
        
        for (let i = 0; i < 4; i++) {
            if (secretNumber[i] === guessNumber[i]) {
                a++;
            } else if (secretNumber.includes(guessNumber[i])) {
                b++;
            }
        }
        
        return { a, b };
    }

    // AI猜數字
    generateAIGuess() {
        let guess;
        
        // 如果有 AI 實例，使用 AI 生成猜測
        if (this.ai) {
            guess = this.ai.generateGuess(this.playerNumber);
        } else {
            // 備用方案：隨機猜測
            do {
                const digits = new Set();
                while(digits.size < 4) {
                    digits.add(Math.floor(Math.random() * 10));
                }
                guess = Array.from(digits).join('');
            } while (this.aiGuesses.includes(guess));
        }
        
        this.aiGuesses.push(guess);
        return guess;
    }

    // 處理玩家猜測
    playerGuess(guess) {
        if (!this.isValidNumber(guess)) {
            return { error: '請輸入4位不重複的數字' };
        }

        // 檢查是否已經猜過
        if (this.playerGuesses.includes(guess)) {
            return { error: '您已經猜過這個數字' };
        }

        this.playerGuesses.push(guess);
        const result = this.calculateResult(this.aiNumber, guess);
        
        // 判斷遊戲是否結束
        if (result.a === 4) {
            this.gameOver = true;
            return { result, winner: 'player' };
        }

        // 切換回合
        this.currentTurn = 'ai';
        return { result, turn: 'ai' };
    }

    // AI回合
    aiTurn() {
        const guess = this.generateAIGuess();
        const result = this.calculateResult(this.playerNumber, guess);
        
        // 判斷遊戲是否結束
        if (result.a === 4) {
            this.gameOver = true;
            return { guess, result, winner: 'ai' };
        }

        // 切換回合
        this.currentTurn = 'player';
        return { guess, result, turn: 'player' };
    }

    // 重置遊戲
    reset() {
        this.playerNumber = '';
        this.aiNumber = '';
        this.playerGuesses = [];
        this.aiGuesses = [];
        this.currentTurn = 'player';
        this.gameOver = false;
        
        // 重置 AI
        if (this.ai) {
            this.ai.reset();
        }
    }
}

// 全局遊戲實例
window.game = new NumberGuessingGame();