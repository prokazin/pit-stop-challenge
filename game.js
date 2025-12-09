class PitStopGame {
    constructor() {
        this.time = 0;
        this.timer = null;
        this.isRunning = false;
        this.currentWheel = 1;
        this.currentStep = 'remove';
        this.nextNut = 1;
        this.wheelsCompleted = 0;
        this.bestTime = localStorage.getItem('f1-best-time') || null;
        
        this.init();
    }
    
    init() {
        this.updateBestTimeDisplay();
        this.setupEventListeners();
        this.resetGame();
        this.adjustForMobile();
    }
    
    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        
        document.querySelectorAll('.nut').forEach(nut => {
            nut.addEventListener('click', (e) => this.handleNutClick(e));
            nut.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleNutClick(e);
            }, { passive: false });
        });
        
        document.getElementById('gun-btn').addEventListener('click', () => this.switchTool('gun'));
        document.getElementById('wheel-btn').addEventListener('click', () => this.switchTool('wheel'));
        
        // Тач-события для кнопок на мобильных
        document.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('touchstart', function() {
                this.style.opacity = '0.8';
            });
            btn.addEventListener('touchend', function() {
                this.style.opacity = '1';
            });
        });
        
        // Адаптация при изменении размера экрана
        window.addEventListener('resize', () => this.adjustForMobile());
    }
    
    adjustForMobile() {
        // На очень маленьких экранах скрываем 5-ю гайку
        const isVerySmallScreen = window.innerWidth <= 360;
        document.querySelectorAll('.nut[data-nut="5"]').forEach(nut => {
            nut.style.display = isVerySmallScreen ? 'none' : 'block';
        });
    }
    
    startGame() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.time = 0;
        this.updateTimer();
        
        this.timer = setInterval(() => {
            this.time += 0.01;
            this.updateTimer();
        }, 10);
        
        document.getElementById('start-btn').disabled = true;
        document.getElementById('start-btn').style.opacity = '0.6';
        this.showMessage('GO GO GO! Снимай колесо!');
    }
    
    updateTimer() {
        document.getElementById('time').textContent = this.time.toFixed(2);
    }
    
    handleNutClick(event) {
        if (!this.isRunning) return;
        
        const nutNumber = parseInt(event.target.dataset.nut);
        const wheelElement = event.target.closest('.wheel');
        const wheelNumber = parseInt(wheelElement.dataset.wheel);
        
        // Определяем сколько гаек на экране
        const isVerySmallScreen = window.innerWidth <= 360;
        const totalNuts = isVerySmallScreen ? 4 : 5;
        
        // Проверяем, не скрыта ли эта гайка на мобильных
        if (isVerySmallScreen && nutNumber === 5) return;
        
        if (nutNumber === this.nextNut && wheelNumber === this.currentWheel) {
            // Визуальная обратная связь
            event.target.style.background = '#4CAF50';
            event.target.style.transform = 'scale(0.85)';
            
            // Звуковой эффект (можно добавить позже)
            // this.playClickSound();
            
            this.nextNut++;
            
            if (this.nextNut > totalNuts) {
                if (this.currentStep === 'remove') {
                    this.currentStep = 'install';
                    this.nextNut = 1;
                    this.showMessage('Отлично! Теперь установи новое колесо');
                    this.switchTool('wheel');
                } else if (this.currentStep === 'install') {
                    this.currentStep = 'tighten';
                    this.startTightening(wheelElement);
                }
            } else {
                // Подсвечиваем следующую гайку
                this.highlightNextNut(wheelElement);
            }
        } else {
            this.time += 0.3;
            this.showMessage(`ОШИБКА! Нужна гайка №${this.nextNut}! +0.30с`, 'error');
            this.resetNutSequence(wheelElement);
        }
    }
    
    highlightNextNut(wheelElement) {
        const currentNut = wheelElement.querySelector(`.nut[data-nut="${this.nextNut}"]`);
        if (currentNut) {
            // Временное выделение следующей гайки
            currentNut.style.boxShadow = '0 0 8px yellow';
            setTimeout(() => {
                currentNut.style.boxShadow = '';
            }, 300);
        }
    }
    
    startTightening(wheelElement) {
        this.showMessage('Затягивай гайки! Удерживай кнопку...');
        const tightenBtn = document.getElementById('gun-btn');
        tightenBtn.style.background = '#2196F3';
        
        // Прогресс бар для затяжки
        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
            position: absolute;
            bottom: -30px;
            left: 50%;
            transform: translateX(-50%);
            width: 100px;
            height: 10px;
            background: #333;
            border-radius: 5px;
            overflow: hidden;
        `;
        
        const progressFill = document.createElement('div');
        progressFill.style.cssText = `
            width: 0%;
            height: 100%;
            background: #4CAF50;
            transition: width 0.5s linear;
        `;
        
        progressBar.appendChild(progressFill);
        wheelElement.appendChild(progressBar);
        
        let tightenTime = 0;
        const tightenInterval = setInterval(() => {
            tightenTime += 0.1;
            progressFill.style.width = `${(tightenTime / 0.5) * 100}%`;
            
            if (tightenTime >= 0.5) {
                clearInterval(tightenInterval);
                tightenBtn.style.background = '#e10600';
                progressBar.remove();
                this.completeWheel(wheelElement);
            }
        }, 100);
    }
    
    completeWheel(wheelElement) {
        // Анимация завершения
        wheelElement.style.background = '#4CAF50';
        wheelElement.style.boxShadow = '0 0 15px #4CAF50';
        
        setTimeout(() => {
            wheelElement.style.boxShadow = '';
        }, 500);
        
        this.wheelsCompleted++;
        document.getElementById('wheels-count').textContent = `${this.wheelsCompleted}/4`;
        
        if (this.wheelsCompleted === 4) {
            this.finishGame();
        } else {
            this.currentWheel++;
            this.currentStep = 'remove';
            this.nextNut = 1;
            this.showMessage(`Колесо ${this.wheelsCompleted}/4 готово! Следующее!`);
            this.switchTool('gun');
            
            // Подсвечиваем следующее колесо
            this.highlightCurrentWheel();
        }
    }
    
    highlightCurrentWheel() {
        // Снимаем подсветку со всех колес
        document.querySelectorAll('.wheel').forEach(wheel => {
            wheel.style.borderColor = '#444';
        });
        
        // Подсвечиваем текущее колесо
        const currentWheelElement = document.querySelector(`.wheel[data-wheel="${this.currentWheel}"]`);
        if (currentWheelElement) {
            currentWheelElement.style.borderColor = 'yellow';
        }
    }
    
    finishGame() {
        clearInterval(this.timer);
        this.isRunning = false;
        
        // Анимация победы
        document.querySelectorAll('.wheel').forEach(wheel => {
            wheel.style.animation = 'pulse 0.5s 3';
        });
        
        // Проверяем рекорд
        let message = '';
        let isNewRecord = false;
        
        if (!this.bestTime || this.time < this.bestTime) {
            this.bestTime = this.time;
            localStorage.setItem('f1-best-time', this.time);
            this.updateBestTimeDisplay();
            message = `🏆 НОВЫЙ РЕКОРД! ${this.time.toFixed(2)}с! 🏆`;
            isNewRecord = true;
        } else {
            message = `Финиш! Время: ${this.time.toFixed(2)}с`;
        }
        
        document.getElementById('start-btn').disabled = false;
        document.getElementById('start-btn').style.opacity = '1';
        document.getElementById('start-btn').innerHTML = '<i class="fas fa-redo"></i> НОВАЯ ПОПЫТКА';
        
        // Показываем результат
        setTimeout(() => {
            this.showMessage(message, isNewRecord ? 'success' : 'info');
            this.compareWithTeams();
        }, 800);
    }
    
    compareWithTeams() {
        const teams = [
            {name: 'Red Bull', time: 1.82},
            {name: 'Mercedes', time: 1.88},
            {name: 'Ferrari', time: 1.92},
            {name: 'McLaren', time: 1.95}
        ];
        
        let fasterThan = teams.filter(team => this.time < team.time).length;
        let comparisonText = '';
        
        if (fasterThan === 4) {
            comparisonText = '🏆 Ты чемпион! Быстрее ВСЕХ команд F1! 🏆';
        } else if (fasterThan >= 2) {
            comparisonText = `🔥 Отлично! Ты быстрее ${fasterThan} из 4 команд!`;
        } else if (fasterThan === 1) {
            comparisonText = `👍 Хорошо! Ты обогнал ${fasterThan} команду`;
        } else {
            comparisonText = '💪 Практикуйся! Ты можешь лучше!';
        }
        
        setTimeout(() => {
            alert(`${comparisonText}\n\nТвое время: ${this.time.toFixed(2)}с\n\nРекорды команд:\n${teams.map(t => `• ${t.name}: ${t.time}с`).join('\n')}`);
        }, 1000);
    }
    
    resetGame() {
        clearInterval(this.timer);
        this.isRunning = false;
        this.time = 0;
        this.currentWheel = 1;
        this.currentStep = 'remove';
        this.nextNut = 1;
        this.wheelsCompleted = 0;
        
        this.updateTimer();
        document.getElementById('wheels-count').textContent = '4/4';
        document.getElementById('start-btn').disabled = false;
        document.getElementById('start-btn').style.opacity = '1';
        document.getElementById('start-btn').innerHTML = '<i class="fas fa-play"></i> СТАРТ ГОНКИ';
        
        // Сброс всех гаек
        document.querySelectorAll('.nut').forEach(nut => {
            nut.style.background = 'gold';
            nut.style.transform = '';
            nut.style.boxShadow = '';
        });
        
        // Сброс колес
        document.querySelectorAll('.wheel').forEach(wheel => {
            wheel.style.background = '#222';
            wheel.style.borderColor = '#444';
            wheel.style.boxShadow = '';
            wheel.style.animation = '';
            
            // Удаляем прогресс бары если есть
            const progressBar = wheel.querySelector('div[style*="position: absolute"]');
            if (progressBar) progressBar.remove();
        });
        
        document.getElementById('gun-btn').style.background = '';
        
        this.showMessage('Готов к пит-стопу! Нажми СТАРТ!');
        this.switchTool('gun');
        this.highlightCurrentWheel();
        this.adjustForMobile();
    }
    
    switchTool(tool) {
        const gunBtn = document.getElementById('gun-btn');
        const wheelBtn = document.getElementById('wheel-btn');
        
        gunBtn.classList.remove('active');
        wheelBtn.classList.remove('active');
        
        if (tool === 'gun') {
            gunBtn.classList.add('active');
            gunBtn.style.background = '#e10600';
            wheelBtn.style.background = '#333';
        } else {
            wheelBtn.classList.add('active');
            wheelBtn.style.background = '#e10600';
            gunBtn.style.background = '#333';
        }
    }
    
    resetNutSequence(wheelElement) {
        this.nextNut = 1;
        wheelElement.querySelectorAll('.nut').forEach(nut => {
            nut.style.background = 'gold';
            nut.style.transform = '';
            nut.style.boxShadow = '';
        });
    }
    
    showMessage(text, type = 'info') {
        // Удаляем старое сообщение если есть
        const oldMessage = document.getElementById('game-message');
        if (oldMessage) oldMessage.remove();
        
        // Создаем новое уведомление
        const messageDiv = document.createElement('div');
        messageDiv.id = 'game-message';
        messageDiv.textContent = text;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 25px;
            border-radius: 10px;
            background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
            color: white;
            font-weight: bold;
            z-index: 1000;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 90%;
            word-wrap: break-word;
            opacity: 1;
            transition: opacity 0.5s;
        `;
        
        document.body.appendChild(messageDiv);
        
        // Автоскрытие
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 500);
        }, 2500);
    }
    
    updateBestTimeDisplay() {
        if (this.bestTime) {
            document.getElementById('best-time').textContent = 
                parseFloat(this.bestTime).toFixed(2);
            document.getElementById('user-record').textContent = 
                `${parseFloat(this.bestTime).toFixed(2)}с`;
        }
    }
}

// Запуск игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new PitStopGame();
});

// Добавляем CSS анимацию
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);
