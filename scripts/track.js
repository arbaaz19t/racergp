/**
 * track.js — Themed track rendering with animated backgrounds and roadside scenery.
 */
window.RacingGame = window.RacingGame || {};

(function () {
    'use strict';

    const RG = window.RacingGame;
    const CONFIG = RG.CONFIG;
    const Utils = RG.Utils;

    const INTERPOLATION_DENSITY = 20;
    const CURB_SEGMENT_LENGTH = 12;
    const CURB_WIDTH = 8;
    const CURB_SHARPNESS_THRESH = 0.10;

    class TrackRenderer {
        constructor(trackData) {
            this.trackData = trackData;
            this.theme = trackData.theme || 'forest';
            this.colors = trackData.themeColors || {};
            this.centerPoints = [];
            this.innerBoundary = [];
            this.outerBoundary = [];
            this.checkpoints = [];
            this.startLine = null;
            this.trackWidth = CONFIG.TRACK_WIDTH;
            this._normals = [];
            this.animTime = 0;
            this.roadsideObjects = [];
            this._generateTrack();
            this._generateRoadside();
        }

        _generateTrack() {
            const cp = this.trackData.controlPoints;
            if (!cp || cp.length < 3) return;

            this.centerPoints = Utils.catmullRomInterpolate(cp, INTERPOLATION_DENSITY);
            const n = this.centerPoints.length;
            this.innerBoundary = [];
            this.outerBoundary = [];
            this._normals = [];

            for (let i = 0; i < n; i++) {
                const prev = this.centerPoints[(i - 1 + n) % n];
                const next = this.centerPoints[(i + 1) % n];
                const cur = this.centerPoints[i];
                const dx = next.x - prev.x;
                const dy = next.y - prev.y;
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                const nx = -dy / len;
                const ny = dx / len;
                this._normals.push({ x: nx, y: ny });
                const halfW = this.trackWidth / 2;
                this.innerBoundary.push({ x: cur.x - nx * halfW, y: cur.y - ny * halfW });
                this.outerBoundary.push({ x: cur.x + nx * halfW, y: cur.y + ny * halfW });
            }

            const numCP = CONFIG.NUM_CHECKPOINTS;
            this.checkpoints = [];
            for (let i = 0; i < numCP; i++) {
                const idx = Math.floor((i / numCP) * n);
                this.checkpoints.push({
                    x1: this.innerBoundary[idx].x,
                    y1: this.innerBoundary[idx].y,
                    x2: this.outerBoundary[idx].x,
                    y2: this.outerBoundary[idx].y
                });
            }
            this.startLine = this.checkpoints[0];
        }

        /** Place decorative objects along the outer edge of the track. */
        _generateRoadside() {
            const n = this.centerPoints.length;
            const step = Math.floor(n / 24);
            const types = this._getRoadsideTypes();

            for (let i = 0; i < n; i += step) {
                const cur = this.centerPoints[i];
                const norm = this._normals[i];
                const side = i % 2 === 0 ? 1 : -1;
                const offset = this.trackWidth * 0.5 + Utils.randomRange(30, 80);
                this.roadsideObjects.push({
                    type: types[Math.floor(Math.random() * types.length)],
                    x: cur.x + norm.x * offset * side,
                    y: cur.y + norm.y * offset * side,
                    scale: Utils.randomRange(0.7, 1.3),
                    phase: Math.random() * Math.PI * 2
                });
            }
        }

        _getRoadsideTypes() {
            switch (this.theme) {
                case 'desert': return ['cactus', 'rock', 'bush'];
                case 'city': return ['building', 'lamp', 'cone'];
                case 'night': return ['lamp', 'barrier', 'sign'];
                default: return ['tree', 'bush', 'rock'];
            }
        }

        update(dt) {
            this.animTime += dt;
        }

        render(ctx, camera) {
            const n = this.centerPoints.length;
            if (n === 0) return;
            const c = this.colors;
            const bounds = this.getBounds();
            const pad = 800;

            // Themed background
            this._renderBackground(ctx, bounds, pad);

            // Roadside scenery (behind track)
            this._renderRoadside(ctx);

            // Grass / ground fill
            ctx.fillStyle = c.grass || '#0a1f0a';
            ctx.fillRect(bounds.minX - pad, bounds.minY - pad, bounds.width + pad * 2, bounds.height + pad * 2);

            // Subtle ground texture
            this._renderGroundTexture(ctx, bounds, pad);

            // Track surface
            ctx.fillStyle = c.trackSurface || '#2a2a2a';
            ctx.beginPath();
            ctx.moveTo(this.outerBoundary[0].x, this.outerBoundary[0].y);
            for (let i = 1; i < n; i++) ctx.lineTo(this.outerBoundary[i].x, this.outerBoundary[i].y);
            ctx.closePath();
            ctx.moveTo(this.innerBoundary[0].x, this.innerBoundary[0].y);
            for (let i = n - 1; i >= 1; i--) ctx.lineTo(this.innerBoundary[i].x, this.innerBoundary[i].y);
            ctx.closePath();
            ctx.fill('evenodd');

            this._renderCurbs(ctx, c);
            this._renderCenterLine(ctx);
            this._renderBorders(ctx, c);

            if (this.startLine) {
                ctx.save();
                ctx.strokeStyle = c.startLine || '#ffffff';
                ctx.lineWidth = 5;
                ctx.shadowColor = c.startLine;
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(this.startLine.x1, this.startLine.y1);
                ctx.lineTo(this.startLine.x2, this.startLine.y2);
                ctx.stroke();
                this._renderCheckerPattern(ctx, this.startLine);
                ctx.restore();
            }
        }

        _renderBackground(ctx, bounds, pad) {
            const c = this.colors;
            ctx.fillStyle = c.background || '#050a05';
            ctx.fillRect(bounds.minX - pad, bounds.minY - pad, bounds.width + pad * 2, bounds.height + pad * 2);

            if (this.theme === 'night') {
                // Stars
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                for (let i = 0; i < 80; i++) {
                    const sx = bounds.minX - pad + (i * 137.5) % (bounds.width + pad * 2);
                    const sy = bounds.minY - pad + (i * 97.3) % (bounds.height + pad * 2);
                    const twinkle = 0.3 + 0.7 * Math.abs(Math.sin(this.animTime * 2 + i));
                    ctx.globalAlpha = twinkle * 0.6;
                    ctx.fillRect(sx, sy, 1.5, 1.5);
                }
                ctx.globalAlpha = 1;
            }

            if (this.theme === 'city' || this.theme === 'night') {
                // Distant skyline silhouettes
                ctx.fillStyle = this.theme === 'night' ? 'rgba(20,20,40,0.6)' : 'rgba(30,30,50,0.4)';
                const baseY = bounds.minY - pad + (bounds.height + pad * 2) * 0.15;
                ctx.beginPath();
                ctx.moveTo(bounds.minX - pad, baseY);
                for (let x = bounds.minX - pad; x < bounds.maxX + pad; x += 40) {
                    const h = 30 + Math.sin(x * 0.01) * 40 + Math.cos(x * 0.023) * 25;
                    ctx.lineTo(x, baseY - h);
                }
                ctx.lineTo(bounds.maxX + pad, baseY);
                ctx.closePath();
                ctx.fill();

                // Window lights
                if (this.theme === 'night') {
                    ctx.fillStyle = 'rgba(255,220,100,0.5)';
                    for (let x = bounds.minX; x < bounds.maxX; x += 60) {
                        if (Math.sin(x * 0.05 + this.animTime) > 0.3) {
                            ctx.fillRect(x, baseY - 50 - (x % 80), 3, 4);
                        }
                    }
                }
            }

            if (this.theme === 'desert') {
                // Heat shimmer bands
                ctx.strokeStyle = 'rgba(255,200,100,0.05)';
                for (let i = 0; i < 5; i++) {
                    const y = bounds.minY + bounds.height * (0.2 + i * 0.15) +
                        Math.sin(this.animTime + i) * 5;
                    ctx.beginPath();
                    ctx.moveTo(bounds.minX - pad, y);
                    ctx.lineTo(bounds.maxX + pad, y);
                    ctx.stroke();
                }
            }
        }

        _renderGroundTexture(ctx, bounds, pad) {
            const c = this.colors;
            const alt = c.grassAlt || c.grass;
            const step = 60;
            for (let x = bounds.minX - pad; x < bounds.maxX + pad; x += step) {
                for (let y = bounds.minY - pad; y < bounds.maxY + pad; y += step) {
                    if ((x + y) % (step * 2) === 0) {
                        ctx.fillStyle = alt;
                        ctx.globalAlpha = 0.15;
                        ctx.fillRect(x, y, step, step);
                    }
                }
            }
            ctx.globalAlpha = 1;
        }

        _renderRoadside(ctx) {
            for (const obj of this.roadsideObjects) {
                ctx.save();
                ctx.translate(obj.x, obj.y);
                const sway = Math.sin(this.animTime * 1.5 + obj.phase) * 2;
                ctx.translate(sway, 0);
                ctx.scale(obj.scale, obj.scale);
                this._drawRoadsideObject(ctx, obj.type);
                ctx.restore();
            }
        }

        _drawRoadsideObject(ctx, type) {
            const c = this.colors;
            switch (type) {
                case 'tree':
                    ctx.fillStyle = '#3e2723';
                    ctx.fillRect(-2, -5, 4, 12);
                    ctx.fillStyle = '#2e7d32';
                    ctx.beginPath();
                    ctx.moveTo(0, -18);
                    ctx.lineTo(-10, 0);
                    ctx.lineTo(10, 0);
                    ctx.closePath();
                    ctx.fill();
                    ctx.fillStyle = '#388e3c';
                    ctx.beginPath();
                    ctx.arc(0, -8, 8, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'cactus':
                    ctx.fillStyle = '#558b2f';
                    ctx.fillRect(-3, -15, 6, 18);
                    ctx.fillRect(-10, -10, 6, 4);
                    ctx.fillRect(-10, -14, 4, 8);
                    ctx.fillRect(6, -8, 6, 4);
                    ctx.fillRect(8, -12, 4, 8);
                    break;
                case 'rock':
                    ctx.fillStyle = c.roadside || '#666';
                    ctx.beginPath();
                    ctx.ellipse(0, 0, 10, 7, 0.3, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'bush':
                    ctx.fillStyle = '#33691e';
                    ctx.beginPath();
                    ctx.arc(-4, 0, 6, 0, Math.PI * 2);
                    ctx.arc(4, 0, 6, 0, Math.PI * 2);
                    ctx.arc(0, -4, 5, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'building':
                    ctx.fillStyle = '#37474f';
                    ctx.fillRect(-8, -25, 16, 25);
                    ctx.fillStyle = 'rgba(100,200,255,0.4)';
                    for (let row = 0; row < 3; row++) {
                        for (let col = 0; col < 2; col++) {
                            if ((row + col) % 2 === 0) {
                                ctx.fillRect(-6 + col * 8, -22 + row * 7, 4, 5);
                            }
                        }
                    }
                    break;
                case 'lamp':
                    ctx.fillStyle = '#455a64';
                    ctx.fillRect(-1, -20, 2, 20);
                    ctx.fillStyle = this.theme === 'night' ? '#fff9c4' : '#ffd54f';
                    ctx.shadowColor = '#fff9c4';
                    ctx.shadowBlur = this.theme === 'night' ? 15 : 5;
                    ctx.beginPath();
                    ctx.arc(0, -22, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    if (this.theme === 'night') {
                        ctx.fillStyle = 'rgba(255,249,196,0.08)';
                        ctx.beginPath();
                        ctx.moveTo(0, -22);
                        ctx.lineTo(-12, 5);
                        ctx.lineTo(12, 5);
                        ctx.closePath();
                        ctx.fill();
                    }
                    break;
                case 'cone':
                    ctx.fillStyle = '#ff6f00';
                    ctx.beginPath();
                    ctx.moveTo(0, -10);
                    ctx.lineTo(-5, 5);
                    ctx.lineTo(5, 5);
                    ctx.closePath();
                    ctx.fill();
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(-4, -2, 8, 2);
                    break;
                case 'barrier':
                    ctx.fillStyle = '#ff1744';
                    ctx.fillRect(-8, -4, 16, 8);
                    ctx.fillStyle = '#fff';
                    ctx.fillRect(-8, -1, 16, 2);
                    break;
                case 'sign':
                    ctx.fillStyle = '#546e7a';
                    ctx.fillRect(-1, -15, 2, 15);
                    ctx.fillStyle = '#00e5ff';
                    ctx.fillRect(-8, -18, 16, 8);
                    break;
            }
        }

        _renderCurbs(ctx, c) {
            const n = this.centerPoints.length;
            ctx.lineWidth = CURB_WIDTH;
            for (let i = 0; i < n; i++) {
                const prev = this.centerPoints[(i - 1 + n) % n];
                const cur = this.centerPoints[i];
                const next = this.centerPoints[(i + 1) % n];
                const a1 = Math.atan2(cur.y - prev.y, cur.x - prev.x);
                const a2 = Math.atan2(next.y - cur.y, next.x - cur.x);
                if (Math.abs(Utils.normalizeAngle(a2 - a1)) > CURB_SHARPNESS_THRESH) {
                    const segIdx = Math.floor(i / CURB_SEGMENT_LENGTH);
                    ctx.strokeStyle = (segIdx % 2 === 0) ? (c.curb1 || '#ff0040') : (c.curb2 || '#fff');
                    ctx.beginPath();
                    ctx.moveTo(this.innerBoundary[i].x, this.innerBoundary[i].y);
                    const ni = (i + 1) % n;
                    ctx.lineTo(this.innerBoundary[ni].x, this.innerBoundary[ni].y);
                    ctx.stroke();
                }
            }
        }

        _renderCenterLine(ctx) {
            const n = this.centerPoints.length;
            ctx.save();
            ctx.setLineDash([12, 18]);
            ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.centerPoints[0].x, this.centerPoints[0].y);
            for (let i = 1; i < n; i++) ctx.lineTo(this.centerPoints[i].x, this.centerPoints[i].y);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }

        _renderBorders(ctx, c) {
            const n = this.centerPoints.length;
            const drawBorder = (boundary, color) => {
                ctx.save();
                ctx.strokeStyle = color;
                ctx.lineWidth = 4;
                ctx.shadowColor = color;
                ctx.shadowBlur = 15;
                ctx.beginPath();
                ctx.moveTo(boundary[0].x, boundary[0].y);
                for (let i = 1; i < n; i++) ctx.lineTo(boundary[i].x, boundary[i].y);
                ctx.closePath();
                ctx.stroke();
                ctx.restore();
            };
            drawBorder(this.outerBoundary, c.borderOuter || '#00e5ff');
            drawBorder(this.innerBoundary, c.borderInner || '#ff00e5');
        }

        _renderCheckerPattern(ctx, line) {
            const dx = line.x2 - line.x1;
            const dy = line.y2 - line.y1;
            const len = Math.sqrt(dx * dx + dy * dy);
            const segs = 10;
            const nx = -dy / len;
            const ny = dx / len;
            const cw = 4;
            ctx.globalAlpha = 0.35;
            for (let s = 0; s < segs; s++) {
                if (s % 2 === 0) continue;
                const t0 = s / segs;
                const t1 = (s + 1) / segs;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(line.x1 + dx * t0 + nx * cw, line.y1 + dy * t0 + ny * cw);
                ctx.lineTo(line.x1 + dx * t1 + nx * cw, line.y1 + dy * t1 + ny * cw);
                ctx.lineTo(line.x1 + dx * t1 - nx * cw, line.y1 + dy * t1 - ny * cw);
                ctx.lineTo(line.x1 + dx * t0 - nx * cw, line.y1 + dy * t0 - ny * cw);
                ctx.closePath();
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }

        isOnTrack(x, y) {
            return Utils.pointInPolygon(x, y, this.outerBoundary) &&
                !Utils.pointInPolygon(x, y, this.innerBoundary);
        }

        getStartPositions() { return this.trackData.startPositions; }
        getWaypoints() { return this.centerPoints; }
        getCheckpoints() { return this.checkpoints; }
        getStartLine() { return this.startLine; }
        getInnerBoundary() { return this.innerBoundary; }
        getOuterBoundary() { return this.outerBoundary; }
        getCenterPoints() { return this.centerPoints; }
        getTheme() { return this.theme; }
        getThemeColors() { return this.colors; }

        getBounds() {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            const allPts = this.outerBoundary.concat(this.innerBoundary);
            for (const p of allPts) {
                if (p.x < minX) minX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.x > maxX) maxX = p.x;
                if (p.y > maxY) maxY = p.y;
            }
            return {
                minX, minY, maxX, maxY,
                width: maxX - minX,
                height: maxY - minY,
                centerX: minX + (maxX - minX) / 2,
                centerY: minY + (maxY - minY) / 2
            };
        }
    }

    RG.TrackRenderer = TrackRenderer;
})();
