/**
 * sprites.js — Procedural cached sprite generation for vehicles.
 * Creates high-quality top-down car sprites at runtime (no external assets).
 */
window.RacingGame = window.RacingGame || {};

(function () {
    'use strict';

    const cache = {};

    class SpriteRenderer {
        /**
         * Get or create a cached car sprite canvas.
         * @param {string} style  - 'sport' | 'muscle' | 'agile' | 'heavy' | 'hyper'
         * @param {string} color  - Primary body color
         * @param {string} accent - Secondary accent color
         * @param {number} w      - Width in pixels
         * @param {number} h      - Length in pixels
         */
        static getCarSprite(style, color, accent, w, h) {
            const key = `${style}_${color}_${accent}_${w}_${h}`;
            if (cache[key]) return cache[key];

            const pad = 8;
            const canvas = document.createElement('canvas');
            canvas.width = h + pad * 2;
            canvas.height = w + pad * 2;
            const ctx = canvas.getContext('2d');
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            ctx.translate(cx, cy);

            // Shadow hint baked into sprite offset
            SpriteRenderer._drawBody(ctx, style, color, accent, h, w);
            cache[key] = canvas;
            return canvas;
        }

        static _drawBody(ctx, style, color, accent, length, width) {
            const hw = width / 2;
            const hh = length / 2;

            // Body shape varies by style
            const bodyW = style === 'muscle' ? width * 1.08 : style === 'agile' ? width * 0.92 : width;
            const bodyH = style === 'hyper' ? length * 1.05 : length;
            const bhw = bodyW / 2;
            const bhh = bodyH / 2;

            // Rear spoiler for sport/hyper
            if (style === 'sport' || style === 'hyper') {
                ctx.fillStyle = accent;
                ctx.fillRect(-bhh - 2, -bhw * 0.7, 4, bhw * 1.4);
            }

            // Main body gradient
            const grad = ctx.createLinearGradient(-bhh, 0, bhh, 0);
            grad.addColorStop(0, color);
            grad.addColorStop(0.4, SpriteRenderer._shade(color, -25));
            grad.addColorStop(0.6, SpriteRenderer._shade(color, -15));
            grad.addColorStop(1, color);

            ctx.beginPath();
            SpriteRenderer._roundedRect(ctx, -bhh, -bhw, bodyH, bodyW, 5);
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Hood stripe
            ctx.fillStyle = accent;
            ctx.globalAlpha = 0.5;
            ctx.fillRect(-bhh * 0.2, -bhw * 0.15, bodyH * 0.5, bhw * 0.3);
            ctx.globalAlpha = 1;

            // Windshield
            ctx.fillStyle = 'rgba(100,180,255,0.55)';
            ctx.beginPath();
            SpriteRenderer._roundedRect(ctx, -bhh * 0.15, -bhw * 0.42, bodyH * 0.28, bhw * 0.84, 3);
            ctx.fill();

            // Headlights
            ctx.fillStyle = '#fffde7';
            ctx.shadowColor = '#ffffaa';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(bhh - 4, -bhw * 0.55, 2.5, 0, Math.PI * 2);
            ctx.arc(bhh - 4,  bhw * 0.55, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Tail lights
            ctx.fillStyle = '#ff1744';
            ctx.shadowColor = '#ff1744';
            ctx.shadowBlur = 5;
            ctx.beginPath();
            ctx.arc(-bhh + 4, -bhw * 0.55, 2, 0, Math.PI * 2);
            ctx.arc(-bhh + 4,  bhw * 0.55, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Side mirrors / details for muscle
            if (style === 'muscle' || style === 'heavy') {
                ctx.fillStyle = SpriteRenderer._shade(color, -40);
                ctx.fillRect(bhh * 0.1, -bhw - 2, 6, 3);
                ctx.fillRect(bhh * 0.1,  bhw - 1, 6, 3);
            }
        }

        static _roundedRect(ctx, x, y, w, h, r) {
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
        }

        static _shade(hex, amount) {
            let h = hex.replace('#', '');
            if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
            const num = parseInt(h, 16);
            const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
            const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
            const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
            return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }

        /** Draw ground shadow ellipse beneath a car. */
        static drawShadow(ctx, x, y, angle, scale) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.scale(1, 0.45);
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.beginPath();
            ctx.ellipse(0, 2, 22 * scale, 14 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    window.RacingGame.SpriteRenderer = SpriteRenderer;
})();
