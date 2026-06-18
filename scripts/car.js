/**
 * car.js — Player car with arcade physics, nitro, handbrake drift, and sprite rendering.
 */
window.RacingGame = window.RacingGame || {};

(function () {
    'use strict';

    const RG = window.RacingGame;
    const CONFIG = RG.CONFIG;
    const Utils = RG.Utils;

    const OFF_TRACK_SPEED_MULT = 0.40;
    const OFF_TRACK_FRICTION = 0.92;
    const OFF_TRACK_SPEED_DECAY = 0.95;
    const MIN_STEER_SPEED = 5;
    const HIGH_SPEED_STEER_FACTOR = 0.70;
    const NITRO_RECHARGE_RATE = 18;
    const DRIFT_FRICTION = 0.985;
    const HANDBRAKE_GRIP = 0.55;

    class Car {
        constructor(x, y, angle, color, name) {
            this.x = x;
            this.y = y;
            this.angle = angle;
            this.speed = 0;
            this.prevX = x;
            this.prevY = y;

            this.color = color;
            this.accentColor = color;
            this.spriteStyle = 'sport';
            this.name = name || 'Player';

            this.maxSpeed = CONFIG.MAX_SPEED;
            this.acceleration = CONFIG.ACCELERATION;
            this.brakeForce = CONFIG.BRAKE_FORCE;
            this.friction = CONFIG.FRICTION;
            this.turnSpeed = CONFIG.TURN_SPEED;
            this.width = CONFIG.CAR_WIDTH;
            this.height = CONFIG.CAR_LENGTH;

            this.nitroCapacity = 100;
            this.nitro = 100;
            this.nitroBoost = 1.45;
            this.nitroActive = false;
            this.handbrake = false;
            this.driftAngle = 0;
            this.isDrifting = false;
            this.steerInput = 0;

            this.lap = 0;
            this.currentCheckpoint = 0;
            this.totalCheckpointsPassed = 0;
            this.finished = false;
            this.finishTime = 0;
            this.racePosition = 0;
            this.offTrack = false;

            this.trailPoints = [];
            this._lastSkidFrame = 0;
        }

        update(dt, input) {
            this.prevX = this.x;
            this.prevY = this.y;

            this.nitroActive = !!(input.nitro && this.nitro > 0);
            this.handbrake = !!input.handbrake;
            this.steerInput = (input.left ? -1 : 0) + (input.right ? 1 : 0);

            let effectiveMaxSpeed = this.maxSpeed;
            let effectiveFriction = this.friction;
            let effectiveAccel = this.acceleration;

            if (this.nitroActive) {
                effectiveMaxSpeed *= this.nitroBoost;
                effectiveAccel *= 1.6;
                this.nitro = Math.max(0, this.nitro - 35 * dt);
            } else {
                this.nitro = Math.min(this.nitroCapacity, this.nitro + NITRO_RECHARGE_RATE * dt);
            }

            if (this.offTrack) {
                effectiveMaxSpeed *= OFF_TRACK_SPEED_MULT;
                effectiveFriction = OFF_TRACK_FRICTION;
                this.speed *= OFF_TRACK_SPEED_DECAY;
            }

            if (input.up) {
                this.speed += effectiveAccel * dt;
                if (this.speed > effectiveMaxSpeed) this.speed = effectiveMaxSpeed;
            }
            if (input.down && !this.handbrake) {
                this.speed -= this.brakeForce * dt;
                const reverseMax = -effectiveMaxSpeed * 0.3;
                if (this.speed < reverseMax) this.speed = reverseMax;
            }

            // Handbrake slows forward speed and enables drift
            if (this.handbrake && Math.abs(this.speed) > 20) {
                this.speed *= 0.97;
                effectiveFriction = DRIFT_FRICTION;
            } else {
                this.speed *= effectiveFriction;
            }

            if (Math.abs(this.speed) < 0.5) this.speed = 0;

            // Drift detection
            this.isDrifting = this.handbrake && Math.abs(this.speed) > 60 && Math.abs(this.steerInput) > 0;

            if (Math.abs(this.speed) > MIN_STEER_SPEED) {
                const speedRatio = Math.abs(this.speed) / this.maxSpeed;
                let steerFactor = Utils.lerp(1.0, HIGH_SPEED_STEER_FACTOR, speedRatio);

                if (this.isDrifting) {
                    steerFactor *= 1.35;
                } else if (this.handbrake) {
                    steerFactor *= HANDBRAKE_GRIP;
                }

                const effectiveTurn = this.turnSpeed * steerFactor * dt;
                const steerSign = this.speed >= 0 ? 1 : -1;

                if (input.left) this.angle -= effectiveTurn * steerSign;
                if (input.right) this.angle += effectiveTurn * steerSign;
            }

            this.x += Math.cos(this.angle) * this.speed * dt;
            this.y += Math.sin(this.angle) * this.speed * dt;

            this.trailPoints.push({ x: this.x, y: this.y });
            if (this.trailPoints.length > 15) this.trailPoints.shift();
        }

        render(ctx, effects, particles) {
            // Ground shadow
            if (RG.SpriteRenderer) {
                RG.SpriteRenderer.drawShadow(ctx, this.x, this.y, this.angle, 1);
            }

            // Speed trail
            if (Math.abs(this.speed) > 80 && this.trailPoints.length > 2) {
                ctx.save();
                ctx.lineCap = 'round';
                for (let i = 1; i < this.trailPoints.length; i++) {
                    const alpha = (i / this.trailPoints.length) * 0.3;
                    ctx.strokeStyle = this.nitroActive ? `rgba(0,229,255,${alpha})` : this.color;
                    ctx.globalAlpha = alpha;
                    ctx.lineWidth = (i / this.trailPoints.length) * 5;
                    ctx.beginPath();
                    ctx.moveTo(this.trailPoints[i - 1].x, this.trailPoints[i - 1].y);
                    ctx.lineTo(this.trailPoints[i].x, this.trailPoints[i].y);
                    ctx.stroke();
                }
                ctx.globalAlpha = 1;
                ctx.restore();
            }

            // Skid marks when drifting sharply
            if (effects && (this.isDrifting || (Math.abs(this.steerInput) > 0 && Math.abs(this.speed) > 120 && this.handbrake))) {
                const frame = performance.now();
                if (frame - this._lastSkidFrame > 30) {
                    effects.addSkidMark(this.x, this.y, this.angle + Math.PI / 2, 2.5);
                    this._lastSkidFrame = frame;
                }
            }

            // Sprite body
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);

            if (RG.SpriteRenderer) {
                const sprite = RG.SpriteRenderer.getCarSprite(
                    this.spriteStyle, this.color, this.accentColor || this.color,
                    this.width, this.height
                );
                const sw = sprite.width;
                const sh = sprite.height;
                ctx.shadowColor = this.nitroActive ? '#00e5ff' : this.color;
                ctx.shadowBlur = this.nitroActive ? 18 : 10;
                ctx.drawImage(sprite, -sh / 2, -sw / 2);
            } else {
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 10;
                ctx.fillStyle = this.color;
                ctx.fillRect(-this.height / 2, -this.width / 2, this.height, this.width);
            }

            ctx.restore();

            // Particle hooks (called by game loop for player; AI emits less)
            if (particles) {
                if (Math.abs(this.speed) > 40) {
                    particles.emitExhaust(this.x, this.y, this.angle, Math.abs(this.speed));
                }
                if (this.nitroActive) {
                    particles.emitNitroFlame(this.x, this.y, this.angle);
                }
                if (this.offTrack && Math.abs(this.speed) > 30) {
                    particles.emitDust(this.x, this.y);
                }
            }
        }

        reset(x, y, angle) {
            this.x = x;
            this.y = y;
            this.prevX = x;
            this.prevY = y;
            this.angle = angle;
            this.speed = 0;
            this.nitro = this.nitroCapacity;
            this.lap = 0;
            this.currentCheckpoint = 0;
            this.totalCheckpointsPassed = 0;
            this.finished = false;
            this.finishTime = 0;
            this.racePosition = 0;
            this.offTrack = false;
            this.trailPoints = [];
            this.isDrifting = false;
        }

        getSpeedRatio() {
            return Math.abs(this.speed) / this.maxSpeed;
        }

        getNitroRatio() {
            return this.nitro / this.nitroCapacity;
        }

        getCorners() {
            const hw = this.width / 2;
            const hh = this.height / 2;
            const cos = Math.cos(this.angle);
            const sin = Math.sin(this.angle);
            const locals = [
                { lx: -hh, ly: -hw },
                { lx: hh, ly: -hw },
                { lx: hh, ly: hw },
                { lx: -hh, ly: hw }
            ];
            return locals.map(p => ({
                x: this.x + p.lx * cos - p.ly * sin,
                y: this.y + p.lx * sin + p.ly * cos
            }));
        }

        getBoundingCircle() {
            return { x: this.x, y: this.y, radius: this.height / 2 };
        }
    }

    RG.Car = Car;
})();
