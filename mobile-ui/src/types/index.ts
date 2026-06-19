export interface RacerEntry {
  position: number;
  name: string;
  timeDiff: string;
  isPlayer?: boolean;
}

export interface RaceState {
  position: number;
  lap: number;
  totalLaps: number;
  raceTimeMs: number;
  nitroPercent: number;
  speedKmh: number;
  gear: number;
  rpm: number;
  driftScore: number;
  boostPercent: number;
  progressPercent: number;
  checkpointAlert: string | null;
  positionChange: string | null;
  leaderboard: RacerEntry[];
}

export type GarageCategory =
  | 'front_bumper' | 'rear_bumper' | 'side_skirts' | 'hood' | 'spoiler'
  | 'wheels' | 'suspension' | 'engine' | 'transmission' | 'turbo'
  | 'brakes' | 'paint' | 'vinyls' | 'exhaust';

export interface PartCard {
  id: string;
  category: GarageCategory;
  name: string;
  price: number;
  image: string;
  stats: { speed: number; accel: number; handling: number; drift: number; braking: number };
  equipped: boolean;
}

export interface CarStats {
  topSpeed: number;
  acceleration: number;
  handling: number;
  drift: number;
  braking: number;
}

export type Screen = 'race' | 'garage' | 'menu';
