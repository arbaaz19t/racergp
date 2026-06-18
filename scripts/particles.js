/**
 * particles.js — In-race particle system (exhaust, dust, sparks, collisions).
 */
window.RacingGame = window.RacingGame || {};

(function () {
    'use strict';

    const Utils = window.RacingGame.Utils;

    const MAX_PARTICLES = 400;

    class ParticleSystem {
        constructor() {
            this.particles = [];
        }

        /** Emit exhaust smoke from rear of car. */
        emitExhaust(x, y, angle, speed, color) {
            if (this.particles.length >= MAX_PARTICLES) return;
            const rearX = x - Math.cos(angle) * 18;
            const rearY = y - Math.sin(angle) * 18;
            const count = speed > 80 ? 2 : 1;
            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: rearX + Utils.randomRange(-3, 3),
                    y: rearY + Utils.randomRange(-3, 3),
                    vx: -Math.cos(angle) * Utils.randomRange(10, 40) + Utils.randomRange(-15, 15),
                    vy: -Math.sin(angle) * Utils.randomRange(10, 40) + Utils.randomRange(-15, 15),
                    life: 1,
                    decay: Utils.randomRange(0.02, 0.05),
                    size: Utils.randomRange(3, 7),
                    color: color || 'rgba(180,180,180,',
                    type: 'exhaust'
                });
            }
        }

        /** Nitro flame burst. */
        emitNitroFlame(x, y, angle) {
            if (this.particles.length >= MAX_PARTICLES) return;
            for (let i = 0; i < 3; i++) {
                this.particles.push({
                    x: x - Math.cos(angle) * 20,
                    y: y - Math.sin(angle) * 20,
                    vx: -Math.cos(angle) * Utils.randomRange(80, 150),
                    vy: -Math.sin(angle) * Utils.randomRange(80, 150),
                    life: 1,
                    decay: Utils.randomRange(0.06, 0.12),
                    size: Utils.randomRange(4, 9),
                    color: 'rgba(0,229,255,',
                    type: 'nitro'
                });
            }
        }

        /** Dust when off-track or drifting. */
        emitDust(x, y, theme) {
            if (this.particles.length >= MAX_PARTICLES) return;
            const dustColor = theme === 'desert' ? 'rgba(210,180,120,' :
                theme === 'forest' ? 'rgba(100,140,80,' : 'rgba(120,120,120,';
            this.particles.push({
                x, y,
                vx: Utils.randomRange(-30, 30),
                vy: Utils.randomRange(-30, 30),
                life: 1,
                decay: Utils.randomRange(0.03, 0.06),
                size: Utils.randomRange(4, 10),
                color: dustColor,
                type: 'dust'
            });
        }

        /** Collision sparks. */
        emitCollision(x, y, intensity) {
            const count = Math.min(12, Math.floor(intensity * 8) + 4);
            for (let i = 0; i < count && this.particles.length < MAX_PARTICLES; i++) {
                const a = Utils.randomRange(0, Math.PI * 2);
                const spd = Utils.randomRange(50, 150) * intensity;
                this.particles.push({
                    x, y,
                    vx: Math.cos(a) * spd,
                    vy: Math.sin(a) * spd,
                    life: 1,
                    decay: Utils.randomRange(0.04, 0.08),
                    size: Utils.randomRange(2, 5),
                    color: 'rgba(255,200,50,',
                    type: 'spark'
                });
            }
        }

        update(dt) {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vx *= 0.95;
                p.vy *= 0.95;
                p.life -= p.decay;
                if (p.type === 'exhaust' || p.type === 'dust') {
                    p.size += dt * 8;
                }
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                }
            }
        }

        render(ctx) {
            for (const p of this.particles) {
                const alpha = p.life;
                ctx.fillStyle = p.color + alpha + ')';
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        clear() {
            this.particles = [];
        }
    }

    window.RacingGame.ParticleSystem = ParticleSystem;
})();
