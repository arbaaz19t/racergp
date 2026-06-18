/**
 * physics.js — Boundaries, collisions, checkpoints with effect feedback.
 */
window.RacingGame = window.RacingGame || {};

(function () {
    'use strict';

    const Utils = window.RacingGame.Utils;

    const PUSH_BACK_STRENGTH = 2.0;
    const OFF_TRACK_DRAG = 0.95;
    const COLLISION_BOUNCE = 0.5;
    const COLLISION_PUSH_MULT = 0.6;

    class PhysicsEngine {
        constructor(trackRenderer) {
            this.track = trackRenderer;
            this.lastCollision = false;
            this.collisionIntensity = 0;
            this.collisionPoint = null;
            this._centerPoints = trackRenderer.getCenterPoints();
        }

        update(cars, dt) {
            this.lastCollision = false;
            this.collisionIntensity = 0;
            this.collisionPoint = null;

            for (const car of cars) this.checkBoundary(car);
            this.checkCarCollisions(cars);
        }

        checkBoundary(car) {
            const onTrack = this.track.isOnTrack(car.x, car.y);
            car.offTrack = !onTrack;

            if (!onTrack) {
                let bestDist = Infinity;
                let bestPt = null;
                for (const cp of this._centerPoints) {
                    const d = Utils.distance(car.x, car.y, cp.x, cp.y);
                    if (d < bestDist) { bestDist = d; bestPt = cp; }
                }
                if (bestPt) {
                    const dx = bestPt.x - car.x;
                    const dy = bestPt.y - car.y;
                    const dist = bestDist || 1;
                    car.x += (dx / dist) * PUSH_BACK_STRENGTH;
                    car.y += (dy / dist) * PUSH_BACK_STRENGTH;
                }
                car.speed *= OFF_TRACK_DRAG;
            }
        }

        checkCarCollisions(cars) {
            for (let i = 0; i < cars.length; i++) {
                for (let j = i + 1; j < cars.length; j++) {
                    const c1 = cars[i].getBoundingCircle();
                    const c2 = cars[j].getBoundingCircle();
                    const dx = c2.x - c1.x;
                    const dy = c2.y - c1.y;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
                    const minDist = c1.radius + c2.radius;

                    if (dist < minDist) {
                        const overlap = minDist - dist;
                        const nx = dx / dist;
                        const ny = dy / dist;
                        const push = overlap * COLLISION_PUSH_MULT;

                        cars[i].x -= nx * push * 0.5;
                        cars[i].y -= ny * push * 0.5;
                        cars[j].x += nx * push * 0.5;
                        cars[j].y += ny * push * 0.5;

                        const relSpeed = Math.abs(cars[i].speed - cars[j].speed);
                        const exchange = relSpeed * COLLISION_BOUNCE;
                        cars[i].speed -= exchange * 0.3;
                        cars[j].speed += exchange * 0.3;

                        this.lastCollision = true;
                        this.collisionIntensity = Math.min(1, overlap / 10 + relSpeed / 200);
                        this.collisionPoint = {
                            x: (cars[i].x + cars[j].x) / 2,
                            y: (cars[i].y + cars[j].y) / 2
                        };
                    }
                }
            }
        }

        checkCheckpoints(car) {
            if (car.finished) return null;

            const checkpoints = this.track.getCheckpoints();
            const numCP = checkpoints.length;
            const nextCP = car.currentCheckpoint % numCP;
            const cp = checkpoints[nextCP];

            if (car.prevX === undefined) return null;
            if (Utils.distance(car.prevX, car.prevY, car.x, car.y) < 0.1) return null;

            const intersection = Utils.segmentsIntersect(
                { x: car.prevX, y: car.prevY },
                { x: car.x, y: car.y },
                { x: cp.x1, y: cp.y1 },
                { x: cp.x2, y: cp.y2 }
            );

            if (intersection) {
                car.currentCheckpoint = (nextCP + 1) % numCP;
                car.totalCheckpointsPassed++;
                if (nextCP === 0 && car.totalCheckpointsPassed >= numCP) {
                    car.lap++;
                    return 'lap';
                }
                return 'checkpoint';
            }
            return null;
        }

        hadCollision() {
            const c = this.lastCollision;
            this.lastCollision = false;
            return c;
        }

        getCollisionData() {
            return {
                intensity: this.collisionIntensity,
                point: this.collisionPoint
            };
        }
    }

    window.RacingGame.PhysicsEngine = PhysicsEngine;
})();
