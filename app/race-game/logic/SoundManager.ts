export class SoundManager {
  private audioCtx: AudioContext | null = null;
  private masterVolume: number = 0.2; // Ajusta este valor (0.0 a 1.0) para el volumen general

  // Método para desbloquear el audio en móviles (debe llamarse en un click/touchstart)
  async unlock() {
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      // Tocar un pequeño "beep" muy corto para activar el audio en mobile
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.01, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.05);
      
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.05);
    } catch (e) {
      console.error("Error desbloqueando audio:", e);
    }
  }


  private async initAudio() {
    if (!this.audioCtx) {
      await this.unlock();
    }
  }

  async playCollision(intensity: number) {
    if (!this.audioCtx || this.audioCtx.state === 'suspended') {
      await this.initAudio();
    }
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = Math.random() > 0.5 ? 'square' : 'triangle';
    
    const baseFreq = 100 + (Math.floor(Math.random() * 4) * 50);
    const freq = baseFreq + (intensity * 100);
    
    oscillator.frequency.setValueAtTime(freq, now);
    oscillator.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.1);
    
    // Aplicamos masterVolume
    gainNode.gain.setValueAtTime(0.12 * this.masterVolume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.1);

    if (intensity > 2) {
      const bufferSize = ctx.sampleRate * 0.05;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = ctx.createGain();
      
      noiseGain.gain.setValueAtTime(0.05 * this.masterVolume, now);
      noiseGain.gain.linearRampToValueAtTime(0, now + 0.05);
      
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
    }
  }

  playWin() {
    this.initAudio();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    
    const melody = [
      { f: 523.25, d: 0.1 }, 
      { f: 659.25, d: 0.1 }, 
      { f: 783.99, d: 0.1 }, 
      { f: 1046.50, d: 0.3 } 
    ];

    melody.forEach((note, i) => {
      const time = now + i * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(note.f, time);
      
      gain.gain.setValueAtTime(0.1 * this.masterVolume, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + note.d);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time);
      osc.stop(time + note.d);
    });
  }
  async playWarp(isShrinking: boolean) {
    await this.initAudio();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    const startFreq = isShrinking ? 880 : 220;
    const endFreq = isShrinking ? 220 : 880;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.2);

    gain.gain.setValueAtTime(0.1 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(now + 0.2);
  }

  async playPortal() {
    await this.initAudio();
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    
    // Spacey sweeping sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.3);
    
    gain.gain.setValueAtTime(0.15 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.3);
  }

  async playSpeedPad(isBooster: boolean) {
    await this.initAudio();
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    
    const f = isBooster ? 600 : 150;
    osc.frequency.setValueAtTime(f, now);
    osc.frequency.linearRampToValueAtTime(f * 2, now + 0.1);
    
    gain.gain.setValueAtTime(0.1 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.15);
  }

  async playBreakCrate() {
    await this.initAudio();
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    
    // Crunchy noise
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    
    gain.gain.setValueAtTime(0.2 * this.masterVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, now);
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }

  async playHazardHit() {
    await this.initAudio();
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    
    // Dissonant buzz
    [30, 45, 60].forEach(f => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(f, ctx.currentTime);
        gain.gain.setValueAtTime(0.2 * this.masterVolume, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    });
  }

  setVolume(volume: number) {
    this.masterVolume = volume;
  }
}

export const soundManager = new SoundManager();



