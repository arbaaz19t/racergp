/**
 * game.js — Core game controller with effects, particles, track/car selection.
 */
window.RacingGame = window.RacingGame || {};

(function () {
    'use strict';

    const RG = window.RacingGame;

    class Game {
        constructor(canvas, uiContainer) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.uiContainer = uiContainer;

            this.input = new RG.InputManager();
            this.audio = new RG.AudioManager();
            this.storage = new RG.StorageManager();
            this.leaderboard = new RG.LeaderboardManager();
            this.hud = new RG.HUD();
            this.particles = new RG.ParticleSystem();
            this.effects = new RG.EffectsManager();

            this.track = null;
            this.physics = null;
            this.ui = null;

            this.state = 'MENU';
            this.mode = null;
            this.pendingMode = null;

            this.playerCar = null;
            this.aiCars = [];
            this.allCars = [];

            this.raceTime = 0;
            this.lastTimestamp = 0;
            this.camera = { x: 0, y: 0 };
            this._audioInitialized = false;
            this._wasDrifting = false;
        }

        init() {
            this._resize();
            window.addEventListener('resize', () => this._resize());

            this.ui = new RG.UIManager(this.uiContainer, {
                onQuickRace: () => this._openTrackSelect('quickRace'),
                onTimeTrial: () => this._openTrackSelect('timeTrial'),
                onStartRace: (mode, trackId) => this.startRace(mode, trackId),
                onGarage: () => this.ui.showScreen('garage'),
                onSelectCar: (carId) => this._selectCar(carId),
                onSelectTrack: (trackId) => this.storage.setSelectedTrackId(trackId),
                onResume: () => this.resume(),
                onRestart: () => this.restart(),
                onQuit: () => this.quit(),
                onSettingsChanged: (type, value) => this._onSettingsChanged(type, value)
            });

            // Restore persisted settings
            this.audio.soundEnabled = this.storage.isSoundEnabled();
            this.audio.musicEnabled = this.storage.isMusicEnabled();
            this.ui.updateSettings(this.audio.isSoundEnabled(), this.audio.isMusicEnabled(), this.storage.getAiDifficulty());
            this.ui.updateGarage(RG.CARS, this.storage);
            this.ui.updateTrackSelect(RG.TRACKS, this.storage.getSelectedTrackId());

            this.ui.showScreen('menu');
            this.lastTimestamp = performance.now();
            this._loop(this.lastTimestamp);

            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    if (this.state === 'RACING') this.pause();
                    else if (this.state === 'PAUSED') this.resume();
                }
            });
        }

        _openTrackSelect(mode) {
            this.pendingMode = mode;
            this.ui.setPendingMode(mode);
            this.ui.updateTrackSelect(RG.TRACKS, this.storage.getSelectedTrackId());
            this.ui.showScreen('trackSelect');
        }

        _selectCar(carId) {
            if (!this.storage.isCarUnlocked(carId)) return;
            this.storage.setSelectedCarId(carId);
            this.ui.updateGarage(RG.CARS, this.storage);
        }

        _getTrackById(id) {
            return RG.TRACKS.find(t => t.id === id) || RG.TRACKS[0];
        }

        _getCarById(id) {
            return RG.CARS.find(c => c.id === id) || RG.CARS[0];
        }

        startRace(mode, trackId) {
            if (!this._audioInitialized) {
                this.audio.init();
                this._audioInitialized = true;
            }

            this.mode = mode || this.pendingMode || 'quickRace';
            const tid = trackId || this.storage.getSelectedTrackId();
            this.storage.setSelectedTrackId(tid);

            const trackData = this._getTrackById(tid);
            this.track = new RG.TrackRenderer(trackData);
            this.physics = new RG.PhysicsEngine(this.track);
            this.particles.clear();
            this.effects.clear();

            const startPos = this.track.getStartPositions();
            const waypoints = this.track.getWaypoints();
            const carData = this._getCarById(this.storage.getSelectedCarId());

            const p = startPos[0];
            this.playerCar = new RG.Car(p.x, p.y, p.angle, carData.color, 'Player');
            RG.applyCarStats(this.playerCar, carData);

            this.aiCars = [];
            if (this.mode === 'quickRace') {
                this.aiCars = RG.createAICars(startPos, waypoints, this.storage.getAiDifficulty());
            }

            this.allCars = [this.playerCar, ...this.aiCars];
            this.raceTime = 0;
            this.camera.x = this.playerCar.x;
            this.camera.y = this.playerCar.y;

            this.ui.hideAll();

            if (this.input.isMobile()) {
                this.input.createTouchControls(document.getElementById('game-container'), () => this.pause());
            }

            this.state = 'COUNTDOWN';
            this.audio.playCountdown();
            this.ui.showCountdown(() => {
                this.state = 'RACING';
                this.audio.playGo();
                this.audio.startMusic();
            });
        }

        _loop(timestamp) {
            requestAnimationFrame((ts) => this._loop(ts));
            const dt = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05);
            this.lastTimestamp = timestamp;

            if (this.state === 'RACING') this.update(dt);

            if (this.state === 'RACING' || this.state === 'PAUSED' || this.state === 'COUNTDOWN') {
                this.render();
            }
        }

        update(dt) {
            this.raceTime += dt * 1000;
            this.track.update(dt);

            const input = this.input.getState();
            this.playerCar.update(dt, input);

            for (const ai of this.aiCars) ai.update(dt, this.allCars);

            const totalLaps = this.track.trackData.laps || RG.CONFIG.TOTAL_LAPS;

            for (const car of this.allCars) {
                const result = this.physics.checkCheckpoints(car);
                if (result === 'lap') {
                    if (car === this.playerCar) this.audio.playLapComplete();
                    if (car.lap >= totalLaps) {
                        car.finished = true;
                        car.finishTime = this.raceTime;
                    }
                }
            }

            this.physics.update(this.allCars, dt);

            if (this.physics.hadCollision()) {
                this.audio.playCollision();
                const col = this.physics.getCollisionData();
                this.effects.addScreenShake(col.intensity * 12);
                if (col.point) this.particles.emitCollision(col.point.x, col.point.y, col.intensity);
            }

            // Skid sound
            if (this.playerCar.isDrifting && this.effects.shouldPlaySkidSound()) {
                this.audio.playSkid();
            }

            // Off-track dust
            if (this.playerCar.offTrack && Math.abs(this.playerCar.speed) > 40) {
                this.particles.emitDust(this.playerCar.x, this.playerCar.y, this.track.getTheme());
            }

            // Player particles
            if (Math.abs(this.playerCar.speed) > 40) {
                this.particles.emitExhaust(this.playerCar.x, this.playerCar.y, this.playerCar.angle, Math.abs(this.playerCar.speed));
            }
            if (this.playerCar.nitroActive) {
                this.particles.emitNitroFlame(this.playerCar.x, this.playerCar.y, this.playerCar.angle);
            }

            this.particles.update(dt);
            this.effects.update(dt, this.playerCar.speed);

            this.audio.playEngine(this.playerCar.getSpeedRatio(), this.playerCar.nitroActive);
            this._updatePositions();

            if (this.playerCar.finished) {
                this._endRace();
            } else if (this.mode === 'quickRace' && this.allCars.every(c => c.finished)) {
                this._endRace();
            }
        }

        render() {
            const ctx = this.ctx;
            const W = this.canvas.width;
            const H = this.canvas.height;
            const themeColors = this.track ? this.track.getThemeColors() : RG.COLORS;

            ctx.fillStyle = themeColors.background || RG.COLORS.BACKGROUND;
            ctx.fillRect(0, 0, W, H);

            if (!this.playerCar || !this.track) return;

            const smoothing = RG.CONFIG.CAMERA_SMOOTHING;
            this.camera.x = RG.Utils.lerp(this.camera.x, this.playerCar.x, smoothing);
            this.camera.y = RG.Utils.lerp(this.camera.y, this.playerCar.y, smoothing);

            const shake = this.effects.getShakeOffset();

            ctx.save();
            ctx.translate(W / 2 - this.camera.x + shake.x, H / 2 - this.camera.y + shake.y);

            this.track.render(ctx, this.camera);
            this.effects.renderSkidMarks(ctx);

            const sortedCars = [...this.allCars].sort((a, b) => a.y - b.y);
            for (const car of sortedCars) {
                car.render(ctx, this.effects, null);
            }

            this.particles.render(ctx);
            ctx.restore();

            // Screen-space speed lines
            this.effects.renderSpeedLines(ctx, W, H, this.playerCar.getSpeedRatio());

            const totalLaps = this.track.trackData.laps || RG.CONFIG.TOTAL_LAPS;
            const bounds = this.track.getBounds();
            const tc = this.track.getThemeColors();

            this.hud.render(ctx, W, H, {
                speed: Math.abs(this.playerCar.speed),
                maxSpeed: this.playerCar.maxSpeed,
                nitro: this.playerCar.getNitroRatio(),
                nitroActive: this.playerCar.nitroActive,
                lap: Math.min(this.playerCar.lap + 1, totalLaps),
                totalLaps,
                position: this.playerCar.racePosition,
                totalCars: this.allCars.length,
                raceTime: this.raceTime,
                trackName: this.track.trackData.name,
                cars: this.allCars.map(c => ({ x: c.x, y: c.y, color: c.color })),
                innerBoundary: this.track.getInnerBoundary(),
                outerBoundary: this.track.getOuterBoundary(),
                trackBounds: bounds,
                themeColors: tc
            });
        }

        _updatePositions() {
            const sorted = [...this.allCars].sort((a, b) => {
                if (a.finished && b.finished) return a.finishTime - b.finishTime;
                if (a.finished) return -1;
                if (b.finished) return 1;
                return b.totalCheckpointsPassed - a.totalCheckpointsPassed;
            });
            sorted.forEach((car, i) => { car.racePosition = i + 1; });
        }

        _endRace() {
            if (this.state === 'FINISHED') return;
            this.state = 'FINISHED';

            this.audio.stopEngine();
            this.audio.stopMusic();

            const isWin = this.playerCar.racePosition === 1;
            this.audio.playFinish(isWin);

            if (isWin && this.mode === 'quickRace') {
                this.storage.recordWin();
                this.ui.updateGarage(RG.CARS, this.storage);
            }

            const time = this.playerCar.finishTime || this.raceTime;
            const trackName = this.track.trackData.name;
            this.leaderboard.addRecord(this.mode, trackName, 'Player', time);

            setTimeout(() => {
                this.ui.showGameOver({
                    position: this.playerCar.racePosition,
                    time,
                    totalLaps: this.track.trackData.laps,
                    isTimeTrial: this.mode === 'timeTrial',
                    isWin,
                    trackName
                });
            }, 1500);
        }

        pause() {
            if (this.state !== 'RACING') return;
            this.state = 'PAUSED';
            this.audio.stopEngine();
            this.ui.showScreen('pause');
        }

        resume() {
            if (this.state !== 'PAUSED') return;
            this.state = 'RACING';
            this.ui.hideScreen('pause');
        }

        restart() {
            this.ui.hideAll();
            this.state = 'MENU';
            this.audio.stopEngine();
            this.audio.stopMusic();
            this.startRace(this.mode, this.storage.getSelectedTrackId());
        }

        quit() {
            this.state = 'MENU';
            this.audio.stopEngine();
            this.audio.stopMusic();
            this.input.removeTouchControls();
            this.ui.hideAll();
            this.ui.showScreen('menu');
        }

        _onSettingsChanged(type, value) {
            if (type === 'sound') {
                this.audio.toggleSound();
                this.storage.setSoundEnabled(this.audio.isSoundEnabled());
            } else if (type === 'music') {
                this.audio.toggleMusic();
                this.storage.setMusicEnabled(this.audio.isMusicEnabled());
            } else if (type === 'difficulty') {
                this.storage.setAiDifficulty(value);
            }
        }

        _resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    }

    RG.Game = Game;
})();
