class PitStopGame {
    constructor() {
        this.time = 0;
        this.timer = null;
        this.isRunning = false;
        this.currentWheel = 1;
        this.currentStep = 'remove'; // 'remove', 'install', 'tighten'
        this.nextNut = 1;
        this.wheelsCompleted = 0;
        this.activeTool = 'gun'; // 'gun' или 'wheel'
        this.bestTime = localStorage.getItem('f1-best-time') || null;
        this.wheelStates = {
            1: { status: 'old', nutsRemoved: 0 },
            2: { status: 'old', nutsRemoved: 0 },
            3: { status: 'old', nutsRemoved: 0 },
            4: { status: 'old', nutsRemoved: 0 }
        };
        
        this.init();
    }
    
    init() {
        this.updateBestTimeDisplay();
        this.setupEventListeners();
        this.resetGame();
    }
    
    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        
        // Клики по гайкам
        document.querySelectorAll('.nut').forEach(nut => {
            nut.addEventListener('click', (e) => this.handleNutClick(e));
        });
        
        // Переключение инструментов
        document.getElementById('gun-btn').addEventListener('click', () => this.switchTool('gun'));
        document.getElementById('wheel-btn').addEventListener('click', () => this.switchTool('wheel'));
        
        // Добавляем слушатель для установки нового колеса
        document.querySelectorAll('.wheel').forEach(wheel => {
            wheel.addEventListener('click', (e) => {
                if (this.activeTool === 'wheel' && this.isRunning) {
                    this.installNewWheel(e.currentTarget);
                }
            });
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
        document.getElementById('start-btn').innerHTML = '<i class="fas fa-flag-checkered"></i> ГОНКА ИДЕТ!';
        this.showMessage('GO GO GO! Снимай старое колесо!', 'start');
    }
    
    switchTool(tool) {
        this.activeTool = tool;
        const gunBtn = document.getElementById('gun-btn');
        const wheelBtn = document.getElementById('wheel-btn');
        
        gunBtn.classList.remove('active');
        wheelBtn.classList.remove('active');
        
        if (tool === 'gun') {
            gunBtn.classList.add('active');
            this.showMessage('Инструмент: ГАЙКОВЁРТ. Откручивай/затягивай гайки', 'tool');
        } else {
            wheelBtn.classList.add('active');
            this.showMessage('Инструмент: КОЛЕСО. Кликай на колесо для замены', 'tool');
        }
    }
    
    handleNutClick(event) {
        if (!this.isRunning || this.activeTool !== 'gun') {
            this.showMessage('Сначала выбери гайковерт!', 'error');
            return;
        }
        
        const nutElement = event.target;
        const nutNumber = parseInt(nutElement.dataset.nut);
        const wheelElement = nutElement.closest('.wheel');
        const wheelNumber = parseInt(wheelElement.dataset.wheel);
        
        // Проверяем, активное ли это колесо
        if (wheelNumber !== this.currentWheel) {
            this.showMessage(`Сначала закончи колесо ${this.currentWheel}!`, 'error');
            return;
        }
        
        const wheelState = this.wheelStates[wheelNumber];
        
        // Логика для снятия старого колеса
        if (this.currentStep === 'remove') {
            if (nutNumber === this.nextNut) {
                // Правильный порядок
                nutElement.style.background = '#888';
                nutElement.style.transform = 'scale(0.7)';
                nutElement.classList.add('removed');
                wheelState.nutsRemoved++;
                
                // Звуковой эффект (если добавишь звук)
                // this.playSound('nut_off');
                
                this.nextNut++;
                this.showMessage(`Гайка ${nutNumber} снята! Следующая: ${this.nextNut}`, 'success');
                
                // Если сняты все 5 гаек
                if (this.nextNut > 5) {
                    wheelElement.classList.add('wheel-removed');
                    wheelElement.style.opacity = '0.5';
                    this.currentStep = 'install';
                    this.showMessage('Отлично! Теперь возьми НОВОЕ КОЛЕСО и кликни на старое', 'warning');
                    this.switchTool('wheel');
                }
            } else {
                // Неправильный порядок - штраф
                this.time += 0.3;
                this.showMessage(`ОШИБКА! Нужна гайка №${this.nextNut}, а не №${nutNumber}! +0.30с`, 'error');
                this.resetNutSequence(wheelElement);
                // this.playSound('error');
            }
        }
        // Логика для установки нового колеса (затяжка)
        else if (this.currentStep === 'tighten') {
            if (nutNumber === this.nextNut) {
                // Правильный порядок затяжки
                nutElement.style.background = '#4CAF50';
                nutElement.style.transform = 'scale(0.9)';
                
                // Звуковой эффект
                // this.playSound('nut_on');
                
                this.nextNut++;
                this.showMessage(`Гайка ${nutNumber} затянута! Следующая: ${this.nextNut}`, 'success');
                
                // Если все гайки затянуты
                if (this.nextNut > 5) {
                    this.completeWheel(wheelElement, wheelNumber);
                }
            } else {
                // Штраф за неправильную затяжку
                this.time += 0.2;
                this.showMessage(`Не та гайка! Затягивай по порядку! +0.20с`, 'error');
                // this.playSound('error');
            }
        }
    }
    
    installNewWheel(wheelElement) {
        if (!this.isRunning || this.activeTool !== 'wheel') return;
        
        const wheelNumber = parseInt(wheelElement.dataset.wheel);
        
        // Проверяем, что это текущее колесо и старое снято
        if (wheelNumber !== this.currentWheel) {
            this.showMessage(`Сначала замени колесо ${this.currentWheel}!`, 'error');
            return;
        }
        
        if (this.wheelStates[wheelNumber].nutsRemoved !== 5) {
            this.showMessage('Сначала сними все гайки со старого колеса!', 'error');
            return;
        }
        
        // Устанавливаем новое колесо
        wheelElement.classList.remove('wheel-removed');
        wheelElement.style.opacity = '1';
        wheelElement.style.background = '#333';
        wheelElement.classList.add('new-wheel');
        
        // Сбрасываем гайки для затяжки
        const nuts = wheelElement.querySelectorAll('.nut');
        nuts.forEach(nut => {
            nut.style.background = '#FFC107';
            nut.style.transform = '';
            nut.classList.remove('removed');
        });
        
        // Звуковой эффект
        // this.playSound('wheel_change');
        
        // Переходим к затяжке
        this.currentStep = 'tighten';
        this.nextNut = 1;
        this.wheelStates[wheelNumber].status = 'new';
        
        this.showMessage('Новое колесо установлено! Теперь затяни гайки по порядку', 'warning');
        this.switchTool('gun');
    }
    
    completeWheel(wheelElement, wheelNumber) {
        // Анимация завершения колеса
        wheelElement.style.background = '#4CAF50';
        wheelElement.style.boxShadow = '0 0 15px #4CAF50';
        
        // Звук завершения
        // this.playSound('wheel_done');
        
        this.wheelsCompleted++;
        document.getElementById('wheels-count').textContent = 
            `${4 - this.wheelsCompleted}`;
        
        // Обновляем состояние
        this.wheelStates[wheelNumber].status = 'done';
        
        if (this.wheelsCompleted === 4) {
            this.finishGame();
        } else {
            // Переходим к следующему колесу
            this.currentWheel++;
            
            // Находим следующее необработанное колесо
            while (this.currentWheel <= 4 && this.wheelStates[this.currentWheel].status === 'done') {
                this.currentWheel++;
            }
            
            if (this.currentWheel <= 4) {
                this.currentStep = 'remove';
                this.nextNut = 1;
                this.showMessage(`Колесо ${wheelNumber} готово! Переходи к колесу ${this.currentWheel}`, 'info');
                
                // Подсвечиваем следующее колесо
                this.highlightCurrentWheel();
            }
        }
    }
    
    highlightCurrentWheel() {
        // Снимаем подсветку со всех колес
        document.querySelectorAll('.wheel').forEach(wheel => {
            wheel.style.boxShadow = 'none';
        });
        
        // Подсвечиваем текущее колесо
        const currentWheelElement = document.querySelector(`.wheel[data-wheel="${this.currentWheel}"]`);
        if (currentWheelElement) {
            currentWheelElement.style.boxShadow = '0 0 10px yellow';
        }
    }
    
    resetNutSequence(wheelElement) {
        this.nextNut = 1;
        const nuts = wheelElement.querySelectorAll('.nut');
        nuts.forEach(nut => {
            nut.style.background = 'gold';
            nut.style.transform = '';
            nut.classList.remove('removed');
        });
        
        // Сбрасываем счетчик снятых гаек
        const wheelNumber = parseInt(wheelElement.dataset.wheel);
        this.wheelStates[wheelNumber].nutsRemoved = 0;
    }
    
    finishGame() {
        clearInterval(this.timer);
        this.isRunning = false;
        
        // Фейерверк или анимация
        document.querySelectorAll('.wheel').forEach(wheel => {
            wheel.style.animation = 'pulse 0.5s 3';
        });
        
        // Проверяем рекорд
        let message = '';
        if (!this.bestTime || this.time < this.bestTime) {
            this.bestTime = this.time;
            localStorage.setItem('f1-best-time', this.time);
            this.updateBestTimeDisplay();
            message = `🏆 НОВЫЙ РЕКОРД! ${this.time.toFixed(2)}с! 🏆`;
            // this.playSound('new_record');
        } else {
            message = `Финиш! Время: ${this.time.toFixed(2)}с`;
            // this.playSound('finish');
        }
        
        document.getElementById('start-btn').disabled = false;
        document.getElementById('start-btn').innerHTML = '<i class="fas fa-play"></i> НОВАЯ ПОПЫТКА';
        
        // Показываем результат
        setTimeout(() => {
            this.showMessage(message, 'finish');
            this.compareWithTeams();
        }, 500);
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
            comparisonText = 'Ты чемпион! Быстрее ВСЕХ команд!';
        } else if (fasterThan === 0) {
            comparisonText = 'Практикуйся! Ты медленнее всех команд F1';
        } else {
            comparisonText = `Ты быстрее, чем ${fasterThan} из 4 команд F1!`;
        }
        
        alert(`${comparisonText}\n\nРекорды команд:\n${teams.map(t => `${t.name}: ${t.time}с`).join('\n')}`);
    }
    
    resetGame() {
        clearInterval(this.timer);
        this.isRunning = false;
        this.time = 0;
        this.currentWheel = 1;
        this.currentStep = 'remove';
        this.nextNut = 1;
        this.wheelsCompleted = 0;
        this.activeTool = 'gun';
        
        // Сбрасываем состояния колес
        for (let i = 1; i <= 4; i++) {
            this.wheelStates[i] = { status: 'old', nutsRemoved: 0 };
        }
        
        this.updateTimer();
        document.getElementById('wheels-count').textContent = '4';
        document.getElementById('start-btn').disabled = false;
        document.getElementById('start-btn').innerHTML = '<i class="fas fa-play"></i> СТАРТ ГОНКИ';
        
        // Сброс всех гаек
        document.querySelectorAll('.nut').forEach(nut => {
            nut.style.background = 'gold';
            nut.style.transform = '';
            nut.classList.remove('removed');
        });
        
        // Сброс колес
        document.querySelectorAll('.wheel').forEach(wheel => {
            wheel.style.background = '#222';
            wheel.style.opacity = '1';
            wheel.style.boxShadow = 'none';
            wheel.classList.remove('wheel-removed', 'new-wheel');
        });
        
        // Подсвечиваем первое колесо
        this.highlightCurrentWheel();
        
        this.showMessage('Готов к пит-стопу! Выбери гайковерт и начинай!', 'reset');
        this.switchTool('gun');
    }
    
    showMessage(text, type = 'info') {
        // Создаем или находим блок для сообщений
        let messageBox = document.getElementById('message-box');
        if (!messageBox) {
            messageBox = document.createElement('div');
            messageBox.id = 'message-box';
            messageBox.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                padding: 15px 25px;
                border-radius: 10px;
                color: white;
                font-weight: bold;
                z-index: 1000;
                min-width: 300px;
                text-align: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                transition: all 0.3s;
            `;
            document.body.appendChild(messageBox);
        }
        
        // Цвета в зависимости от типа
        const colors = {
            'start': '#4CAF50',
            'success': '#4CAF50',
            'error': '#f44336',
            'warning': '#FF9800',
            'info': '#2196F3',
            'tool': '#9C27B0',
            'reset': '#607D8B',
            'finish': '#FFC107'
        };
        
        messageBox.style.background = colors[type] || '#333';
        messageBox.textContent = text;
        messageBox.style.display = 'block';
        
        // Автоскрытие через 3 секунды
        setTimeout(() => {
            messageBox.style.opacity = '0';
            setTimeout(() => {
                messageBox.style.display = 'none';
                messageBox.style.opacity = '1';
            }, 300);
        }, 3000);
        
        // Также в консоль для отладки
        console.log(`[${type.toUpperCase()}] ${text}`);
    }
    
    updateBestTimeDisplay() {
        if (this.bestTime) {
            document.getElementById('best-time').textContent = 
                parseFloat(this.bestTime).toFixed(2);
            document.getElementById('user-record').textContent = 
                `${parseFloat(this.bestTime).toFixed(2)}с`;
        }
    }
    
    // Метод для звуков (добавь позже)
    playSound(soundName) {
        // Пример: const audio = new Audio(`assets/sounds/${soundName}.mp3`);
        // audio.play();
    }
}

// Запуск игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new PitStopGame();
});
