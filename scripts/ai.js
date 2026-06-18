/**
 * ai.js — AI opponents with difficulty presets and car-aware behavior.
 */
window.RacingGame = window.RacingGame || {};

(function () {
    'use strict';

    const RG = window.RacingGame;
    const CONFIG = RG.CONFIG;
    const Utils = RG.Utils;

    const WAYPOINT_REACH_DIST = 40;
    const AVOIDANCE_RADIUS = 60;
    const SHARP_TURN_THRESHOLD = 0.5;
    const WOBBLE_INTERVAL = 0.5;
    const WOBBLE_AMPLITUDE = 0.12;
    const RUBBER_BAND_BOOST = 0.10;
    const RUBBER_BAND_SLOW = 0.05;
    const LOOK_AHEAD_BASE = 5;

    const AI_COLORS = ['#ff00e5', '#ffe500', '#ff6b00'];
    const AI_NAMES = ['Blaze', 'Phantom', 'Volt'];
    const AI_STYLES = ['muscle', 'agile', 'sport'];

    class AICar extends RG.Car {
        constructor(x, y, angle, color, name, waypoints, difficulty) {
            super(x, y, angle, color, name);
            this.waypoints = waypoints;
            this.difficulty = Utils.clamp(difficulty, 0.1, 1.1);
            this.currentWaypointIndex = 0;
            this.lookAhead = LOOK_AHEAD_BASE;
            this.maxSpeed = CONFIG.MAX_SPEED * this.difficulty;
            this._baseMaxSpeed = this.maxSpeed;
            this.wobble = 0;
            this.wobbleTimer = 0;
            this._findNearestWaypoint();
        }

        update(dt, allCars) {
            const numWP = this.waypoints.length;
            if (numWP === 0) return;

            const targetIdx = (this.currentWaypointIndex + this.lookAhead) % numWP;
            const target = this.waypoints[targetIdx];
            const targetAngle = Utils.angleBetween(this.x, this.y, target.x, target.y);
            let angleDiff = Utils.normalizeAngle(targetAngle - this.angle);

            this.wobbleTimer += dt;
            if (this.wobbleTimer >= WOBBLE_INTERVAL) {
                this.wobbleTimer = 0;
                this.wobble = Utils.randomRange(-WOBBLE_AMPLITUDE, WOBBLE_AMPLITUDE) * (1 - this.difficulty * 0.4);
            }
            angleDiff += this.wobble;

            const input = { up: true, down: false, left: false, right: false, nitro: false, handbrake: false };

            if (angleDiff < -0.03) input.left = true;
            else if (angleDiff > 0.03) input.right = true;

            const farIdx = (this.currentWaypointIndex + this.lookAhead * 2) % numWP;
            const farTarget = this.waypoints[farIdx];
            const farAngle = Utils.angleBetween(target.x, target.y, farTarget.x, farTarget.y);
            const turnSeverity = Math.abs(Utils.normalizeAngle(farAngle - targetAngle));

            if (turnSeverity > SHARP_TURN_THRESHOLD && this.speed > this.maxSpeed * 0.5) {
                input.up = false;
                input.down = true;
                if (turnSeverity > 0.8 && this.difficulty > 0.9) {
                    input.handbrake = true;
                }
            }

            // Occasional nitro on straights for harder AI
            if (this.difficulty > 0.92 && turnSeverity < 0.2 && this.nitro > 30) {
                input.nitro = Math.random() < 0.02;
            }

            if (allCars) {
                for (const other of allCars) {
                    if (other === this) continue;
                    const dist = Utils.distance(this.x, this.y, other.x, other.y);
                    if (dist < AVOIDANCE_RADIUS && dist > 0) {
                        const awayAngle = Utils.angleBetween(other.x, other.y, this.x, this.y);
                        const avoidDiff = Utils.normalizeAngle(awayAngle - this.angle);
                        if (avoidDiff < 0) input.left = true;
                        else input.right = true;
                        const aheadDot = Math.cos(this.angle) * (other.x - this.x) + Math.sin(this.angle) * (other.y - this.y);
                        if (aheadDot > 0 && dist < AVOIDANCE_RADIUS * 0.6) {
                            input.down = true;
                            input.up = false;
                        }
                    }
                }
            }

            const currentWP = this.waypoints[this.currentWaypointIndex];
            if (Utils.distance(this.x, this.y, currentWP.x, currentWP.y) < WAYPOINT_REACH_DIST) {
                this.currentWaypointIndex = (this.currentWaypointIndex + 1) % numWP;
            }

            if (allCars && allCars.length > 0) {
                const player = allCars[0];
                const cpDiff = player.totalCheckpointsPassed - this.totalCheckpointsPassed;
                if (cpDiff > 2) {
                    this.maxSpeed = this._baseMaxSpeed * (1 + Math.min(cpDiff * 0.02, RUBBER_BAND_BOOST));
                } else if (cpDiff < -2) {
                    this.maxSpeed = this._baseMaxSpeed * (1 - Math.min(Math.abs(cpDiff) * 0.015, RUBBER_BAND_SLOW));
                } else {
                    this.maxSpeed = this._baseMaxSpeed;
                }
            }

            super.update(dt, input);
        }

        _findNearestWaypoint() {
            let bestDist = Infinity;
            let bestIndex = 0;
            for (let i = 0; i < this.waypoints.length; i++) {
                const d = Utils.distance(this.x, this.y, this.waypoints[i].x, this.waypoints[i].y);
                if (d < bestDist) { bestDist = d; bestIndex = i; }
            }
            this.currentWaypointIndex = bestIndex;
        }
    }

    /** Factory: create 3 AI cars with difficulty preset. */
    RG.createAICars = function createAICars(startPositions, waypoints, difficultyKey) {
        const preset = RG.AI_PRESETS[difficultyKey] || RG.AI_PRESETS.medium;
        const cars = [];
        for (let i = 0; i < 3; i++) {
            const sp = startPositions[i + 1] || startPositions[0];
            const ai = new AICar(sp.x, sp.y, sp.angle, AI_COLORS[i], AI_NAMES[i], waypoints, preset[i]);
            ai.spriteStyle = AI_STYLES[i];
            ai.accentColor = AI_COLORS[i];
            ai.maxSpeed = CONFIG.MAX_SPEED * preset[i];
            ai._baseMaxSpeed = ai.maxSpeed;
            cars.push(ai);
        }
        return cars;
    };

    RG.AICar = AICar;
})();
