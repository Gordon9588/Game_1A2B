// 遊戲 AI 策略模塊
// 包含各種難度的 AI 猜測策略

// AI 基礎類
class BaseAI {
    constructor() {
        this.allGuesses = []; // 所有已經猜過的數字
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

    // 計算兩個數字之間的結果（A和B）
    calculateResult(number1, number2) {
        let a = 0, b = 0;
        
        for (let i = 0; i < 4; i++) {
            if (number1[i] === number2[i]) {
                a++; // 數字和位置都正確
            } else if (number1.includes(number2[i])) {
                b++; // 數字正確但位置錯誤
            }
        }
        
        return { a, b };
    }

    // 生成隨機不重複的4位數
    generateRandomNumber() {
        let guess;
        do {
            const digits = new Set();
            while(digits.size < 4) {
                digits.add(Math.floor(Math.random() * 10));
            }
            guess = Array.from(digits).join('');
        } while (this.allGuesses.includes(guess));
        return guess;
    }

    // 添加猜測到歷史記錄
    addGuess(guess) {
        this.allGuesses.push(guess);
    }

    // 重置 AI
    reset() {
        this.allGuesses = [];
    }
}

// 簡單難度 AI - 完全隨機猜測
class EasyAI extends BaseAI {
    constructor() {
        super();
    }

    // 生成猜測
    generateGuess() {
        const guess = this.generateRandomNumber();
        this.addGuess(guess);
        return guess;
    }
}

// 中等難度 AI - 簡單推測
class MediumAI extends BaseAI {
    constructor() {
        super();
        this.previousGuess = null;
        this.previousResult = null;
    }

    // 生成猜測
    generateGuess(playerNumber) {
        // 首次猜測，隨機生成
        if (!this.previousGuess) {
            const guess = this.generateRandomNumber();
            this.addGuess(guess);
            this.previousGuess = guess;
            return guess;
        }

        // 計算上一次猜測的結果
        this.previousResult = this.calculateResult(playerNumber, this.previousGuess);

        // 如果上一次猜測有 A 或 B，嘗試保留一些數字
        if (this.previousResult.a > 0 || this.previousResult.b > 0) {
            let newGuess;
            const maxAttempts = 20; // 防止無限循環
            let attempts = 0;

            do {
                attempts++;
                // 如果嘗試次數過多，直接返回隨機數字
                if (attempts > maxAttempts) {
                    newGuess = this.generateRandomNumber();
                    break;
                }

                const lastDigits = this.previousGuess.split('');
                const newDigits = [];
                
                // 有一定概率保留上一次猜測的部分數字
                for (let i = 0; i < 4; i++) {
                    if (Math.random() < (this.previousResult.a + this.previousResult.b) / 8) {
                        newDigits.push(lastDigits[i]);
                    }
                }
                
                // 填充剩餘位置為隨機數字
                while (newDigits.length < 4) {
                    const digit = Math.floor(Math.random() * 10).toString();
                    if (!newDigits.includes(digit)) {
                        newDigits.push(digit);
                    }
                }
                
                // 打亂順序
                for (let i = newDigits.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [newDigits[i], newDigits[j]] = [newDigits[j], newDigits[i]];
                }
                
                newGuess = newDigits.join('');
            } while (!this.isValidNumber(newGuess) || this.allGuesses.includes(newGuess));
            
            this.addGuess(newGuess);
            this.previousGuess = newGuess;
            return newGuess;
        }
        
        // 如果上一次猜測完全沒有正確的數字，生成全新的隨機數字
        const guess = this.generateRandomNumber();
        this.addGuess(guess);
        this.previousGuess = guess;
        return guess;
    }

    // 重置 AI
    reset() {
        super.reset();
        this.previousGuess = null;
        this.previousResult = null;
    }
}

// 困難難度 AI - 根據AB數值調整策略
class HardAI extends BaseAI {
    constructor() {
        super();
        this.guesses = []; // 之前的猜測
        this.results = []; // 之前的結果
    }

    // 生成猜測
    generateGuess(playerNumber) {
        // 首次猜測，使用一個平衡的起始數字
        if (this.guesses.length === 0) {
            const startGuess = "1234";
            this.addGuess(startGuess);
            this.guesses.push(startGuess);
            return startGuess;
        }

        // 獲取上一次猜測結果
        const lastGuess = this.guesses[this.guesses.length - 1];
        const lastResult = this.calculateResult(playerNumber, lastGuess);
        this.results.push(lastResult);

        let newGuess;
        const maxAttempts = 30;
        let attempts = 0;

        do {
            attempts++;
            if (attempts > maxAttempts) {
                newGuess = this.generateRandomNumber();
                break;
            }

            // 根據上一次結果調整策略
            if (lastResult.a > 0) {
                // 有 A 的情況，嘗試保留一些位置正確的數字
                newGuess = this.generateWithCorrectPositions(lastGuess, lastResult);
            } else if (lastResult.b > 0) {
                // 只有 B 的情況，嘗試調整數字順序
                newGuess = this.generateWithCorrectDigits(lastGuess, lastResult);
            } else {
                // 沒有正確的數字，生成全新的隨機數字
                newGuess = this.generateRandomNumber();
            }
        } while (!this.isValidNumber(newGuess) || this.allGuesses.includes(newGuess));

        this.addGuess(newGuess);
        this.guesses.push(newGuess);
        return newGuess;
    }

    // 保留一些位置正確的數字生成新的猜測
    generateWithCorrectPositions(lastGuess, lastResult) {
        const lastDigits = lastGuess.split('');
        const newDigits = Array(4).fill(null);
        
        // 根據 A 的數量保留一些位置
        for (let i = 0; i < 4; i++) {
            if (Math.random() < lastResult.a / 4) {
                newDigits[i] = lastDigits[i];
            }
        }
        
        // 填充空位
        while (newDigits.includes(null)) {
            const index = newDigits.indexOf(null);
            let digit;
            do {
                digit = Math.floor(Math.random() * 10).toString();
            } while (newDigits.includes(digit));
            newDigits[index] = digit;
        }
        
        return newDigits.join('');
    }

    // 保留部分數字但調整位置生成新的猜測
    generateWithCorrectDigits(lastGuess, lastResult) {
        const lastDigits = lastGuess.split('');
        let newDigits = [];
        
        // 保留部分數字
        for (let i = 0; i < 4; i++) {
            if (Math.random() < lastResult.b / 4) {
                newDigits.push(lastDigits[i]);
            }
        }
        
        // 填充剩餘數字
        while (newDigits.length < 4) {
            const digit = Math.floor(Math.random() * 10).toString();
            if (!newDigits.includes(digit)) {
                newDigits.push(digit);
            }
        }
        
        // 打亂順序
        for (let i = newDigits.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newDigits[i], newDigits[j]] = [newDigits[j], newDigits[i]];
        }
        
        return newDigits.join('');
    }

    // 重置 AI
    reset() {
        super.reset();
        this.guesses = [];
        this.results = [];
    }
}

// 地獄難度 AI - 數學推論策略
class NightmareAI extends BaseAI {
    constructor() {
        super();
        this.allPossibleCombinations = this.generateAllPossibleCombinations();
        this.candidateNumbers = [...this.allPossibleCombinations]; // 複製一份作為候選數字
        this.previousGuesses = []; // 之前的猜測
        this.previousResults = []; // 之前的結果
    }

    // 生成所有可能的四位數字組合（不重複數字）
    generateAllPossibleCombinations() {
        const result = [];
        // 生成所有可能的四位數字組合
        for (let d1 = 0; d1 <= 9; d1++) {
            for (let d2 = 0; d2 <= 9; d2++) {
                if (d2 === d1) continue;
                for (let d3 = 0; d3 <= 9; d3++) {
                    if (d3 === d1 || d3 === d2) continue;
                    for (let d4 = 0; d4 <= 9; d4++) {
                        if (d4 === d1 || d4 === d2 || d4 === d3) continue;
                        result.push(`${d1}${d2}${d3}${d4}`);
                    }
                }
            }
        }
        return result;
    }

    // 根據之前的猜測和結果過濾候選數字
    filterCandidates() {
        const n = this.previousGuesses.length;
        if (n === 0) return; // 如果沒有之前的猜測，不需要過濾

        const lastGuess = this.previousGuesses[n - 1];
        const lastResult = this.previousResults[n - 1];

        // 過濾候選數字：只保留那些如果是答案，會給出與lastResult相同結果的數字
        this.candidateNumbers = this.candidateNumbers.filter(candidate => {
            const result = this.calculateResult(lastGuess, candidate);
            return result.a === lastResult.a && result.b === lastResult.b;
        });
    }

    // 選擇下一個最佳猜測
    selectNextGuess() {
        // 如果是第一次猜測，選擇一個平衡的起始數字（如 "1234"）
        if (this.previousGuesses.length === 0) {
            return "1234";
        }

        // 如果候選數字只剩一個，直接返回
        if (this.candidateNumbers.length === 1) {
            return this.candidateNumbers[0];
        }

        // 如果候選數字很少，隨機選擇一個
        if (this.candidateNumbers.length <= 5) {
            return this.candidateNumbers[Math.floor(Math.random() * this.candidateNumbers.length)];
        }

        // 使用啟發式策略選擇最佳猜測
        let bestGuess = this.candidateNumbers[0];
        let minMaxRemaining = Infinity;

        // 從候選數字中取樣一部分進行測試（避免過多計算）
        const sampleSize = Math.min(30, this.candidateNumbers.length);
        const sampledCandidates = this.getRandomSample(this.candidateNumbers, sampleSize);

        for (const guess of sampledCandidates) {
            // 計算這個猜測的最差情況剩餘候選數量
            let worstCaseRemaining = 0;
            
            // 對所有可能的結果進行計數
            const resultCounts = {};
            
            for (const candidate of this.candidateNumbers) {
                const result = this.calculateResult(guess, candidate);
                const resultKey = `${result.a}A${result.b}B`;
                
                if (!resultCounts[resultKey]) {
                    resultCounts[resultKey] = 0;
                }
                resultCounts[resultKey]++;
            }
            
            // 找出最差情況（最多剩餘候選數量）
            worstCaseRemaining = Math.max(...Object.values(resultCounts));
            
            // 如果這個猜測的最差情況比當前最佳猜測更好，則更新最佳猜測
            if (worstCaseRemaining < minMaxRemaining) {
                minMaxRemaining = worstCaseRemaining;
                bestGuess = guess;
            }
        }

        return bestGuess;
    }

    // 從數組中隨機取樣
    getRandomSample(array, size) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, size);
    }

    // 生成下一個猜測
    generateGuess(playerNumber) {
        // 如果不是第一次猜測，更新上一次猜測的結果
        if (this.previousGuesses.length > 0) {
            const lastGuess = this.previousGuesses[this.previousGuesses.length - 1];
            const lastResult = this.calculateResult(playerNumber, lastGuess);
            this.previousResults.push(lastResult);
        }
        
        // 根據之前的猜測和結果過濾候選數字
        this.filterCandidates();
        
        // 選擇下一個最佳猜測
        const nextGuess = this.selectNextGuess();
        
        // 記錄這次猜測
        this.previousGuesses.push(nextGuess);
        this.addGuess(nextGuess);
        
        return nextGuess;
    }

    // 重置 AI
    reset() {
        super.reset();
        this.candidateNumbers = [...this.allPossibleCombinations];
        this.previousGuesses = [];
        this.previousResults = [];
    }
}

// 創建不同難度的 AI 實例
window.GameAI = {
    createAI: function(difficulty) {
        switch(difficulty) {
            case 'easy':
                return new EasyAI();
            case 'medium':
                return new MediumAI();
            case 'hard':
                return new HardAI();
            case 'nightmare':
                return new NightmareAI();
            default:
                return new EasyAI(); // 默認為簡單難度
        }
    }
};