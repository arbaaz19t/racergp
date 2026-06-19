import { motion } from 'framer-motion';
import { MINIMAP_POINTS } from '../../data/mockData';

interface Props {
  playerProgress: number;
  opponents: { x: number; y: number; color: string }[];
}

export function Minimap({ playerProgress, opponents }: Props) {
  const idx = Math.floor((playerProgress / 100) * (MINIMAP_POINTS.length - 1));
  const player = MINIMAP_POINTS[Math.min(idx, MINIMAP_POINTS.length - 1)];

  return (
    <motion.div
      className="glass-panel rounded-full w-[110px] h-[110px] relative overflow-hidden"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ boxShadow: '0 0 24px rgba(0,229,255,0.15), inset 0 0 20px rgba(0,229,255,0.05)' }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id="mapGlow">
            <stop offset="0%" stopColor="rgba(0,229,255,0.15)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="url(#mapGlow)" />
        <polyline
          points={MINIMAP_POINTS.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="rgba(0,229,255,0.35)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <polyline
          points={MINIMAP_POINTS.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="6"
        />
        {MINIMAP_POINTS.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="rgba(255,109,0,0.5)" />
        ))}
        {opponents.map((o, i) => (
          <circle key={i} cx={o.x} cy={o.y} r="2.5" fill={o.color} opacity={0.8} />
        ))}
        <circle cx={player.x} cy={player.y} r="4" fill="#00e5ff">
          <animate attributeName="r" values="3.5;4.5;3.5" dur="1.5s" repeatCount="indefinite" />
        </circle>
      </svg>
      <div className="absolute bottom-1 left-0 right-0 text-center text-[7px] tracking-widest text-white/30 uppercase">
        Map
      </div>
    </motion.div>
  );
}
