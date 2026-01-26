export class SoundManager {
  private audioCtx: AudioContext | null = null;
  private masterVolume: number = 0.2; // Ajusta este valor (0.0 a 1.0) para el volumen general

  private async initAudio() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
  }

  async playCollision(intensity: number) {
    await this.initAudio();

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
}

export const soundManager = new SoundManager();


