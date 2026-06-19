import type { PartCard, RaceState, CarStats } from '../types';

export const INITIAL_RACE: RaceState = {
  position: 2,
  lap: 2,
  totalLaps: 6,
  raceTimeMs: 83420,
  nitroPercent: 72,
  speedKmh: 187,
  gear: 4,
  rpm: 6800,
  driftScore: 1240,
  boostPercent: 45,
  progressPercent: 58,
  checkpointAlert: null,
  positionChange: null,
  leaderboard: [
    { position: 1, name: 'BLAZE', timeDiff: '+1.24', isPlayer: false },
    { position: 2, name: 'YOU', timeDiff: '—', isPlayer: true },
    { position: 3, name: 'PHANTOM', timeDiff: '-0.87', isPlayer: false },
    { position: 4, name: 'VOLT', timeDiff: '-2.15', isPlayer: false },
  ],
};

export const BASE_STATS: CarStats = {
  topSpeed: 72,
  acceleration: 68,
  handling: 75,
  drift: 60,
  braking: 70,
};

export const UPGRADED_STATS: CarStats = {
  topSpeed: 88,
  acceleration: 82,
  handling: 78,
  drift: 74,
  braking: 76,
};

export const GARAGE_PARTS: PartCard[] = [
  { id: 'fb1', category: 'front_bumper', name: 'Aero Splitter', price: 4500, image: '🔧', stats: { speed: 2, accel: 0, handling: 3, drift: 0, braking: 0 }, equipped: false },
  { id: 'sp1', category: 'spoiler', name: 'GT Wing Pro', price: 8200, image: '🏎️', stats: { speed: 5, accel: 0, handling: 6, drift: 4, braking: 0 }, equipped: true },
  { id: 'wh1', category: 'wheels', name: 'Carbon Rims', price: 12000, image: '⭕', stats: { speed: 0, accel: 2, handling: 8, drift: 6, braking: 3 }, equipped: false },
  { id: 'en1', category: 'engine', name: 'Twin Turbo V8', price: 28000, image: '⚡', stats: { speed: 12, accel: 15, handling: -2, drift: 0, braking: 0 }, equipped: false },
  { id: 'tu1', category: 'turbo', name: 'Nitro Injector', price: 15000, image: '💨', stats: { speed: 8, accel: 10, handling: 0, drift: 0, braking: 0 }, equipped: false },
  { id: 'pa1', category: 'paint', name: 'Neon Cyan', price: 3500, image: '🎨', stats: { speed: 0, accel: 0, handling: 0, drift: 0, braking: 0 }, equipped: true },
];

export const MINIMAP_POINTS = [
  { x: 20, y: 80 }, { x: 35, y: 60 }, { x: 55, y: 45 }, { x: 75, y: 40 },
  { x: 90, y: 55 }, { x: 85, y: 75 }, { x: 65, y: 90 }, { x: 40, y: 85 },
];
