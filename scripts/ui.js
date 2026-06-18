/**
 * ui.js — UI Manager
 * 
 * Controls all DOM-based menu screens overlaid on the game canvas.
 * Handles main menu, pause menu, leaderboard, settings, game over,
 * and countdown overlay screens with neon/synthwave visual styling.
 * 
 * Depends on: RG.COLORS, RG.Utils, RG.LeaderboardManager (for data formatting)
 */
window.RacingGame = window.RacingGame || {};

(function () {
    'use strict';

    const RG = window.RacingGame;

    // ─── Ordinal suffix helper ────────────────────────────────────────
    function ordinal(n) {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    // ─── UIManager Class ─────────────────────────────────────────────
    class UIManager {
        /**
         * @param {HTMLElement} container  – the #ui-container DOM element
         * @param {Object}      callbacks  – event handlers from Game
         *   onQuickRace, onTimeTrial, onResume, onRestart, onQuit, onSettingsChanged
         */
        constructor(container, callbacks) {
            this.container = container;
            this.callbacks = callbacks;
            this.screens = {};

            // Track which screen we came from when entering Settings
            this._settingsBackTarget = 'menu';
            this._pendingMode = 'quickRace';

            // Leaderboard state
            this._currentLeaderboardMode = 'quickRace';

            this._buildScreens();
        }

        // ──────────────────────────────────────────────────────────────
        //  SCREEN BUILDERS
        // ──────────────────────────────────────────────────────────────

        _buildScreens() {
            this._buildMainMenu();
            this._buildTrackSelectScreen();
            this._buildGarageScreen();
            this._buildPauseMenu();
            this._buildLeaderboardScreen();
            this._buildSettingsScreen();
            this._buildGameOverScreen();
            this._buildCountdownOverlay();
        }

        /* ─── Helper: create a screen wrapper ─────────────────────── */
        _createScreen(id, extraClasses) {
            const div = document.createElement('div');
            div.id = 'screen-' + id;
            div.className = 'screen hidden' + (extraClasses ? ' ' + extraClasses : '');
            this.container.appendChild(div);
            this.screens[id] = div;
            return div;
        }

        /* ─── Helper: create a styled button ─────────────────────── */
        _btn(label, className, onClick) {
            const b = document.createElement('button');
            b.textContent = label;
            b.className = 'btn ' + (className || '');
            b.addEventListener('click', onClick);
            return b;
        }

        // ──────────────────────────────────────────────────────────────
        //  MAIN MENU
        // ──────────────────────────────────────────────────────────────

        _buildMainMenu() {
            const screen = this._createScreen('menu');

            // Title
            const title = document.createElement('h1');
            title.className = 'game-title';
            title.textContent = 'NEON RACER';
            screen.appendChild(title);

            // Subtitle
            const sub = document.createElement('p');
            sub.className = 'game-subtitle';
            sub.textContent = '2D RACING';
            screen.appendChild(sub);

            // Buttons
            const btns = document.createElement('div');
            btns.className = 'menu-buttons';

            btns.appendChild(this._btn('QUICK RACE', 'btn-primary', () => {
                this.callbacks.onQuickRace && this.callbacks.onQuickRace();
            }));

            btns.appendChild(this._btn('TIME TRIAL', 'btn-primary', () => {
                this.callbacks.onTimeTrial && this.callbacks.onTimeTrial();
            }));

            btns.appendChild(this._btn('GARAGE', 'btn-secondary', () => {
                this.callbacks.onGarage && this.callbacks.onGarage();
            }));

            btns.appendChild(this._btn('LEADERBOARD', 'btn-secondary', () => {
                this._settingsBackTarget = 'menu';
                this._refreshLeaderboard();
                this.showScreen('leaderboard');
            }));

            btns.appendChild(this._btn('SETTINGS', 'btn-secondary', () => {
                this._settingsBackTarget = 'menu';
                this.showScreen('settings');
            }));

            screen.appendChild(btns);

            // Version footer
            const ver = document.createElement('span');
            ver.className = 'version-text';
            ver.textContent = 'v2.0 Arcade Edition';
            screen.appendChild(ver);
        }

        // ──────────────────────────────────────────────────────────────
        //  TRACK SELECT
        // ──────────────────────────────────────────────────────────────

        _buildTrackSelectScreen() {
            const screen = this._createScreen('trackSelect');

            const title = document.createElement('h2');
            title.className = 'screen-title neon-glow';
            title.textContent = 'SELECT TRACK';
            screen.appendChild(title);

            const grid = document.createElement('div');
            grid.className = 'track-grid';
            grid.id = 'track-grid';
            screen.appendChild(grid);

            const btns = document.createElement('div');
            btns.className = 'menu-buttons menu-buttons-row';

            btns.appendChild(this._btn('START RACE', 'btn-primary', () => {
                const selected = document.querySelector('.track-card.selected');
                const trackId = selected ? selected.dataset.trackId : RG.TRACKS[0].id;
                this.hideAll();
                this.callbacks.onStartRace && this.callbacks.onStartRace(this._pendingMode, trackId);
            }));

            btns.appendChild(this._btn('BACK', 'btn-secondary', () => {
                this.showScreen('menu');
            }));

            screen.appendChild(btns);
            this._trackGrid = grid;
        }

        updateTrackSelect(tracks, selectedId) {
            if (!this._trackGrid) return;
            this._trackGrid.innerHTML = '';

            const themeIcons = { forest: '🌲', desert: '🏜️', city: '🏙️', night: '🌃' };

            for (const track of tracks) {
                const card = document.createElement('div');
                card.className = 'track-card' + (track.id === selectedId ? ' selected' : '');
                card.dataset.trackId = track.id;

                card.innerHTML = `
                    <div class="track-card-icon">${themeIcons[track.theme] || '🏁'}</div>
                    <div class="track-card-name">${track.name}</div>
                    <div class="track-card-laps">${track.laps} LAPS</div>
                `;

                card.addEventListener('click', () => {
                    document.querySelectorAll('.track-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    this.callbacks.onSelectTrack && this.callbacks.onSelectTrack(track.id);
                });

                this._trackGrid.appendChild(card);
            }
        }

        setPendingMode(mode) {
            this._pendingMode = mode;
        }

        // ──────────────────────────────────────────────────────────────
        //  GARAGE
        // ──────────────────────────────────────────────────────────────

        _buildGarageScreen() {
            const screen = this._createScreen('garage');

            const title = document.createElement('h2');
            title.className = 'screen-title neon-glow';
            title.textContent = 'GARAGE';
            screen.appendChild(title);

            const wins = document.createElement('p');
            wins.className = 'garage-wins';
            wins.id = 'garage-wins';
            screen.appendChild(wins);

            const grid = document.createElement('div');
            grid.className = 'car-grid';
            grid.id = 'car-grid';
            screen.appendChild(grid);

            const detail = document.createElement('div');
            detail.className = 'car-detail';
            detail.id = 'car-detail';
            screen.appendChild(detail);

            screen.appendChild(this._btn('BACK', 'btn-secondary', () => {
                this.showScreen('menu');
            }));
            this._carGrid = grid;
            this._carDetail = detail;
        }

        updateGarage(cars, storage) {
            if (!this._carGrid) return;
            this._carGrid.innerHTML = '';

            const winsEl = document.getElementById('garage-wins');
            if (winsEl) winsEl.textContent = `WINS: ${storage.getTotalWins()}`;

            const selectedId = storage.getSelectedCarId();

            for (const car of cars) {
                const unlocked = storage.isCarUnlocked(car.id);
                const card = document.createElement('div');
                card.className = 'car-card' +
                    (car.id === selectedId ? ' selected' : '') +
                    (!unlocked ? ' locked' : '');

                card.innerHTML = `
                    <div class="car-swatch" style="background:${car.color}"></div>
                    <div class="car-card-name">${car.name}</div>
                    ${!unlocked ? `<div class="car-lock">🔒 ${car.unlockWins} wins</div>` : ''}
                `;

                card.addEventListener('click', () => {
                    if (!unlocked) return;
                    document.querySelectorAll('.car-card').forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    this.callbacks.onSelectCar && this.callbacks.onSelectCar(car.id);
                    this._showCarDetail(car);
                });

                this._carGrid.appendChild(card);
            }

            const selected = cars.find(c => c.id === selectedId) || cars[0];
            this._showCarDetail(selected);
        }

        _showCarDetail(car) {
            if (!this._carDetail || !car) return;
            this._carDetail.innerHTML = `
                <h3 style="color:${car.color}">${car.name}</h3>
                <p class="car-desc">${car.description}</p>
                <div class="car-stats">
                    <span>SPD ${Math.round(car.maxSpeed / 3.5)}</span>
                    <span>ACC ${Math.round(car.acceleration / 2.5)}</span>
                    <span>HND ${Math.round(car.turnSpeed * 10)}</span>
                    <span>NTR ${Math.round(car.nitroBoost * 100 - 100)}%</span>
                </div>
            `;
        }

        // ──────────────────────────────────────────────────────────────
        //  PAUSE MENU
        // ──────────────────────────────────────────────────────────────

        _buildPauseMenu() {
            const screen = this._createScreen('pause', 'overlay-blur');

            const title = document.createElement('h2');
            title.className = 'pause-title';
            title.textContent = 'PAUSED';
            screen.appendChild(title);

            const btns = document.createElement('div');
            btns.className = 'menu-buttons';

            btns.appendChild(this._btn('RESUME', 'btn-primary', () => {
                this.callbacks.onResume && this.callbacks.onResume();
            }));

            btns.appendChild(this._btn('RESTART', 'btn-primary', () => {
                this.callbacks.onRestart && this.callbacks.onRestart();
            }));

            btns.appendChild(this._btn('SETTINGS', 'btn-secondary', () => {
                this._settingsBackTarget = 'pause';
                this.showScreen('settings');
            }));

            btns.appendChild(this._btn('QUIT TO MENU', 'btn-danger', () => {
                this.callbacks.onQuit && this.callbacks.onQuit();
            }));

            screen.appendChild(btns);
        }

        // ──────────────────────────────────────────────────────────────
        //  LEADERBOARD
        // ──────────────────────────────────────────────────────────────

        _buildLeaderboardScreen() {
            const screen = this._createScreen('leaderboard');

            const title = document.createElement('h2');
            title.className = 'screen-title neon-glow';
            title.textContent = 'LEADERBOARD';
            screen.appendChild(title);

            // Tabs
            const tabs = document.createElement('div');
            tabs.className = 'leaderboard-tabs';

            const tabQR = document.createElement('button');
            tabQR.className = 'leaderboard-tab active';
            tabQR.textContent = 'QUICK RACE';
            tabQR.id = 'lb-tab-quickRace';
            tabQR.addEventListener('click', () => {
                this._currentLeaderboardMode = 'quickRace';
                this._refreshLeaderboard();
            });
            tabs.appendChild(tabQR);

            const tabTT = document.createElement('button');
            tabTT.className = 'leaderboard-tab';
            tabTT.textContent = 'TIME TRIAL';
            tabTT.id = 'lb-tab-timeTrial';
            tabTT.addEventListener('click', () => {
                this._currentLeaderboardMode = 'timeTrial';
                this._refreshLeaderboard();
            });
            tabs.appendChild(tabTT);

            screen.appendChild(tabs);

            // Leaderboard container (glassmorphic panel)
            const lbContainer = document.createElement('div');
            lbContainer.className = 'leaderboard-container';
            lbContainer.id = 'leaderboard-list';
            screen.appendChild(lbContainer);

            // Bottom buttons
            const bottomBtns = document.createElement('div');
            bottomBtns.className = 'menu-buttons menu-buttons-row';

            bottomBtns.appendChild(this._btn('CLEAR RECORDS', 'btn-danger btn-small', () => {
                this._confirmClear();
            }));

            bottomBtns.appendChild(this._btn('BACK', 'btn-secondary btn-small', () => {
                this.showScreen('menu');
            }));

            screen.appendChild(bottomBtns);
        }

        /** Refresh leaderboard content from LeaderboardManager */
        _refreshLeaderboard() {
            const lbManager = RG.LeaderboardManager ? new RG.LeaderboardManager() : null;
            const trackId = (window.game && window.game.storage)
                ? window.game.storage.getSelectedTrackId()
                : (RG.TRACKS[0] && RG.TRACKS[0].id);
            const track = RG.TRACKS.find(t => t.id === trackId) || RG.TRACKS[0];
            const trackName = track ? track.name : 'Default';
            const records = lbManager
                ? lbManager.getRecords(this._currentLeaderboardMode, trackName)
                : [];
            this.updateLeaderboard(records, this._currentLeaderboardMode);
        }

        /** Confirm then clear records */
        _confirmClear() {
            // Create a simple confirmation overlay
            const existing = document.getElementById('confirm-overlay');
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = 'confirm-overlay';
            overlay.className = 'screen overlay-blur';
            overlay.style.zIndex = '100';

            const box = document.createElement('div');
            box.className = 'settings-panel';
            box.style.textAlign = 'center';

            const msg = document.createElement('p');
            msg.textContent = 'Clear all records for this mode?';
            msg.style.color = '#ffffff';
            msg.style.marginBottom = '20px';
            msg.style.fontSize = '1rem';
            msg.style.letterSpacing = '0.05em';
            box.appendChild(msg);

            const rowDiv = document.createElement('div');
            rowDiv.className = 'menu-buttons menu-buttons-row';

            rowDiv.appendChild(this._btn('YES, CLEAR', 'btn-danger btn-small', () => {
                const lbManager = new RG.LeaderboardManager();
                const trackName = (RG.TRACKS && RG.TRACKS[0]) ? RG.TRACKS[0].name : 'Default';
                lbManager.clearRecords(this._currentLeaderboardMode, trackName);
                this._refreshLeaderboard();
                overlay.remove();
            }));

            rowDiv.appendChild(this._btn('CANCEL', 'btn-secondary btn-small', () => {
                overlay.remove();
            }));

            box.appendChild(rowDiv);
            overlay.appendChild(box);
            this.container.appendChild(overlay);
        }

        // ──────────────────────────────────────────────────────────────
        //  SETTINGS
        // ──────────────────────────────────────────────────────────────

        _buildSettingsScreen() {
            const screen = this._createScreen('settings');

            const title = document.createElement('h2');
            title.className = 'screen-title neon-glow';
            title.textContent = 'SETTINGS';
            screen.appendChild(title);

            const panel = document.createElement('div');
            panel.className = 'settings-panel';

            // Sound toggle
            panel.appendChild(this._buildToggleRow('Sound Effects', 'setting-sound', true, (on) => {
                this.callbacks.onSettingsChanged && this.callbacks.onSettingsChanged('sound', on);
            }));

            // Music toggle
            panel.appendChild(this._buildToggleRow('Background Music', 'setting-music', true, (on) => {
                this.callbacks.onSettingsChanged && this.callbacks.onSettingsChanged('music', on);
            }));

            // AI Difficulty
            const diffRow = document.createElement('div');
            diffRow.className = 'setting-row';
            const diffLbl = document.createElement('span');
            diffLbl.className = 'setting-label';
            diffLbl.textContent = 'AI Difficulty';
            diffRow.appendChild(diffLbl);

            const diffSelect = document.createElement('select');
            diffSelect.id = 'setting-difficulty';
            diffSelect.className = 'setting-select';
            ['easy', 'medium', 'hard'].forEach(d => {
                const opt = document.createElement('option');
                opt.value = d;
                opt.textContent = d.toUpperCase();
                diffSelect.appendChild(opt);
            });
            diffSelect.addEventListener('change', () => {
                this.callbacks.onSettingsChanged && this.callbacks.onSettingsChanged('difficulty', diffSelect.value);
            });
            diffRow.appendChild(diffSelect);
            panel.appendChild(diffRow);

            // Controls hint
            const hint = document.createElement('p');
            hint.className = 'controls-hint';
            hint.innerHTML = 'W/S Accelerate/Brake · A/D Steer · Shift Nitro · Space Handbrake · Esc Pause';
            panel.appendChild(hint);

            screen.appendChild(panel);

            // Back button
            const backBtn = this._btn('BACK', 'btn-secondary', () => {
                this.showScreen(this._settingsBackTarget);
            });
            backBtn.style.marginTop = '20px';
            screen.appendChild(backBtn);
        }

        /** Build a single setting toggle row */
        _buildToggleRow(label, id, defaultOn, onChange) {
            const row = document.createElement('div');
            row.className = 'setting-row';

            const lbl = document.createElement('span');
            lbl.className = 'setting-label';
            lbl.textContent = label;
            row.appendChild(lbl);

            const toggle = document.createElement('label');
            toggle.className = 'toggle-switch';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = id;
            input.checked = defaultOn;
            input.addEventListener('change', () => {
                onChange(input.checked);
            });

            const slider = document.createElement('span');
            slider.className = 'toggle-slider';

            toggle.appendChild(input);
            toggle.appendChild(slider);
            row.appendChild(toggle);

            return row;
        }

        // ──────────────────────────────────────────────────────────────
        //  GAME OVER
        // ──────────────────────────────────────────────────────────────

        _buildGameOverScreen() {
            const screen = this._createScreen('gameOver', 'overlay-blur');

            // Title
            const title = document.createElement('h2');
            title.className = 'game-over-title';
            title.id = 'game-over-title';
            title.textContent = 'RACE COMPLETE';
            screen.appendChild(title);

            // Results container
            const results = document.createElement('div');
            results.className = 'results-container';
            results.id = 'game-over-results';
            screen.appendChild(results);

            // Buttons
            const btns = document.createElement('div');
            btns.className = 'menu-buttons menu-buttons-row';

            btns.appendChild(this._btn('RACE AGAIN', 'btn-primary', () => {
                this.callbacks.onRestart && this.callbacks.onRestart();
            }));

            btns.appendChild(this._btn('MAIN MENU', 'btn-secondary', () => {
                this.callbacks.onQuit && this.callbacks.onQuit();
            }));

            screen.appendChild(btns);
        }

        // ──────────────────────────────────────────────────────────────
        //  COUNTDOWN OVERLAY
        // ──────────────────────────────────────────────────────────────

        _buildCountdownOverlay() {
            const screen = this._createScreen('countdown');
            screen.style.pointerEvents = 'none'; // don't block input

            const txt = document.createElement('div');
            txt.className = 'countdown-text';
            txt.id = 'countdown-text';
            screen.appendChild(txt);
        }

        // ──────────────────────────────────────────────────────────────
        //  SCREEN VISIBILITY
        // ──────────────────────────────────────────────────────────────

        /**
         * Hide every screen, then show the named one with a fade-in.
         * @param {string} name  – 'menu' | 'pause' | 'leaderboard' | 'settings' | 'gameOver' | 'countdown'
         */
        showScreen(name) {
            // Hide all screens first
            Object.values(this.screens).forEach((el) => {
                el.classList.add('hidden');
            });

            const screen = this.screens[name];
            if (!screen) return;

            // Remove hidden, trigger reflow, then add fade-in class
            screen.classList.remove('hidden');
            // Force reflow so the animation re-triggers
            void screen.offsetWidth;
            screen.classList.add('fade-in');

            // Remove the animation class after it completes so it can replay
            const onEnd = () => {
                screen.classList.remove('fade-in');
                screen.removeEventListener('animationend', onEnd);
            };
            screen.addEventListener('animationend', onEnd);
        }

        hideScreen(name) {
            const screen = this.screens[name];
            if (screen) {
                screen.classList.add('hidden');
            }
        }

        hideAll() {
            Object.values(this.screens).forEach((el) => {
                el.classList.add('hidden');
            });
            // Also remove any lingering confirm overlays
            const confirm = document.getElementById('confirm-overlay');
            if (confirm) confirm.remove();
            // Remove any confetti
            this._removeConfetti();
        }

        // ──────────────────────────────────────────────────────────────
        //  COUNTDOWN
        // ──────────────────────────────────────────────────────────────

        /**
         * Animate 3 → 2 → 1 → GO! then call callback.
         * @param {Function} callback  – invoked when GO! appears
         */
        showCountdown(callback) {
            const screen = this.screens['countdown'];
            const txt = document.getElementById('countdown-text');
            screen.classList.remove('hidden');

            const steps = ['3', '2', '1', 'GO!'];
            let idx = 0;

            const showNext = () => {
                if (idx >= steps.length) {
                    // Hide countdown after GO! fades
                    setTimeout(() => {
                        screen.classList.add('hidden');
                        txt.textContent = '';
                    }, 500);
                    return;
                }

                txt.textContent = steps[idx];
                txt.classList.remove('pop');
                void txt.offsetWidth; // reflow
                txt.classList.add('pop');

                if (steps[idx] === 'GO!') {
                    // Fire the callback when GO! appears
                    if (callback) callback();
                    idx++;
                    setTimeout(showNext, 1000);
                } else {
                    idx++;
                    setTimeout(showNext, 1000);
                }
            };

            showNext();
        }

        // ──────────────────────────────────────────────────────────────
        //  GAME OVER (dynamic update)
        // ──────────────────────────────────────────────────────────────

        /**
         * Show game-over screen with race results.
         * @param {Object} results
         *   position, time, totalLaps, isTimeTrial, isWin
         */
        showGameOver(results) {
            const titleEl = document.getElementById('game-over-title');
            const resultsEl = document.getElementById('game-over-results');

            // Set title and style
            if (results.isWin) {
                titleEl.textContent = 'VICTORY!';
                titleEl.className = 'game-over-title victory';
            } else {
                titleEl.textContent = 'RACE COMPLETE';
                titleEl.className = 'game-over-title defeat';
            }

            // Build results content
            resultsEl.innerHTML = '';

            if (!results.isTimeTrial) {
                // Position result
                const posItem = this._resultItem('POSITION', ordinal(results.position));
                resultsEl.appendChild(posItem);
            }

            // Time result
            const formattedTime = RG.Utils
                ? RG.Utils.formatTime(results.time)
                : this._fallbackFormatTime(results.time);
            const timeItem = this._resultItem('TIME', formattedTime);
            resultsEl.appendChild(timeItem);

            // Laps
            const lapItem = this._resultItem('LAPS', String(results.totalLaps));
            resultsEl.appendChild(lapItem);

            // Mode
            const modeItem = this._resultItem('MODE', results.isTimeTrial ? 'TIME TRIAL' : 'QUICK RACE');
            resultsEl.appendChild(modeItem);

            if (results.trackName) {
                resultsEl.appendChild(this._resultItem('TRACK', results.trackName));
            }

            this.showScreen('gameOver');

            // Confetti for victory
            if (results.isWin) {
                this._createConfetti();
            }
        }

        /** Create a result stat item */
        _resultItem(label, value) {
            const item = document.createElement('div');
            item.className = 'result-item';

            const lbl = document.createElement('span');
            lbl.className = 'result-label';
            lbl.textContent = label;

            const val = document.createElement('span');
            val.className = 'result-value';
            val.textContent = value;

            item.appendChild(lbl);
            item.appendChild(val);
            return item;
        }

        /** Fallback time formatter if Utils isn't available */
        _fallbackFormatTime(ms) {
            const totalSec = Math.floor(ms / 1000);
            const mins = Math.floor(totalSec / 60);
            const secs = totalSec % 60;
            const millis = Math.floor(ms % 1000);
            return mins + ':' + String(secs).padStart(2, '0') + '.' + String(millis).padStart(3, '0');
        }

        // ──────────────────────────────────────────────────────────────
        //  LEADERBOARD (dynamic update)
        // ──────────────────────────────────────────────────────────────

        /**
         * Update the leaderboard list and highlight the active tab.
         * @param {Array}  records     – [{playerName, time, date}]
         * @param {string} currentMode – 'quickRace' | 'timeTrial'
         */
        updateLeaderboard(records, currentMode) {
            // Update tabs
            const tabQR = document.getElementById('lb-tab-quickRace');
            const tabTT = document.getElementById('lb-tab-timeTrial');
            if (tabQR) tabQR.classList.toggle('active', currentMode === 'quickRace');
            if (tabTT) tabTT.classList.toggle('active', currentMode === 'timeTrial');

            const listEl = document.getElementById('leaderboard-list');
            if (!listEl) return;
            listEl.innerHTML = '';

            if (!records || records.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'leaderboard-empty';
                empty.textContent = 'No records yet. Race to set a time!';
                listEl.appendChild(empty);
                return;
            }

            // Build table
            const table = document.createElement('table');
            table.className = 'leaderboard-table';

            // Header
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            ['RANK', 'NAME', 'TIME', 'DATE'].forEach((col) => {
                const th = document.createElement('th');
                th.textContent = col;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Body
            const tbody = document.createElement('tbody');
            records.forEach((rec, i) => {
                const tr = document.createElement('tr');
                const rank = i + 1;

                // Rank class for gold/silver/bronze
                if (rank <= 3) {
                    tr.classList.add('leaderboard-rank-' + rank);
                }

                const tdRank = document.createElement('td');
                tdRank.textContent = ordinal(rank);
                tr.appendChild(tdRank);

                const tdName = document.createElement('td');
                tdName.textContent = rec.playerName || 'Player';
                tr.appendChild(tdName);

                const tdTime = document.createElement('td');
                tdTime.textContent = RG.Utils
                    ? RG.Utils.formatTime(rec.time)
                    : this._fallbackFormatTime(rec.time);
                tr.appendChild(tdTime);

                const tdDate = document.createElement('td');
                tdDate.textContent = rec.date
                    ? new Date(rec.date).toLocaleDateString()
                    : '-';
                tr.appendChild(tdDate);

                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            listEl.appendChild(table);
        }

        // ──────────────────────────────────────────────────────────────
        //  SETTINGS (dynamic update)
        // ──────────────────────────────────────────────────────────────

        /**
         * Update toggle switch states to reflect current audio settings.
         * @param {boolean} soundOn
         * @param {boolean} musicOn
         */
        updateSettings(soundOn, musicOn, difficulty) {
            const soundToggle = document.getElementById('setting-sound');
            const musicToggle = document.getElementById('setting-music');
            const diffSelect = document.getElementById('setting-difficulty');
            if (soundToggle) soundToggle.checked = soundOn;
            if (musicToggle) musicToggle.checked = musicOn;
            if (diffSelect && difficulty) diffSelect.value = difficulty;
        }

        // ──────────────────────────────────────────────────────────────
        //  CONFETTI ANIMATION
        // ──────────────────────────────────────────────────────────────

        /** Create 60 confetti particles that fall and rotate */
        _createConfetti() {
            this._removeConfetti(); // clean up any existing

            const confettiContainer = document.createElement('div');
            confettiContainer.id = 'confetti-container';
            confettiContainer.style.position = 'fixed';
            confettiContainer.style.top = '0';
            confettiContainer.style.left = '0';
            confettiContainer.style.width = '100%';
            confettiContainer.style.height = '100%';
            confettiContainer.style.pointerEvents = 'none';
            confettiContainer.style.zIndex = '200';
            confettiContainer.style.overflow = 'hidden';

            const colors = [
                '#00e5ff', '#ff00e5', '#ffe500', '#ff6b00',
                '#00ff64', '#ffd700', '#ff0040', '#ffffff'
            ];

            for (let i = 0; i < 60; i++) {
                const piece = document.createElement('div');
                piece.className = 'confetti-piece';

                // Random styling
                const color = colors[Math.floor(Math.random() * colors.length)];
                const left = Math.random() * 100;
                const delay = Math.random() * 2;
                const duration = 2 + Math.random() * 2;
                const size = 6 + Math.random() * 8;
                const rotation = Math.random() * 360;

                piece.style.backgroundColor = color;
                piece.style.left = left + '%';
                piece.style.width = size + 'px';
                piece.style.height = size * (0.4 + Math.random() * 0.6) + 'px';
                piece.style.animationDelay = delay + 's';
                piece.style.animationDuration = duration + 's';
                piece.style.transform = 'rotate(' + rotation + 'deg)';

                confettiContainer.appendChild(piece);
            }

            document.body.appendChild(confettiContainer);

            // Auto-remove after 4 seconds
            setTimeout(() => this._removeConfetti(), 4000);
        }

        /** Remove confetti container */
        _removeConfetti() {
            const existing = document.getElementById('confetti-container');
            if (existing) existing.remove();
        }
    }

    // Export to global namespace
    window.RacingGame.UIManager = UIManager;
})();
