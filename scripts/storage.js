/**
 * storage.js — LocalStorage persistence for settings, unlocks, and selections.
 */
window.RacingGame = window.RacingGame || {};

(function () {
    'use strict';

    const STORAGE_KEY = 'racingGame_save';

    const DEFAULTS = {
        soundEnabled: true,
        musicEnabled: true,
        selectedCarId: 'bolt',
        selectedTrackId: 'forest',
        aiDifficulty: 'medium',
        totalWins: 0,
        unlockedCars: ['bolt']
    };

    class StorageManager {
        constructor() {
            this.data = this._load();
        }

        _load() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (!raw) return { ...DEFAULTS };
                return { ...DEFAULTS, ...JSON.parse(raw) };
            } catch (e) {
                console.warn('[StorageManager] Load failed:', e);
                return { ...DEFAULTS };
            }
        }

        _save() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
            } catch (e) {
                console.warn('[StorageManager] Save failed:', e);
            }
        }

        get(key) { return this.data[key]; }

        set(key, value) {
            this.data[key] = value;
            this._save();
        }

        isSoundEnabled() { return this.data.soundEnabled; }
        isMusicEnabled() { return this.data.musicEnabled; }
        setSoundEnabled(v) { this.set('soundEnabled', v); }
        setMusicEnabled(v) { this.set('musicEnabled', v); }

        getSelectedCarId() { return this.data.selectedCarId; }
        getSelectedTrackId() { return this.data.selectedTrackId; }
        getAiDifficulty() { return this.data.aiDifficulty; }

        setSelectedCarId(id) { this.set('selectedCarId', id); }
        setSelectedTrackId(id) { this.set('selectedTrackId', id); }
        setAiDifficulty(d) { this.set('aiDifficulty', d); }

        isCarUnlocked(carId) {
            return this.data.unlockedCars.includes(carId);
        }

        unlockCar(carId) {
            if (!this.data.unlockedCars.includes(carId)) {
                this.data.unlockedCars.push(carId);
                this._save();
            }
        }

        /** Check all cars and unlock any whose win requirement is met. */
        syncUnlocks(cars) {
            const wins = this.data.totalWins;
            let changed = false;
            for (const car of cars) {
                if (!car.unlocked && wins >= car.unlockWins) {
                    if (!this.data.unlockedCars.includes(car.id)) {
                        this.data.unlockedCars.push(car.id);
                        changed = true;
                    }
                }
            }
            if (changed) this._save();
        }

        recordWin() {
            this.data.totalWins++;
            this._save();
            if (window.RacingGame.CARS) {
                this.syncUnlocks(window.RacingGame.CARS);
            }
        }

        getTotalWins() { return this.data.totalWins; }
    }

    window.RacingGame.StorageManager = StorageManager;
})();
