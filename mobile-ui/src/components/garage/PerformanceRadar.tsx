import { motion } from 'framer-motion';
import type { CarStats } from '../../types';

interface Props {
  current: CarStats;
  upgraded: CarStats;
}

const LABELS: (keyof CarStats)[] = ['topSpeed', 'acceleration', 'handling', 'drift', 'braking'];
const DISPLAY: Record<keyof CarStats, string> = {
  topSpeed: 'TOP SPEED',
  acceleration: 'ACCEL',
  handling: 'HANDLING',
  drift: 'DRIFT',
  braking: 'BRAKING',
};

export function PerformanceRadar({ current, upgraded }: Props) {
  const cx = 80, cy = 80, r = 55;
  const angles = LABELS.map((_, i) => (Math.PI * 2 * i) / LABELS.length - Math.PI / 2);

  const toPoints = (stats: CarStats) =>
    LABELS.map((key, i) => {
      const val = stats[key] / 100;
      return {
        x: cx + Math.cos(angles[i]) * r * val,
        y: cy + Math.sin(angles[i]) * r * val,
      };
    });

  const currentPts = toPoints(current);
  const upgradedPts = toPoints(upgraded);

  const polyStr = (pts: { x: number; y: number }[]) => pts.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <motion.div
      className="glass-panel glass-orange rounded-2xl p-3 h-full flex flex-col"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
    >
      <div className="text-[8px] tracking-[0.2em] text-neon-orange uppercase mb-2">Performance</div>

      <svg viewBox="0 0 160 160" className="w-full flex-1">
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1].map(ring => (
          <polygon
            key={ring}
            points={angles.map(a => `${cx + Math.cos(a) * r * ring},${cy + Math.sin(a) * r * ring}`).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.5"
          />
        ))}
        {/* Axis lines */}
        {angles.map((a, i) => (
          <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(a) * r} y2={cy + Math.sin(a) * r}
            stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
        ))}
        {/* Upgraded (ghost) */}
        <motion.polygon
          points={polyStr(upgradedPts)}
          fill="rgba(255,109,0,0.12)"
          stroke="#ff6d00"
          strokeWidth="1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        />
        {/* Current */}
        <motion.polygon
          points={polyStr(currentPts)}
          fill="rgba(0,229,255,0.15)"
          stroke="#00e5ff"
          strokeWidth="2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
        {/* Labels */}
        {LABELS.map((key, i) => {
          const lx = cx + Math.cos(angles[i]) * (r + 14);
          const ly = cy + Math.sin(angles[i]) * (r + 14);
          const diff = upgraded[key] - current[key];
          return (
            <g key={key}>
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                fill="rgba(255,255,255,0.45)" fontSize="5" fontFamily="system-ui">
                {DISPLAY[key]}
              </text>
              {diff > 0 && (
                <text x={lx} y={ly + 7} textAnchor="middle" fill="#ff6d00" fontSize="5" fontWeight="bold">
                  +{diff}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="flex justify-center gap-4 mt-1 text-[7px]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neon-cyan inline-block" /> Current</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-neon-orange inline-block" /> Upgraded</span>
      </div>
    </motion.div>
  );
}
