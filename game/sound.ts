export type SfxType = 'shoot' | 'hit' | 'damage' | 'explosion' | 'jump' | 'win' | 'lose';
export type BgmType = 'intro' | 'battle' | 'victory' | 'gameover' | 'none';

export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmOscillators: OscillatorNode[] = [];
  private bgmGain: GainNode | null = null;
  private currentBgm: BgmType = 'none';
  private nextNoteTime: number = 0;
  private timerID: number | null = null;
  private tempo: number = 120;
  private noteIndex: number = 0;
  private isMuted: boolean = false;

  constructor() {
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    if (AudioContextClass) {
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3; // Global volume
      this.masterGain.connect(this.ctx.destination);
    }
  }

  public async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public playSfx(type: SfxType) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);

    const now = this.ctx.currentTime;

    switch (type) {
      case 'shoot':
        // Pew pew - Volume reduced
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gain.gain.setValueAtTime(0.05, now); 
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;

      case 'hit':
        // Short noise/crunch
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;

      case 'damage':
        // Low thud
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.2);
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;

      case 'explosion':
        // Long decay noise-like
        osc.type = 'sawtooth';
        // Simulate noise by modulating freq rapidly (simplified)
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.5);
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
    }
  }

  public playBgm(type: BgmType) {
    if (this.currentBgm === type) return;
    this.stopBgm();
    this.currentBgm = type;
    if (this.isMuted || !this.ctx) return;

    this.noteIndex = 0;
    this.nextNoteTime = this.ctx.currentTime;
    
    switch (type) {
      case 'intro':
        this.tempo = 100;
        this.scheduler(this.playIntroNote);
        break;
      case 'battle':
        this.tempo = 140;
        this.scheduler(this.playBattleNote);
        break;
      case 'victory':
        this.tempo = 140; // Faster tempo for victory
        this.scheduler(this.playVictoryNote);
        break;
      case 'gameover':
        this.tempo = 80;
        this.scheduler(this.playGameOverNote);
        break;
    }
  }

  public stopBgm() {
    if (this.timerID !== null) {
      window.clearTimeout(this.timerID);
      this.timerID = null;
    }
    this.currentBgm = 'none';
  }

  // --- Sequencers ---

  private scheduler(playNoteFunction: () => void) {
    const lookahead = 25.0; // ms
    const scheduleAheadTime = 0.1; // s

    const nextNote = () => {
      // If stopped, don't schedule more
      if (this.currentBgm === 'none') return;

      const secondsPerBeat = 60.0 / this.tempo;
      // Schedule notes loop
      while (this.nextNoteTime < this.ctx!.currentTime + scheduleAheadTime) {
        // If stopped inside the loop (e.g. victory end), break
        if ((this.currentBgm as BgmType) === 'none') return;
        
        playNoteFunction.call(this);
        this.nextNoteTime += 0.25 * secondsPerBeat; // 16th notes
        this.noteIndex++;
      }
      this.timerID = window.setTimeout(nextNote, lookahead);
    };
    nextNote();
  }

  private playTone(freq: number, dur: number, time: number, type: OscillatorType = 'sine', vol: number = 0.3) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + dur);
    
    osc.start(time);
    osc.stop(time + dur);
  }

  // Simple melody generators
  private playBattleNote() {
    const beat = this.noteIndex % 16;
    const time = this.nextNoteTime;
    
    // Brighter Upbeat Bass Line (C Major -> G Major -> A Minor -> F Major progression attempt)
    // 16 steps total loop
    if (beat % 4 === 0) {
      // Bar 1 (0-3): C3 (130.81)
      // Bar 2 (4-7): G2 (98.00)
      // Bar 3 (8-11): A2 (110.00)
      // Bar 4 (12-15): F2 (87.31)
      const bassNotes = [130.81, 98.00, 110.00, 87.31];
      const freq = bassNotes[Math.floor(this.noteIndex / 16) % 4];
      this.playTone(freq, 0.3, time, 'sawtooth', 0.2);
    }
    
    // Bright Arpeggio (High octave)
    if (beat % 2 === 0) {
       // C E G C pattern shifted
       const arps = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
       const freq = arps[(beat / 2) % 4];
       this.playTone(freq, 0.1, time, 'square', 0.1);
    }
  }

  private playIntroNote() {
    const beat = this.noteIndex % 32;
    const time = this.nextNoteTime;
    
    // Brighter "Ready?" ping
    if (beat % 8 === 0) {
       this.playTone(523.25, 0.5, time, 'sine', 0.2); // C5
    }
    if (beat % 4 === 2) {
       this.playTone(783.99, 0.1, time, 'triangle', 0.1); // G5
    }
  }

  private playVictoryNote() {
    // Stop after the jingle finishes (approx 32 steps)
    if (this.noteIndex > 32) {
        this.stopBgm();
        return;
    }

    const time = this.nextNoteTime;
    const i = this.noteIndex;

    // Bright, cheerful fanfare (C Major)
    // C5, E5, G5, C6
    
    // Opening Fanfare
    if (i === 0) this.playTone(523.25, 0.2, time, 'square', 0.3); // C5
    if (i === 2) this.playTone(523.25, 0.2, time, 'square', 0.3); // C5
    if (i === 4) this.playTone(523.25, 0.2, time, 'square', 0.3); // C5
    if (i === 6) this.playTone(659.25, 0.4, time, 'square', 0.3); // E5
    if (i === 10) this.playTone(783.99, 0.4, time, 'square', 0.3); // G5
    if (i === 14) this.playTone(1046.50, 0.8, time, 'square', 0.4); // C6

    // Sparkling Arpeggio
    if (i === 22) this.playTone(783.99, 0.1, time, 'sine', 0.2); // G5
    if (i === 23) this.playTone(880.00, 0.1, time, 'sine', 0.2); // A5
    if (i === 24) this.playTone(987.77, 0.1, time, 'sine', 0.2); // B5
    if (i === 25) this.playTone(1046.50, 0.6, time, 'sine', 0.4); // C6
    
    // Add harmonic brightness
    if ([0,2,4,6,10,14].includes(i)) {
         this.playTone(1046.50 * (i === 14 ? 2 : 1.5), 0.1, time, 'sawtooth', 0.05);
    }
  }

  private playGameOverNote() {
    const beat = this.noteIndex % 32;
    const time = this.nextNoteTime;
    // Sad slow descent
    if (beat === 0) this.playTone(392, 0.8, time, 'sine', 0.3); // G4
    if (beat === 8) this.playTone(370, 0.8, time, 'sine', 0.3); // F#4
    if (beat === 16) this.playTone(349, 0.8, time, 'sine', 0.3); // F4
    if (beat === 24) this.playTone(330, 1.5, time, 'sine', 0.3); // E4
  }
}