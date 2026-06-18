/**
 * =============================================================================
 * audio.js — Procedural Audio Manager
 * =============================================================================
 *
 * Generates ALL game audio procedurally using the Web Audio API.  No external
 * sound files are loaded — every effect (engine hum, collision thud, countdown
 * beeps, fanfares) and the background music track are synthesised in real time.
 *
 * Architecture:
 *
 *   AudioContext → masterGain → destination (speakers)
 *                      ↑
 *          ┌───────────┼───────────┐
 *     engineGain   SFX nodes   music nodes
 *          ↑
 *     engineOsc (sawtooth, pitch ∝ speed)
 *
 * The AudioContext must be created from a user-gesture handler (browser
 * autoplay policy).  Call `init()` once from a click / touchstart handler
 * before attempting to play any sounds.
 *
 * Usage:
 *   const audio = new RacingGame.AudioManager();
 *   someButton.addEventListener('click', () => audio.init());
 *   // Each frame during gameplay:
 *   audio.playEngine(car.speed / CONFIG.MAX_SPEED);
 *   // One-shot effects:
 *   audio.playCollision();
 *   audio.playCountdown();
 *
 * @module RacingGame.AudioManager
 * =============================================================================
 */

/* ---------- Global namespace bootstrap ---------- */
window.RacingGame = window.RacingGame || {};

class AudioManager {

    /* ─────────────────────────────────────────────────────────────────────
     * Constructor
     * ───────────────────────────────────────────────────────────────────── */

    constructor() {
        /**
         * The Web Audio API context.  Created lazily in `init()` to comply
         * with autoplay policies that require a user gesture.
         * @type {AudioContext|null}
         */
        this.ctx = null;

        /** Whether one-shot sound effects are enabled. */
        this.soundEnabled = true;

        /** Whether the background music loop is enabled. */
        this.musicEnabled = true;

        /**
         * Master gain node — all audio routes through this so we can set an
         * overall volume ceiling.
         * @type {GainNode|null}
         */
        this.masterGain = null;

        /* ── Engine sound nodes ──────────────────────────────────── */

        /**
         * Continuous sawtooth oscillator whose frequency tracks car speed.
         * @type {OscillatorNode|null}
         */
        this.engineOsc = null;

        /**
         * Gain node controlling engine volume (ramps with speed).
         * @type {GainNode|null}
         */
        this.engineGain = null;

        /* ── Music sequencer ─────────────────────────────────────── */

        /**
         * `setInterval` handle for the music note sequencer.
         * @type {number|null}
         */
        this.musicInterval = null;

        /**
         * Current step index in the music sequencer pattern.
         * @type {number}
         * @private
         */
        this._musicStep = 0;
    }

    /* ─────────────────────────────────────────────────────────────────────
     * Initialisation
     * ───────────────────────────────────────────────────────────────────── */

    /**
     * Create the AudioContext and master gain node.
     *
     * **Must be called from inside a user-gesture handler** (click, touchstart,
     * keydown) so the browser allows audio playback.  Safe to call multiple
     * times — subsequent calls are no-ops.
     */
    init() {
        if (this.ctx) return; // already initialised

        this.ctx = new (window.AudioContext || window.webkitAudioContext)();

        /* Master gain sits between all sources and the speakers */
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3; // comfortable default ceiling
        this.masterGain.connect(this.ctx.destination);
    }

    /* ─────────────────────────────────────────────────────────────────────
     * Engine Sound
     * ─────────────────────────────────────────────────────────────────────
     *
     * A sawtooth oscillator gives a buzzy, mechanical character reminiscent
     * of classic arcade engine sounds.  Its frequency is linearly mapped
     * from an idle pitch (60 Hz) up to a high-rev pitch (200 Hz) based on
     * the car's current speed ratio (0 … 1).
     * ───────────────────────────────────────────────────────────────────── */

    /**
     * Start or update the continuous engine sound.
     *
     * @param {number} speedRatio - Normalised speed, 0 (stationary) to 1
     *                               (MAX_SPEED).  Values outside [0,1] are
     *                               clamped internally.
     */
    playEngine(speedRatio, nitroActive) {
        if (!this.ctx || !this.soundEnabled) return;

        const ratio = Math.max(0, Math.min(1, speedRatio));

        /* Lazy-create the oscillator on first call */
        if (!this.engineOsc) {
            this.engineGain = this.ctx.createGain();
            this.engineGain.gain.value = 0.0; // start silent
            this.engineGain.connect(this.masterGain);

            this.engineOsc = this.ctx.createOscillator();
            this.engineOsc.type = 'sawtooth';
            this.engineOsc.frequency.value = 60;
            this.engineOsc.connect(this.engineGain);
            this.engineOsc.start();
        }

        /* Map speed ratio to frequency & volume */
        const idleFreq = 60;
        const maxFreq  = nitroActive ? 280 : 220;
        const targetFreq = idleFreq + (maxFreq - idleFreq) * ratio;

        /* Smooth ramps avoid audible clicks / pops */
        const now = this.ctx.currentTime;
        this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.05);
        const vol = 0.15 * (0.3 + 0.7 * ratio) * (nitroActive ? 1.3 : 1);
        this.engineGain.gain.setTargetAtTime(vol, now, 0.05);
    }

    /**
     * Tire skid / screech sound — band-pass filtered noise burst.
     */
    playSkid() {
        if (!this.ctx || !this.soundEnabled) return;
        this._playNoise(0.18, 0.12);
        this._playTone(120, 0.15, 'sawtooth', 0.06);
    }

    /**
     * Stop the engine sound immediately and release the oscillator.
     */
    stopEngine() {
        if (this.engineOsc) {
            try { this.engineOsc.stop(); } catch (_) { /* already stopped */ }
            this.engineOsc.disconnect();
            this.engineOsc = null;
        }
        if (this.engineGain) {
            this.engineGain.disconnect();
            this.engineGain = null;
        }
    }

    /* ─────────────────────────────────────────────────────────────────────
     * One-Shot Sound Effects
     * ───────────────────────────────────────────────────────────────────── */

    /**
     * Play a collision / impact sound.
     *
     * Composed of two layers:
     *   1. A short burst of white noise (crunch / crackle).
     *   2. A low-frequency sine thump (body impact).
     */
    playCollision() {
        if (!this.ctx || !this.soundEnabled) return;

        /* Noise burst — 100 ms */
        this._playNoise(0.10, 0.20);

        /* Low thump — 80 Hz sine, 120 ms */
        this._playTone(80, 0.12, 'sine', 0.25);
    }

    /**
     * Play a countdown beep (3-2-1 ticks).
     *
     * Short 440 Hz sine tone, 150 ms duration.
     */
    playCountdown() {
        if (!this.ctx || !this.soundEnabled) return;
        this._playTone(440, 0.15, 'sine', 0.20);
    }

    /**
     * Play the "GO!" beep — higher pitch, longer duration than countdown.
     *
     * 880 Hz sine, 300 ms.
     */
    playGo() {
        if (!this.ctx || !this.soundEnabled) return;
        this._playTone(880, 0.30, 'sine', 0.25);
    }

    /**
     * Play a "lap complete" chime — quick ascending two-tone.
     *
     * First note: 440 Hz for 120 ms, then 660 Hz for 150 ms.
     */
    playLapComplete() {
        if (!this.ctx || !this.soundEnabled) return;

        const now = this.ctx.currentTime;

        /* Note 1 — A4 */
        this._playToneAt(440, 0.12, 'sine', 0.18, now);
        /* Note 2 — E5 (after 130 ms gap) */
        this._playToneAt(660, 0.15, 'sine', 0.18, now + 0.13);
    }

    /**
     * Play the race-finish fanfare — three-note ascending major arpeggio.
     *
     * @param {boolean} won - `true` if the player won (brighter, louder).
     */
    playFinish(won) {
        if (!this.ctx || !this.soundEnabled) return;

        const now = this.ctx.currentTime;
        const vol = won ? 0.25 : 0.18;

        /*
         * C-E-G major triad arpeggio (or higher octave for a win).
         * Frequencies: C4=262, E4=330, G4=392
         *              C5=523, E5=659, G5=784
         */
        const base = won ? [523, 659, 784] : [262, 330, 392];

        this._playToneAt(base[0], 0.20, 'sine', vol, now);
        this._playToneAt(base[1], 0.20, 'sine', vol, now + 0.18);
        this._playToneAt(base[2], 0.35, 'sine', vol, now + 0.36);
    }

    /* ─────────────────────────────────────────────────────────────────────
     * Background Music
     * ─────────────────────────────────────────────────────────────────────
     *
     * A simple looping synthesiser pattern with a bass line and a lead.
     * Tempo: ~120 BPM → 500 ms per beat → 125 ms per sixteenth note.
     * The sequencer fires on an interval, cycling through a 16-step
     * pattern that combines bass notes and higher arpeggiated stabs.
     * ───────────────────────────────────────────────────────────────────── */

    /**
     * Start the background music loop.
     *
     * Safe to call multiple times — if music is already playing the call
     * is a no-op.
     */
    startMusic() {
        if (!this.ctx || !this.musicEnabled || this.musicInterval) return;

        this._musicStep = 0;

        /*
         * 16-step sequencer pattern.
         * Each entry is [bassFreq|null, leadFreq|null].
         *   - Bass: square wave, provides rhythmic drive.
         *   - Lead: triangle wave, provides melodic interest.
         *
         * Pattern key (approximate):
         *   Bass: E2(82), A2(110), B2(123), C3(131)
         *   Lead: E4(330), G4(392), A4(440), B4(494)
         */
        const pattern = [
            [82,  330 ],  // 1  — kick + lead
            [null, null],  // 2
            [null, 392 ],  // 3  — lead
            [null, null],  // 4
            [110, 440 ],  // 5  — bass + lead
            [null, null],  // 6
            [null, 392 ],  // 7  — lead
            [null, null],  // 8
            [123, 330 ],  // 9  — bass + lead
            [null, null],  // 10
            [null, 494 ],  // 11 — lead
            [null, null],  // 12
            [131, 440 ],  // 13 — bass + lead
            [null, null],  // 14
            [null, 330 ],  // 15 — lead
            [null, null],  // 16
        ];

        const stepDuration = 0.125; // seconds per step (≈120 BPM 16ths)

        this.musicInterval = setInterval(() => {
            if (!this.ctx || !this.musicEnabled) return;

            const step = pattern[this._musicStep % pattern.length];

            /* Bass note — punchy square wave */
            if (step[0] !== null) {
                this._playTone(step[0], 0.10, 'square', 0.08);
            }

            /* Lead note — softer triangle wave */
            if (step[1] !== null) {
                this._playTone(step[1], 0.08, 'triangle', 0.06);
            }

            this._musicStep++;
        }, stepDuration * 1000);
    }

    /**
     * Stop the background music loop.
     */
    stopMusic() {
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
        this._musicStep = 0;
    }

    /* ─────────────────────────────────────────────────────────────────────
     * Toggle Controls
     * ───────────────────────────────────────────────────────────────────── */

    /**
     * Toggle one-shot sound effects on / off.
     * @returns {boolean} New state (`true` = enabled).
     */
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;

        /* If disabling sound, also kill the engine oscillator */
        if (!this.soundEnabled) {
            this.stopEngine();
        }

        return this.soundEnabled;
    }

    /**
     * Toggle background music on / off.
     *
     * Automatically starts or stops the music loop.
     * @returns {boolean} New state (`true` = enabled).
     */
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;

        if (this.musicEnabled) {
            this.startMusic();
        } else {
            this.stopMusic();
        }

        return this.musicEnabled;
    }

    /**
     * @returns {boolean} Whether sound effects are currently enabled.
     */
    isSoundEnabled() {
        return this.soundEnabled;
    }

    /**
     * @returns {boolean} Whether background music is currently enabled.
     */
    isMusicEnabled() {
        return this.musicEnabled;
    }

    /* ─────────────────────────────────────────────────────────────────────
     * Private Helpers
     * ───────────────────────────────────────────────────────────────────── */

    /**
     * Play a single tone starting NOW.
     *
     * Creates a temporary oscillator → gain chain that auto-disconnects
     * after the note finishes.  A short exponential ramp-down avoids the
     * harsh click that would occur if the oscillator were stopped abruptly.
     *
     * @param {number} freq     - Frequency in Hz.
     * @param {number} duration - Duration in seconds.
     * @param {string} [type='sine'] - Oscillator waveform type.
     * @param {number} [volume=0.2]  - Peak gain (0–1).
     * @private
     */
    _playTone(freq, duration, type = 'sine', volume = 0.2) {
        this._playToneAt(freq, duration, type, volume, this.ctx.currentTime);
    }

    /**
     * Play a single tone at a specific AudioContext time.
     *
     * Useful for scheduling notes ahead of time (arpeggios, fanfares).
     *
     * @param {number} freq      - Frequency in Hz.
     * @param {number} duration  - Duration in seconds.
     * @param {string} type      - Oscillator waveform type.
     * @param {number} volume    - Peak gain (0–1).
     * @param {number} startTime - AudioContext time to begin playback.
     * @private
     */
    _playToneAt(freq, duration, type, volume, startTime) {
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(volume, startTime);
        /* Smooth fade-out over the last 30% of the note to avoid clicks */
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            startTime + duration
        );

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + duration + 0.01);

        /* Cleanup: disconnect nodes after playback to free resources */
        osc.onended = () => {
            osc.disconnect();
            gain.disconnect();
        };
    }

    /**
     * Play a burst of white noise.
     *
     * White noise is generated by filling an AudioBuffer with random
     * samples in [-1, 1].  A gain envelope provides a quick attack and
     * exponential decay for a punchy, percussive texture.
     *
     * @param {number} duration - Duration in seconds.
     * @param {number} [volume=0.15] - Peak gain (0–1).
     * @private
     */
    _playNoise(duration, volume = 0.15) {
        if (!this.ctx) return;

        const sampleRate = this.ctx.sampleRate;
        const numSamples = Math.ceil(sampleRate * duration);
        const buffer = this.ctx.createBuffer(1, numSamples, sampleRate);
        const data = buffer.getChannelData(0);

        /* Fill with uniform white noise */
        for (let i = 0; i < numSamples; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        source.connect(gain);
        gain.connect(this.masterGain);

        source.start(now);
        source.stop(now + duration + 0.01);

        /* Cleanup on end */
        source.onended = () => {
            source.disconnect();
            gain.disconnect();
        };
    }
}

/* ---------- Export to global namespace ---------- */
window.RacingGame.AudioManager = AudioManager;
