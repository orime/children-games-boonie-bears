// Web Audio API 简易声音合成器
// 2岁小朋友游戏专用，无需下载外部音频文件

class SoundEngine {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.isInitialized = false;
        
        // 音阶频率 (C大调为主)
        this.notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    }
    
    init() {
        if (!this.isInitialized) {
            // 在用户交互后初始化/恢复
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            this.isInitialized = true;
        }
    }

    // 播放弹跳的声音 (类似马里奥跳跃)
    playBoing() {
        if (!this.isInitialized) return;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        osc.type = 'sine';
        const now = this.ctx.currentTime;
        
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.5, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        osc.start(now);
        osc.stop(now + 0.3);
    }

    // 播放叮咚敲击声 (随机音高)
    playPop() {
        if (!this.isInitialized) return;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        osc.type = 'triangle';
        const now = this.ctx.currentTime;
        
        const freq = this.notes[Math.floor(Math.random() * this.notes.length)] * 2;
        osc.frequency.setValueAtTime(freq, now);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.5, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        osc.start(now);
        osc.stop(now + 0.2);
    }

    // 错误的声音或者低沉滑稽声
    playWah() {
        if (!this.isInitialized) return;
        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        osc.type = 'sawtooth';
        const now = this.ctx.currentTime;
        
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.5);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        osc.start(now);
        osc.stop(now + 0.5);
    }
    
    // 短促的嚓嚓声（类似碎纸）
    playSweep() {
        if (!this.isInitialized) return;
        const bufferSize = this.ctx.sampleRate * 0.1; 
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000 + Math.random() * 2000;
        
        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(1, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        noise.start();
    }
    
    // 随机选择一种声音播放
    playRandom() {
        const r = Math.random();
        if (r < 0.4) this.playPop();
        else if (r < 0.7) this.playBoing();
        else if (r < 0.9) this.playSweep();
        else this.playWah();
    }

    // 庆祝音效 (上行琶音)
    playCelebration() {
        if (!this.isInitialized) return;
        const now = this.ctx.currentTime;
        this.notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq * 2, now + i * 0.12);
            gain.gain.setValueAtTime(0, now + i * 0.12);
            gain.gain.linearRampToValueAtTime(0.4, now + i * 0.12 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.3);
            osc.start(now + i * 0.12);
            osc.stop(now + i * 0.12 + 0.3);
        });
    }
}

// 导出全局单例
window.soundEngine = new SoundEngine();
