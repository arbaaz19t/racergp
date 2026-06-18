/**
 * effects.js — Skid marks, screen shake, and speed-line effects.
 */
window.RacingGame = window.RacingGame || {};

(function () {
    'use strict';

    const MAX_SKID_MARKS = 600;
    const SKID_FADE = 0.003;

    class EffectsManager {
        constructor() {
            this.skidMarks = [];
            this.screenShake = { x: 0, y: 0, intensity: 0 };
            this.speedLinePhase = 0;
            this.lastSkidSound = 0;
        }

        /** Add a skid mark segment at world position. */
        addSkidMark(x, y, angle, width) {
            if (this.skidMarks.length >= MAX_SKID_MARKS) {
                this.skidMarks.shift();
            }
            this.skidMarks.push({ x, y, angle, width: width || 3, alpha: 0.7 });
        }

        /** Trigger screen shake on collision. */
        addScreenShake(intensity) {
            this.screenShake.intensity = Math.min(18, this.screenShake.intensity + intensity);
        }

        update(dt, playerSpeed) {
            // Decay skid marks
            for (let i = this.skidMarks.length - 1; i >= 0; i--) {
                this.skidMarks[i].alpha -= SKID_FADE;
                if (this.skidMarks[i].alpha <= 0) {
                    this.skidMarks.splice(i, 1);
                }
            }

            // Screen shake decay
            const shake = this.screenShake;
            if (shake.intensity > 0.1) {
                shake.x = (Math.random() - 0.5) * shake.intensity * 2;
                shake.y = (Math.random() - 0.5) * shake.intensity * 2;
                shake.intensity *= 0.88;
            } else {
                shake.x = 0;
                shake.y = 0;
                shake.intensity = 0;
            }

            if (Math.abs(playerSpeed) > 200) {
                this.speedLinePhase += dt * 3;
            }
        }

        /** Render skid marks in world space (call before cars). */
        renderSkidMarks(ctx) {
            ctx.save();
            ctx.lineCap = 'round';
            for (const mark of this.skidMarks) {
                ctx.strokeStyle = `rgba(30,30,30,${mark.alpha * 0.6})`;
                ctx.lineWidth = mark.width;
                ctx.beginPath();
                const len = 6;
                ctx.moveTo(
                    mark.x - Math.cos(mark.angle) * len,
                    mark.y - Math.sin(mark.angle) * len
                );
                ctx.lineTo(
                    mark.x + Math.cos(mark.angle) * len,
                    mark.y + Math.sin(mark.angle) * len
                );
                ctx.stroke();
            }
            ctx.restore();
        }

        /** Speed lines in screen space when going fast. */
        renderSpeedLines(ctx, canvasW, canvasH, speedRatio) {
            if (speedRatio < 0.55) return;

            const intensity = (speedRatio - 0.55) / 0.45;
            const count = Math.floor(intensity * 20);
            ctx.save();
            ctx.strokeStyle = `rgba(255,255,255,${intensity * 0.15})`;
            ctx.lineWidth = 1;
            const cx = canvasW / 2;
            const cy = canvasH / 2;

            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2 + this.speedLinePhase;
                const inner = 80 + (i % 5) * 30;
                const outer = inner + 40 + intensity * 60;
                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
                ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
                ctx.stroke();
            }
            ctx.restore();
        }

        getShakeOffset() {
            return { x: this.screenShake.x, y: this.screenShake.y };
        }

        shouldPlaySkidSound() {
            const now = performance.now();
            if (now - this.lastSkidSound > 200) {
                this.lastSkidSound = now;
                return true;
            }
            return false;
        }

        clear() {
            this.skidMarks = [];
            this.screenShake.intensity = 0;
        }
    }

    window.RacingGame.EffectsManager = EffectsManager;
})();
