/**
 * =============================================================================
 * utils.js — Math Helpers & Game Configuration
 * =============================================================================
 *
 * Foundation utilities for the 2D top-down racing game. This module provides:
 *   - Pure math helper functions (interpolation, geometry, formatting)
 *   - Game configuration constants (physics, track, camera)
 *   - Color palette definitions (neon cyberpunk theme)
 *
 * All exports are attached to the global `window.RacingGame` namespace to allow
 * script-order-independent loading across modules.
 *
 * @module  RacingGame.Utils
 * @module  RacingGame.CONFIG
 * @module  RacingGame.COLORS
 * =============================================================================
 */

/* ---------- Global namespace bootstrap ---------- */
window.RacingGame = window.RacingGame || {};

/* =============================================================================
 * SECTION 1 — Utility Functions
 * =============================================================================*/

window.RacingGame.Utils = {

    /**
     * Linear interpolation between two values.
     *
     * Returns a value that is `t` percent of the way from `a` to `b`.
     * When t = 0 the result is `a`, when t = 1 the result is `b`.
     *
     * @param {number} a - Start value.
     * @param {number} b - End value.
     * @param {number} t - Interpolation factor, typically in [0, 1].
     * @returns {number} The interpolated value.
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    /**
     * Clamp a value between a minimum and maximum bound.
     *
     * @param {number} val - The value to clamp.
     * @param {number} min - Lower bound.
     * @param {number} max - Upper bound.
     * @returns {number} The clamped value.
     */
    clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    },

    /**
     * Euclidean distance between two 2D points.
     *
     * @param {number} x1 - X coordinate of point 1.
     * @param {number} y1 - Y coordinate of point 1.
     * @param {number} x2 - X coordinate of point 2.
     * @param {number} y2 - Y coordinate of point 2.
     * @returns {number} The straight-line distance.
     */
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    /**
     * Angle (in radians) from point 1 to point 2.
     *
     * Uses Math.atan2 so the result is in the range (-PI, PI].
     * 0 = pointing right, PI/2 = pointing down (canvas convention).
     *
     * @param {number} x1 - X coordinate of the origin point.
     * @param {number} y1 - Y coordinate of the origin point.
     * @param {number} x2 - X coordinate of the target point.
     * @param {number} y2 - Y coordinate of the target point.
     * @returns {number} Angle in radians.
     */
    angleBetween(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },

    /**
     * Normalize an angle to the range [-PI, PI].
     *
     * This prevents angle values from growing unbounded during continuous
     * rotation and ensures shortest-path comparisons work correctly.
     *
     * @param {number} angle - Angle in radians (any range).
     * @returns {number} Equivalent angle in [-PI, PI].
     */
    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    },

    /**
     * Generate a random floating-point number within [min, max).
     *
     * @param {number} min - Inclusive lower bound.
     * @param {number} max - Exclusive upper bound.
     * @returns {number} A random float.
     */
    randomRange(min, max) {
        return min + Math.random() * (max - min);
    },

    /**
     * Format a time in milliseconds to the string 'M:SS.mmm'.
     *
     * Examples:
     *   formatTime(61234)  → "1:01.234"
     *   formatTime(9500)   → "0:09.500"
     *
     * @param {number} ms - Time in milliseconds (non-negative).
     * @returns {string} Formatted time string.
     */
    formatTime(ms) {
        /* Guard against negative values */
        if (ms < 0) ms = 0;

        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const millis = Math.floor(ms % 1000);

        /* Pad seconds to 2 digits and milliseconds to 3 digits */
        const secStr = seconds.toString().padStart(2, '0');
        const msStr = millis.toString().padStart(3, '0');

        return `${minutes}:${secStr}.${msStr}`;
    },

    /**
     * Determine whether a point (x, y) lies inside a polygon using the
     * ray-casting algorithm.
     *
     * A horizontal ray is cast to the right from the test point.  Each time
     * it crosses an edge of the polygon the inside/outside flag toggles.
     *
     * @param {number}   x       - Test point X coordinate.
     * @param {number}   y       - Test point Y coordinate.
     * @param {Array<{x:number, y:number}>} polygon - Ordered vertices.
     * @returns {boolean} `true` if the point is inside the polygon.
     */
    pointInPolygon(x, y, polygon) {
        let inside = false;
        const n = polygon.length;

        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = polygon[i].x;
            const yi = polygon[i].y;
            const xj = polygon[j].x;
            const yj = polygon[j].y;

            /*
             * Check if the edge from vertex j → i straddles the test point's
             * Y coordinate, and if the intersection of the edge with the
             * horizontal ray falls to the right of the test point.
             */
            const intersect =
                ((yi > y) !== (yj > y)) &&
                (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);

            if (intersect) inside = !inside;
        }

        return inside;
    },

    /**
     * Check whether two line segments (p1–p2) and (p3–p4) intersect.
     *
     * Uses parametric form of lines and solves for parameters `t` and `u`.
     * Both must be in [0, 1] for the segments (not just the infinite lines)
     * to actually cross.
     *
     * @param {{x:number, y:number}} p1 - Start of segment A.
     * @param {{x:number, y:number}} p2 - End of segment A.
     * @param {{x:number, y:number}} p3 - Start of segment B.
     * @param {{x:number, y:number}} p4 - End of segment B.
     * @returns {{x:number, y:number}|null} Intersection point, or null.
     */
    segmentsIntersect(p1, p2, p3, p4) {
        const dx1 = p2.x - p1.x;
        const dy1 = p2.y - p1.y;
        const dx2 = p4.x - p3.x;
        const dy2 = p4.y - p3.y;

        /* Denominator of the parametric equations */
        const denom = dx1 * dy2 - dy1 * dx2;

        /* Parallel or coincident lines — no single intersection */
        if (Math.abs(denom) < 1e-10) return null;

        const dx3 = p3.x - p1.x;
        const dy3 = p3.y - p1.y;

        /* Parameter for segment A */
        const t = (dx3 * dy2 - dy3 * dx2) / denom;

        /* Parameter for segment B */
        const u = (dx3 * dy1 - dy3 * dx1) / denom;

        /* Both parameters must be within [0, 1] for a segment–segment hit */
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                x: p1.x + t * dx1,
                y: p1.y + t * dy1
            };
        }

        return null;
    },

    /**
     * Catmull-Rom spline interpolation over a closed loop of control points.
     *
     * Given N control points, this function produces a smooth, closed curve by
     * interpolating between each consecutive pair using the Catmull-Rom
     * formula. The curve automatically wraps: the segment from the last point
     * back to the first is included.
     *
     * The Catmull-Rom spline is C1 continuous (smooth tangents) and passes
     * through every control point, making it ideal for racing-track design.
     *
     * @param {Array<{x:number, y:number}>} points      - Control points.
     * @param {number}                       numSegments - Interpolated points
     *                                                      per span (higher =
     *                                                      smoother).
     * @returns {Array<{x:number, y:number}>} The interpolated curve.
     */
    catmullRomInterpolate(points, numSegments) {
        const result = [];
        const n = points.length;

        if (n < 2) return [...points];

        for (let i = 0; i < n; i++) {
            /*
             * For a closed loop we wrap indices:
             *   p0 = previous point  (i - 1, wrapping)
             *   p1 = current point   (i)
             *   p2 = next point      (i + 1, wrapping)
             *   p3 = next-next point (i + 2, wrapping)
             */
            const p0 = points[(i - 1 + n) % n];
            const p1 = points[i];
            const p2 = points[(i + 1) % n];
            const p3 = points[(i + 2) % n];

            for (let s = 0; s < numSegments; s++) {
                const t = s / numSegments;

                /*
                 * Catmull-Rom basis matrix (uniform, alpha = 0.5):
                 *
                 *   q(t) = 0.5 * [ (2*P1)
                 *                 + (-P0 + P2) * t
                 *                 + (2*P0 - 5*P1 + 4*P2 - P3) * t²
                 *                 + (-P0 + 3*P1 - 3*P2 + P3) * t³ ]
                 */
                const t2 = t * t;
                const t3 = t2 * t;

                const x = 0.5 * (
                    (2 * p1.x) +
                    (-p0.x + p2.x) * t +
                    (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
                    (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
                );

                const y = 0.5 * (
                    (2 * p1.y) +
                    (-p0.y + p2.y) * t +
                    (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
                    (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
                );

                result.push({ x, y });
            }
        }

        return result;
    }
};


/* =============================================================================
 * SECTION 2 — Game Configuration Constants
 * =============================================================================
 *
 * Central location for every tuneable parameter in the game.  Keeping these
 * values together makes balancing and tweaking straightforward.
 * =============================================================================*/

window.RacingGame.CONFIG = {

    /* ── Track Geometry ──────────────────────────────────────────────── */

    /** Width of the driveable road surface (pixels / world units). */
    TRACK_WIDTH: 140,

    /* ── Car Dimensions ──────────────────────────────────────────────── */

    /** Car body width (perpendicular to travel direction). */
    CAR_WIDTH: 22,

    /** Car body length (along travel direction). */
    CAR_LENGTH: 38,

    /* ── Race Rules ──────────────────────────────────────────────────── */

    /** Number of laps to complete the race. */
    TOTAL_LAPS: 3,

    /** Pre-race countdown duration in seconds (3-2-1-GO). */
    COUNTDOWN_DURATION: 3,

    /** Number of evenly-spaced checkpoint gates around the track. */
    NUM_CHECKPOINTS: 8,

    /* ── Camera ───────────────────────────────────────────────────────── */

    /**
     * Camera follow smoothing factor (0 = no follow, 1 = instant snap).
     * Lower values produce a more cinematic "lag" feel.
     */
    CAMERA_SMOOTHING: 0.08,

    /* ── Car Physics ─────────────────────────────────────────────────── */

    /** Maximum forward speed (world units per second). */
    MAX_SPEED: 350,

    /** Forward acceleration when throttle is held (units/s²). */
    ACCELERATION: 250,

    /** Deceleration when braking (units/s²). */
    BRAKE_FORCE: 400,

    /**
     * Per-frame speed multiplier applied when no input is given.
     * 0.97 means the car loses 3 % of its speed each frame to friction.
     */
    FRICTION: 0.97,

    /** Steering rotation speed (radians per second at full lock). */
    TURN_SPEED: 2.8,

    /* ── AI ───────────────────────────────────────────────────────────── */

    /**
     * Difficulty multipliers for the three AI opponents.
     * Applied to their target speed so each one is progressively faster.
     * Values < 1 make the AI slower than the theoretical maximum.
     */
    AI_DIFFICULTIES: [0.88, 0.93, 0.97]
};


/* =============================================================================
 * SECTION 3 — Color Palette
 * =============================================================================
 *
 * Neon-cyberpunk color scheme designed for high contrast on a dark background.
 * Every color used in the game should reference this palette to ensure visual
 * consistency and easy theming.
 * =============================================================================*/

window.RacingGame.COLORS = {

    /* ── Cars ─────────────────────────────────────────────────────────── */

    /** Player car highlight color (cyan neon). */
    PLAYER: '#00e5ff',

    /** AI car colors — one per opponent, ordered by difficulty index. */
    AI: ['#ff00e5', '#ffe500', '#ff6b00'],

    /* ── Track ────────────────────────────────────────────────────────── */

    /** Asphalt / road surface fill. */
    TRACK_SURFACE: '#2a2a2a',

    /** Outer boundary glow (cyan neon). */
    TRACK_BORDER_OUTER: '#00e5ff',

    /** Inner boundary glow (magenta neon). */
    TRACK_BORDER_INNER: '#ff00e5',

    /** Off-track grass area. */
    GRASS: '#0a1f0a',

    /** Canvas background (deep dark green/black). */
    BACKGROUND: '#050a05',

    /** Alternating curb stripe color 1 (red). */
    CURB_1: '#ff0040',

    /** Alternating curb stripe color 2 (white). */
    CURB_2: '#ffffff',

    /** Start / finish line color. */
    START_LINE: '#ffffff',

    /* ── HUD / UI ─────────────────────────────────────────────────────── */

    /** Heads-up display background (semi-transparent black). */
    HUD_BG: 'rgba(0,0,0,0.6)',

    /** Default HUD text color. */
    HUD_TEXT: '#ffffff',

    /** Accent color for highlighted HUD elements (matches player cyan). */
    HUD_ACCENT: '#00e5ff'
};
