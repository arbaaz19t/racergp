import { useEffect, useState } from 'react';
import { INITIAL_RACE } from '../data/mockData';
import type { RaceState } from '../types';

export function useRaceSimulation(active: boolean) {
  const [race, setRace] = useState<RaceState>(INITIAL_RACE);

  useEffect(() => {
    if (!active) return;

    const interval = setInterval(() => {
      setRace(prev => {
        const speedDelta = (Math.random() - 0.4) * 8;
        const newSpeed = Math.max(0, Math.min(320, prev.speedKmh + speedDelta));
        const newRpm = Math.floor(2000 + (newSpeed / 320) * 6000 + Math.random() * 200);
        const newGear = Math.min(6, Math.max(1, Math.floor(newSpeed / 55) + 1));
        const nitro = prev.nitroPercent > 0 && Math.random() > 0.97
          ? Math.max(0, prev.nitroPercent - 2)
          : Math.min(100, prev.nitroPercent + 0.3);

        let checkpointAlert = prev.checkpointAlert;
        let positionChange = prev.positionChange;
        if (Math.random() > 0.985) checkpointAlert = 'CHECKPOINT';
        if (Math.random() > 0.99) positionChange = Math.random() > 0.5 ? '▲ 3RD' : '▼ 2ND';

        return {
          ...prev,
          raceTimeMs: prev.raceTimeMs + 50,
          speedKmh: Math.round(newSpeed),
          rpm: newRpm,
          gear: newGear,
          nitroPercent: Math.round(nitro),
          boostPercent: Math.min(100, prev.boostPercent + (Math.random() > 0.5 ? 0.5 : -0.3)),
          progressPercent: Math.min(100, prev.progressPercent + 0.08),
          driftScore: prev.driftScore + (newSpeed > 120 && Math.random() > 0.7 ? Math.floor(Math.random() * 15) : 0),
          checkpointAlert,
          positionChange,
        };
      });
    }, 50);

    return () => clearInterval(interval);
  }, [active]);

  return race;
}
