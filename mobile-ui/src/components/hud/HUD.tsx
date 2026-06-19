import { PositionPanel } from './PositionPanel';
import { Leaderboard } from './Leaderboard';
import { TimerPanel } from './TimerPanel';
import { Minimap } from './Minimap';
import { Speedometer } from './Speedometer';
import { RaceProgress } from './RaceProgress';
import type { RaceState } from '../../types';

interface Props {
  race: RaceState;
  fps: number;
  onPause: () => void;
}

export function HUD({ race, fps, onPause }: Props) {
  const opponents = [
    { x: 70, y: 50, color: '#ff00e5' },
    { x: 45, y: 70, color: '#ffe500' },
    { x: 30, y: 55, color: '#ff6b00' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none z-20 p-3 safe-area">
      {/* Top Left */}
      <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-auto">
        <PositionPanel race={race} />
        <Leaderboard entries={race.leaderboard} />
      </div>

      {/* Top Right */}
      <div className="absolute top-3 right-3 pointer-events-auto">
        <TimerPanel
          raceTimeMs={race.raceTimeMs}
          nitroPercent={race.nitroPercent}
          fps={fps}
          onPause={onPause}
        />
      </div>

      {/* Bottom Left */}
      <div className="absolute bottom-20 left-3 pointer-events-auto">
        <Minimap playerProgress={race.progressPercent} opponents={opponents} />
      </div>

      {/* Bottom Right */}
      <div className="absolute bottom-16 right-3 pointer-events-auto">
        <Speedometer
          speedKmh={race.speedKmh}
          gear={race.gear}
          rpm={race.rpm}
          nitroPercent={race.nitroPercent}
          driftScore={race.driftScore}
          boostPercent={race.boostPercent}
        />
      </div>

      {/* Bottom Center */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[55%] pointer-events-auto">
        <RaceProgress
          progressPercent={race.progressPercent}
          checkpointAlert={race.checkpointAlert}
          positionChange={race.positionChange}
        />
      </div>
    </div>
  );
}
