/**
 * Procedural Audio Synthesizer for MediDrone AI using Web Audio API
 * 100% Procedural - Zero external audio file / 404 dependencies
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private rotorOsc: OscillatorNode | null = null;
  private rotorGain: GainNode | null = null;
  private rotorFilter: BiquadFilterNode | null = null;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.rotorGain && this.ctx) {
      this.rotorGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Soft UI click feedback
  public playClick(freq = 800) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // AudioContext policy fallback
    }
  }

  // Telemetry pulse / beep
  public playTelemetryBeep(high = false) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(high ? 1480 : 960, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {}
  }

  // Emergency warning alarm
  public playAlert() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.linearRampToValueAtTime(950, now + 0.15);
      osc.frequency.linearRampToValueAtTime(650, now + 0.3);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  // Mission accomplished / Touchdown chime
  public playSuccessChime() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime + idx * 0.1;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
      });
    } catch {}
  }

  // Biometric payload latch unlocking sound
  public playCargoUnlock() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Mechanical latch click 1
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'square';
      osc1.frequency.setValueAtTime(320, now);
      osc1.frequency.exponentialRampToValueAtTime(120, now + 0.08);
      gain1.gain.setValueAtTime(0.09, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.08);

      // Pneumatic hiss release
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(800, now + 0.09);
      osc2.frequency.exponentialRampToValueAtTime(400, now + 0.25);
      gain2.gain.setValueAtTime(0.04, now + 0.09);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.25);
    } catch {}
  }

  // Drone rotor acoustic loop (procedural low frequency pulse + wind filter)
  public startDroneRotorSound(intensity = 0.5) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      if (!this.rotorOsc) {
        this.rotorOsc = this.ctx.createOscillator();
        this.rotorGain = this.ctx.createGain();
        this.rotorFilter = this.ctx.createBiquadFilter();

        this.rotorFilter.type = 'lowpass';
        this.rotorFilter.frequency.setValueAtTime(220, this.ctx.currentTime);

        this.rotorOsc.type = 'triangle';
        this.rotorOsc.frequency.setValueAtTime(75, this.ctx.currentTime); // Base hexacopter blade pass freq

        this.rotorGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        this.rotorOsc.connect(this.rotorFilter);
        this.rotorFilter.connect(this.rotorGain);
        this.rotorGain.connect(this.ctx.destination);

        this.rotorOsc.start();
      }

      const targetGain = Math.min(0.08 * intensity, 0.08);
      this.rotorGain?.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.4);
      this.rotorOsc.frequency.setTargetAtTime(70 + intensity * 60, this.ctx.currentTime, 0.3);
      this.rotorFilter?.frequency.setTargetAtTime(180 + intensity * 260, this.ctx.currentTime, 0.3);
    } catch {}
  }

  public stopDroneRotorSound() {
    if (this.rotorGain && this.ctx) {
      this.rotorGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.5);
    }
  }
}

export const soundFx = new SoundEngine();
