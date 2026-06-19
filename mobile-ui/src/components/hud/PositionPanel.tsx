import { motion } from 'framer-motion';
import type { RaceState } from '../../types';

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

interface Props {
  race: RaceState;
}

export function PositionPanel({ race }: Props) {
  const posColor = race.position === 1 ? '#ffd700' : race.position === 2 ? '#c0c0c0' : race.position === 3 ? '#cd7f32' : '#fff';

  return (
    <motion.div
      className="glass-panel rounded-xl px-3 py-2 min-w-[100px]"
      initial={{ x: -30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-[9px] tracking-[0.2em] text-white/40 uppercase">Position</div>
      <div className="text-2xl font-black leading-none" style={{ color: posColor }}>
        {ordinal(race.position)}
      </div>
      <div className="text-[10px] text-neon-cyan mt-1 tracking-wider">
        LAP {race.lap}<span className="text-white/30">/{race.totalLaps}</span>
      </div>
    </motion.div>
  );
}
