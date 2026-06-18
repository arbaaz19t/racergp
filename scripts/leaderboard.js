/**
 * =============================================================================
 * leaderboard.js — LocalStorage-Based Leaderboard
 * =============================================================================
 *
 * Manages persistent best-time records using the browser's LocalStorage API.
 *
 * Records are keyed by a combination of game mode (e.g. "race", "time-trial")
 * and track name (e.g. "Neon Circuit"), allowing independent leaderboards for
 * every permutation.  Each leaderboard retains at most 10 entries, sorted by
 * fastest time first.
 *
 * Data schema (as stored in LocalStorage under `racingGame_leaderboard`):
 *
 *   {
 *     "race_Neon Circuit": [
 *       { "playerName": "ACE",   "time": 45230, "date": "2026-06-13T..." },
 *       { "playerName": "BLAZE", "time": 46100, "date": "2026-06-13T..." },
 *       ...
 *     ],
 *     "timeTrial_Neon Circuit": [ ... ]
 *   }
 *
 * Usage:
 *   const lb = new RacingGame.LeaderboardManager();
 *   const rank = lb.addRecord('race', 'Neon Circuit', 'PLAYER1', 52340);
 *   if (rank !== -1) console.log(`New high score!  Rank #${rank}`);
 *   const top10 = lb.getRecords('race', 'Neon Circuit');
 *
 * @module RacingGame.LeaderboardManager
 * =============================================================================
 */

/* ---------- Global namespace bootstrap ---------- */
window.RacingGame = window.RacingGame || {};

class LeaderboardManager {

    /* ─────────────────────────────────────────────────────────────────────
     * Constructor
     * ───────────────────────────────────────────────────────────────────── */

    constructor() {
        /**
         * Key used to store all leaderboard data in LocalStorage.
         * A single key holds a JSON object mapping composite keys
         * (mode + track) to arrays of record objects.
         * @type {string}
         */
        this.storageKey = 'racingGame_leaderboard';
    }

    /* ─────────────────────────────────────────────────────────────────────
     * Public API
     * ───────────────────────────────────────────────────────────────────── */

    /**
     * Add a race record and determine whether it made the top 10.
     *
     * Steps:
     *   1. Load existing records for the given mode + track.
     *   2. Append the new record.
     *   3. Sort ascending by time (fastest first).
     *   4. Trim to 10 entries.
     *   5. Persist to LocalStorage.
     *   6. Find the new record's rank.
     *
     * @param {string} mode       - Game mode identifier (e.g. "race").
     * @param {string} trackName  - Track name (e.g. "Neon Circuit").
     * @param {string} playerName - Display name of the player.
     * @param {number} timeMs     - Completion time in milliseconds.
     * @returns {number} 1-indexed rank if in top 10, or -1 if it didn't
     *                   make the leaderboard.
     */
    addRecord(mode, trackName, playerName, timeMs) {
        const records = this.getRecords(mode, trackName);

        /* Create the new entry */
        const entry = {
            playerName: playerName,
            time: timeMs,
            date: new Date().toISOString()
        };

        records.push(entry);

        /* Sort fastest first (ascending by time) */
        records.sort((a, b) => a.time - b.time);

        /* Keep only the top 10 */
        const trimmed = records.slice(0, 10);

        /* Persist */
        this._save(mode, trackName, trimmed);

        /*
         * Determine rank — find the entry we just added.
         *
         * Because multiple entries may share the same time and name, we
         * search by object reference equality first (the exact `entry`
         * object we pushed).  If the reference survived the trim we know
         * the index; otherwise fall back to matching by time + name +
         * date.
         */
        let rank = trimmed.indexOf(entry);

        if (rank === -1) {
            /* Reference was sliced off → record didn't make top 10 */
            rank = trimmed.findIndex(
                r => r.time === timeMs &&
                     r.playerName === playerName &&
                     r.date === entry.date
            );
        }

        return rank !== -1 ? rank + 1 : -1;
    }

    /**
     * Retrieve the top-10 records for a given mode + track.
     *
     * Returns a new array (safe to mutate) sorted fastest-first.
     * If no records exist, returns an empty array.
     *
     * @param {string} mode      - Game mode identifier.
     * @param {string} trackName - Track name.
     * @returns {Array<{playerName:string, time:number, date:string}>}
     */
    getRecords(mode, trackName) {
        const all = this._loadAll();
        const key = `${mode}_${trackName}`;
        /* Return a copy so callers can't corrupt the stored data */
        return all[key] ? [...all[key]] : [];
    }

    /**
     * Delete all records for a specific mode + track.
     *
     * @param {string} mode      - Game mode identifier.
     * @param {string} trackName - Track name.
     */
    clearRecords(mode, trackName) {
        const all = this._loadAll();
        const key = `${mode}_${trackName}`;
        delete all[key];
        localStorage.setItem(this.storageKey, JSON.stringify(all));
    }

    /**
     * Wipe the entire leaderboard — all modes, all tracks.
     *
     * ⚠ This is destructive and cannot be undone.
     */
    clearAll() {
        localStorage.removeItem(this.storageKey);
    }

    /* ─────────────────────────────────────────────────────────────────────
     * Private Helpers
     * ───────────────────────────────────────────────────────────────────── */

    /**
     * Load the full leaderboard data object from LocalStorage.
     *
     * Gracefully handles missing or corrupt data by returning an empty
     * object rather than throwing.
     *
     * @private
     * @returns {Object} Parsed leaderboard data, or `{}` on error.
     */
    _loadAll() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            /*
             * If the stored JSON is corrupt, log a warning and start fresh.
             * We deliberately do NOT wipe storage here — the user may want
             * to inspect / recover it manually.
             */
            console.warn('[LeaderboardManager] Failed to parse stored data:', e);
            return {};
        }
    }

    /**
     * Persist a records array for a specific mode + track.
     *
     * Merges into the existing data object so other mode/track combos
     * are not affected.
     *
     * @private
     * @param {string} mode      - Game mode identifier.
     * @param {string} trackName - Track name.
     * @param {Array}  records   - Array of record objects to save.
     */
    _save(mode, trackName, records) {
        const all = this._loadAll();
        const key = `${mode}_${trackName}`;
        all[key] = records;

        try {
            localStorage.setItem(this.storageKey, JSON.stringify(all));
        } catch (e) {
            /*
             * LocalStorage can throw if the quota is exceeded or if the
             * browser is in private mode on some platforms.
             */
            console.warn('[LeaderboardManager] Failed to save data:', e);
        }
    }
}

/* ---------- Export to global namespace ---------- */
window.RacingGame.LeaderboardManager = LeaderboardManager;
