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
    }
    
    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        
        document.querySelectorAll('.nut').forEach(nut => {
            nut.addEventListener('click', (e) => this.handleNutClick(e));
        });
        
        document.getElementById('gun-btn').addEventListener('click', () => this.switchTool('gun'));
        document.getElementById('wheel-btn').addEventListener('click', () => this.switchTool('wheel'));
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
        
        if (nutNumber === this.nextNut && wheelNumber === this.currentWheel) {
            event.target.style.background = '#4CAF50';
            event.target.style.transform = 'scale(0.8)';
            
            this.nextNut++;
            
            if (this.nextNut > 5) {
                if (this.currentStep === 'remove') {
                    this.currentStep = 'install';
                    this.nextNut = 1;
                    this.showMessage('Отлично! Теперь установи новое колесо');
                    this.switchTool('wheel');
                } else if (this.currentStep === 'install') {
                    this.currentStep = 'tighten';
                    this.startTightening(wheelElement);
                }
            }
        } else {
            this.time += 0.3;
            this.showMessage('ОШИБКА! Неправильный порядок! +0.30с', 'error');
            this.resetNutSequence(wheelElement);
        }
    }
    
    startTightening(wheelElement) {
        this.showMessage('Затягивай гайки! Удерживай кнопку...');
        const tightenBtn = document.getElementById('gun-btn');
        
        let tightenTime = 0;
        const tightenInterval = setInterval(() => {
            tightenTime += 0.1;
            if (tightenTime >= 0.5) {
                clearInterval(tightenInterval);
                this.completeWheel(wheelElement);
            }
        }, 100);
    }
    
    completeWheel(wheelElement) {
        wheelElement.style.background = '#4CAF50';
        this.wheelsCompleted++;
        document.getElementById('wheels-count').textContent = 
            `${this.wheelsCompleted}/4`;
        
        if (this.wheelsCompleted === 4) {
            this.finishGame();
        } else {
            this.currentWheel++;
            this.currentStep = 'remove';
            this.nextNut = 1;
            this.showMessage(`Колесо ${this.wheelsCompleted}/4 готово! Следующее!`);
            this.switchTool('gun');
        }
    }
    
    finishGame() {
        clearInterval(this.timer);
        this.isRunning = false;
        
        if (!this.bestTime || this.time < this.bestTime) {
            this.bestTime = this.time;
            localStorage.setItem('f1-best-time', this.time);
            this.updateBestTimeDisplay();
            this.showMessage(`НОВЫЙ РЕКОРД! ${this.time.toFixed(2)}с! 🏆`, 'success');
        } else {
            this.showMessage(`Финиш! Время: ${this.time.toFixed(2)}с`, 'info');
        }
        
        this.compareWithTeams();
    }
    
    compareWithTeams() {
        const teams = [
            {name: 'Red Bull', time: 1.82},
            {name: 'Mercedes', time: 1.88},
            {name: 'Ferrari', time: 1.92},
            {name: 'McLaren', time: 1.95}
        ];
        
        let fasterThan = teams.filter(team => this.time < team.time).length;
        alert(`Ты быстрее, чем ${fasterThan} из 4 команд F1!`);
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
        
        document.querySelectorAll('.nut').forEach(nut => {
            nut.style.background = 'gold';
            nut.style.transform = '';
        });
        
        document.querySelectorAll('.wheel').forEach(wheel => {
            wheel.style.background = '#222';
        });
        
        this.showMessage('Готов к пит-стопу!');
        this.switchTool('gun');
    }
    
    switchTool(tool) {
        const gunBtn = document.getElementById('gun-btn');
        const wheelBtn = document.getElementById('wheel-btn');
        
        gunBtn.classList.remove('active');
        wheelBtn.classList.remove('active');
        
        if (tool === 'gun') {
            gunBtn.classList.add('active');
        } else {
            wheelBtn.classList.add('active');
        }
    }
    
    resetNutSequence(wheelElement) {
        this.nextNut = 1;
        wheelElement.querySelectorAll('.nut').forEach(nut => {
            nut.style.background = 'gold';
            nut.style.transform = '';
        });
    }
    
    showMessage(text, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${text}`);
        if (type === 'error') {
            alert(`⚠️ ${text}`);
        }
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

document.addEventListener('DOMContentLoaded', () => {
    new PitStopGame();
});
