import { motion } from 'framer-motion';
import type { RacerEntry } from '../../types';

interface Props {
  entries: RacerEntry[];
}

export function Leaderboard({ entries }: Props) {
  return (
    <motion.div
      className="glass-panel rounded-xl px-3 py-2 min-w-[130px]"
      initial={{ x: -30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <div className="text-[8px] tracking-[0.2em] text-white/35 uppercase mb-1.5">Standings</div>
      {entries.map((e, i) => (
        <motion.div
          key={e.name}
          className={`flex items-center justify-between gap-3 py-0.5 text-[10px] ${
            e.isPlayer ? 'text-neon-cyan font-bold' : 'text-white/70'
          }`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 + i * 0.05 }}
        >
          <span className="w-4 text-white/40">{e.position}</span>
          <span className="flex-1 truncate">{e.name}</span>
          <span className={`text-[9px] tabular-nums ${e.timeDiff.startsWith('+') ? 'text-red-400' : e.timeDiff.startsWith('-') ? 'text-green-400' : 'text-white/30'}`}>
            {e.timeDiff}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}
