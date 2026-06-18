/**
 * hud.js - Heads-Up Display
 *
 * Renders screen-space UI overlays on the canvas:
 *  1. Speedometer gauge (bottom-left)   – arc gauge with animated needle
 *  2. Lap counter      (top-left)       – current / total laps
 *  3. Race position    (top-left)       – 1st–4th with ordinal suffix
 *  4. Race timer       (top-center)     – M:SS.mmm
 *  5. Minimap          (bottom-right)   – track outline + car dots
 *
 * All drawing is in screen coordinates (call AFTER resetting camera transform).
 *
 * Depends on: RG.Utils, RG.CONFIG, RG.COLORS
 */
window.RacingGame = window.RacingGame || {};

(function () {
    'use strict';

    const RG     = window.RacingGame;
    const COLORS = RG.COLORS;
    const Utils  = RG.Utils;

    // ── Layout constants ──
    const SPEEDO_SIZE      = 70;   // radius of speedometer arc
    const SPEEDO_MARGIN    = 25;   // margin from canvas edges
    const HUD_PADDING      = 12;
    const MINIMAP_W        = 150;
    const MINIMAP_H        = 120;
    const MINIMAP_MARGIN   = 15;

    // ── Speedometer arc sweep (in radians) ──
    const SWEEP_START = Math.PI * 0.75;     // ~135°
    const SWEEP_END   = Math.PI * 2.25;     // ~405° (i.e. 270° sweep)
    const SWEEP_RANGE = SWEEP_END - SWEEP_START;

    // ── Position colours ──
    const POS_COLORS = {
        1: '#ffd700',  // gold
        2: '#c0c0c0',  // silver
        3: '#cd7f32',  // bronze
    };

    /**
     * @class HUD
     */
    class HUD {
        constructor() {
            // Smoothed needle angle for the speedometer
            this.speedNeedleAngle = SWEEP_START;
        }

        /* ═══════════════════════════════════════════════════════
         *  RENDER  –  main entry point
         *
         *  data = {
         *    speed, maxSpeed,
         *    lap, totalLaps,
         *    position, totalCars,
         *    raceTime,             // ms
         *    cars: [{x,y,color}],
         *    innerBoundary, outerBoundary,
         *    trackBounds: {minX, minY, maxX, maxY}
         *  }
         * ═══════════════════════════════════════════════════════ */
        render(ctx, canvasWidth, canvasHeight, data) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0); // reset to screen space

            const accent = (data.themeColors && data.themeColors.borderOuter) || COLORS.HUD_ACCENT;

            this._renderSpeedometer(ctx, canvasWidth, canvasHeight, data, accent);
            this._renderNitroGauge(ctx, canvasWidth, canvasHeight, data, accent);
            this._renderLapCounter(ctx, data, accent);
            this._renderPosition(ctx, data, accent);
            this._renderTimer(ctx, canvasWidth, data, accent);
            this._renderTrackName(ctx, canvasWidth, data, accent);
            this._renderMinimap(ctx, canvasWidth, canvasHeight, data, accent);

            ctx.restore();
        }

        /* ───────────────────────────────────────────────────────
         *  1. SPEEDOMETER
         * ─────────────────────────────────────────────────────── */
        _renderNitroGauge(ctx, cw, ch, data, accent) {
            const x = SPEEDO_MARGIN + 10;
            const y = ch - SPEEDO_MARGIN - SPEEDO_SIZE - 55;
            const w = SPEEDO_SIZE * 2 + 10;
            const h = 10;

            ctx.save();
            this._roundRect(ctx, x, y, w, h, 4);
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fill();

            const nitro = data.nitro != null ? data.nitro : 0;
            const fillW = w * nitro;
            if (fillW > 0) {
                ctx.fillStyle = data.nitroActive ? '#00e5ff' : accent;
                ctx.shadowColor = data.nitroActive ? '#00e5ff' : accent;
                ctx.shadowBlur = data.nitroActive ? 10 : 4;
                this._roundRect(ctx, x, y, fillW, h, 4);
                ctx.fill();
            }

            ctx.shadowBlur = 0;
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.font = '9px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('NITRO', x, y - 4);
            ctx.restore();
        }

        _renderTrackName(ctx, cw, data, accent) {
            if (!data.trackName) return;
            ctx.save();
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(data.trackName.toUpperCase(), cw / 2, HUD_PADDING + 36);
            ctx.restore();
        }

        _renderSpeedometer(ctx, cw, ch, data, accent) {
            const cx = SPEEDO_MARGIN + SPEEDO_SIZE + 10;
            const cy = ch - SPEEDO_MARGIN - SPEEDO_SIZE - 10;
            const r  = SPEEDO_SIZE;

            // ── Background circle ──
            ctx.save();
            ctx.shadowColor = 'rgba(0, 229, 255, 0.3)';
            ctx.shadowBlur  = 20;
            ctx.fillStyle   = COLORS.HUD_BG;
            ctx.beginPath();
            ctx.arc(cx, cy, r + 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Thin neon border
            ctx.strokeStyle = accent || COLORS.HUD_ACCENT;
            ctx.lineWidth   = 1.5;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(cx, cy, r + 12, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.restore();

            // ── Gauge arc – green → yellow → red ──
            const arcWidth = 8;
            const grad = ctx.createConicalGradient
                ? null // Not widely supported – fall back to segmented drawing
                : null;

            // Draw segmented arc for gradient effect
            const segments = 40;
            for (let i = 0; i < segments; i++) {
                const t0 = i / segments;
                const t1 = (i + 1) / segments;
                const a0 = SWEEP_START + t0 * SWEEP_RANGE;
                const a1 = SWEEP_START + t1 * SWEEP_RANGE;

                // Color: green → yellow → red
                let cr, cg, cb;
                if (t0 < 0.5) {
                    // green → yellow
                    const tt = t0 / 0.5;
                    cr = Math.round(Utils.lerp(0, 255, tt));
                    cg = 220;
                    cb = 0;
                } else {
                    // yellow → red
                    const tt = (t0 - 0.5) / 0.5;
                    cr = 255;
                    cg = Math.round(Utils.lerp(220, 0, tt));
                    cb = 0;
                }

                ctx.strokeStyle = `rgb(${cr},${cg},${cb})`;
                ctx.lineWidth   = arcWidth;
                ctx.lineCap     = 'butt';
                ctx.beginPath();
                ctx.arc(cx, cy, r - 4, a0, a1);
                ctx.stroke();
            }

            // ── Background track for the arc (dark) ──
            // (already drawn by the segments above)

            // ── Tick marks ──
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth   = 1;
            const numTicks = 10;
            for (let i = 0; i <= numTicks; i++) {
                const t   = i / numTicks;
                const ang = SWEEP_START + t * SWEEP_RANGE;
                const inner = r - 16;
                const outer = r - 10;
                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(ang) * inner, cy + Math.sin(ang) * inner);
                ctx.lineTo(cx + Math.cos(ang) * outer, cy + Math.sin(ang) * outer);
                ctx.stroke();
            }

            // ── Animated needle ──
            const speedRatio     = Utils.clamp(data.speed / data.maxSpeed, 0, 1);
            const targetAngle    = SWEEP_START + speedRatio * SWEEP_RANGE;
            // Smooth interpolation
            this.speedNeedleAngle = Utils.lerp(this.speedNeedleAngle, targetAngle, 0.15);

            ctx.save();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth   = 2.5;
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur  = 6;
            ctx.lineCap     = 'round';
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(
                cx + Math.cos(this.speedNeedleAngle) * (r - 18),
                cy + Math.sin(this.speedNeedleAngle) * (r - 18)
            );
            ctx.stroke();
            ctx.restore();

            // Center cap
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(cx, cy, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 1;
            ctx.stroke();

            // ── Digital readout ──
            const displaySpeed = Math.round(Math.abs(data.speed));
            ctx.fillStyle   = COLORS.HUD_TEXT;
            ctx.font        = 'bold 26px "Courier New", monospace';
            ctx.textAlign   = 'center';
            ctx.textBaseline = 'top';
            ctx.shadowColor = COLORS.HUD_ACCENT;
            ctx.shadowBlur  = 4;
            ctx.fillText(displaySpeed, cx, cy + 12);

            ctx.font      = '10px sans-serif';
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.shadowBlur = 0;
            ctx.fillText('KM/H', cx, cy + 40);
        }

        /* ───────────────────────────────────────────────────────
         *  2. LAP COUNTER
         * ─────────────────────────────────────────────────────── */
        _renderLapCounter(ctx, data, accent) {
            const x = HUD_PADDING;
            const y = HUD_PADDING;
            const w = 100;
            const h = 52;

            // Background
            ctx.save();
            this._roundRect(ctx, x, y, w, h, 8);
            ctx.fillStyle = COLORS.HUD_BG;
            ctx.fill();

            // Neon accent border
            ctx.strokeStyle = accent || COLORS.HUD_ACCENT;
            ctx.lineWidth   = 1.5;
            ctx.shadowColor = COLORS.HUD_ACCENT;
            ctx.shadowBlur  = 6;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Label
            ctx.fillStyle    = 'rgba(255,255,255,0.5)';
            ctx.font         = '10px sans-serif';
            ctx.textAlign    = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('LAP', x + 10, y + 8);

            // Value
            const displayLap = Math.max(1, Math.min(data.lap, data.totalLaps));
            ctx.fillStyle = COLORS.HUD_TEXT;
            ctx.font      = 'bold 22px "Courier New", monospace';
            ctx.fillText(`${displayLap} / ${data.totalLaps}`, x + 10, y + 22);

            ctx.restore();
        }

        /* ───────────────────────────────────────────────────────
         *  3. RACE POSITION
         * ─────────────────────────────────────────────────────── */
        _renderPosition(ctx, data, accent) {
            const x = HUD_PADDING;
            const y = HUD_PADDING + 60;
            const w = 100;
            const h = 52;

            ctx.save();
            this._roundRect(ctx, x, y, w, h, 8);
            ctx.fillStyle = COLORS.HUD_BG;
            ctx.fill();

            ctx.strokeStyle = accent || COLORS.HUD_ACCENT;
            ctx.lineWidth   = 1.5;
            ctx.shadowColor = COLORS.HUD_ACCENT;
            ctx.shadowBlur  = 6;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Label
            ctx.fillStyle    = 'rgba(255,255,255,0.5)';
            ctx.font         = '10px sans-serif';
            ctx.textAlign    = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('POS', x + 10, y + 8);

            // Position number with colour
            const pos    = data.position || 1;
            const suffix = this._ordinal(pos);
            const color  = POS_COLORS[pos] || '#ffffff';

            ctx.fillStyle   = color;
            ctx.font        = 'bold 22px "Courier New", monospace';
            ctx.shadowColor = color;
            ctx.shadowBlur  = 8;
            ctx.fillText(`${pos}${suffix}`, x + 10, y + 22);
            ctx.shadowBlur = 0;

            // "/ N"
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font      = '14px "Courier New", monospace';
            ctx.fillText(`/ ${data.totalCars}`, x + 60, y + 28);

            ctx.restore();
        }

        /* ───────────────────────────────────────────────────────
         *  4. RACE TIMER
         * ─────────────────────────────────────────────────────── */
        _renderTimer(ctx, cw, data, accent) {
            const timeStr = Utils.formatTime(data.raceTime || 0);

            ctx.save();
            ctx.fillStyle    = COLORS.HUD_TEXT;
            ctx.font         = 'bold 20px "Courier New", monospace';
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'top';
            ctx.shadowColor  = 'rgba(255,255,255,0.4)';
            ctx.shadowBlur   = 6;

            // Background pill
            const tw = ctx.measureText(timeStr).width;
            const px = cw / 2;
            const py = HUD_PADDING;
            this._roundRect(ctx, px - tw / 2 - 14, py - 4, tw + 28, 30, 8);
            ctx.fillStyle = COLORS.HUD_BG;
            ctx.fill();
            ctx.strokeStyle = accent || COLORS.HUD_ACCENT;
            ctx.lineWidth = 1;
            ctx.shadowBlur = 4;
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.fillStyle = COLORS.HUD_TEXT;
            ctx.fillText(timeStr, px, py + 2);

            ctx.restore();
        }

        /* ───────────────────────────────────────────────────────
         *  5. MINIMAP
         * ─────────────────────────────────────────────────────── */
        _renderMinimap(ctx, cw, ch, data, accent) {
            if (!data.outerBoundary || !data.innerBoundary || !data.trackBounds) return;

            const mx = cw - MINIMAP_W - MINIMAP_MARGIN;
            const my = ch - MINIMAP_H - MINIMAP_MARGIN;

            // ── Background ──
            ctx.save();
            this._roundRect(ctx, mx, my, MINIMAP_W, MINIMAP_H, 8);
            ctx.fillStyle = 'rgba(0,0,0,0.65)';
            ctx.fill();

            // Border
            ctx.strokeStyle = accent || COLORS.HUD_ACCENT;
            ctx.lineWidth   = 1;
            ctx.shadowColor = COLORS.HUD_ACCENT;
            ctx.shadowBlur  = 4;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // ── Coordinate mapping ──
            const tb      = data.trackBounds;
            const padding = 10;
            const drawW   = MINIMAP_W - padding * 2;
            const drawH   = MINIMAP_H - padding * 2;
            const scaleX  = drawW / (tb.maxX - tb.minX || 1);
            const scaleY  = drawH / (tb.maxY - tb.minY || 1);
            const scale   = Math.min(scaleX, scaleY);

            // Offset to center the track in the minimap
            const trackDrawW = (tb.maxX - tb.minX) * scale;
            const trackDrawH = (tb.maxY - tb.minY) * scale;
            const offX = mx + padding + (drawW - trackDrawW) / 2;
            const offY = my + padding + (drawH - trackDrawH) / 2;

            const toMiniX = (wx) => offX + (wx - tb.minX) * scale;
            const toMiniY = (wy) => offY + (wy - tb.minY) * scale;

            // ── Draw track outline (outer) ──
            ctx.strokeStyle = (data.themeColors && data.themeColors.borderOuter) || COLORS.TRACK_BORDER_OUTER;
            ctx.lineWidth   = 1;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            const ob = data.outerBoundary;
            ctx.moveTo(toMiniX(ob[0].x), toMiniY(ob[0].y));
            for (let i = 1; i < ob.length; i++) {
                ctx.lineTo(toMiniX(ob[i].x), toMiniY(ob[i].y));
            }
            ctx.closePath();
            ctx.stroke();

            // Inner outline
            ctx.strokeStyle = (data.themeColors && data.themeColors.borderInner) || COLORS.TRACK_BORDER_INNER;
            ctx.beginPath();
            const ib = data.innerBoundary;
            ctx.moveTo(toMiniX(ib[0].x), toMiniY(ib[0].y));
            for (let i = 1; i < ib.length; i++) {
                ctx.lineTo(toMiniX(ib[i].x), toMiniY(ib[i].y));
            }
            ctx.closePath();
            ctx.stroke();
            ctx.globalAlpha = 1;

            // ── Draw car dots ──
            if (data.cars) {
                for (let i = 0; i < data.cars.length; i++) {
                    const car = data.cars[i];
                    const dotX = toMiniX(car.x);
                    const dotY = toMiniY(car.y);
                    const isPlayer = (i === 0);
                    const dotR = isPlayer ? 4 : 3;

                    ctx.fillStyle = car.color;
                    if (isPlayer) {
                        ctx.shadowColor = car.color;
                        ctx.shadowBlur  = 8;
                    }
                    ctx.beginPath();
                    ctx.arc(dotX, dotY, dotR, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }

            ctx.restore();
        }

        /* ═══════════════════════════════════════════════════════
         *  HELPERS
         * ═══════════════════════════════════════════════════════ */

        /**
         * Draw a rounded-rectangle path (does NOT fill or stroke).
         */
        _roundRect(ctx, x, y, w, h, r) {
            ctx.beginPath();
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

        /**
         * Get the ordinal suffix for a number.
         * @param {number} n
         * @returns {string} 'st', 'nd', 'rd', or 'th'
         */
        _ordinal(n) {
            const s = ['th', 'st', 'nd', 'rd'];
            const v = n % 100;
            return s[(v - 20) % 10] || s[v] || s[0];
        }
    }

    // ── Export ──
    RG.HUD = HUD;
})();
