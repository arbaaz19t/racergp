import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  progressPercent: number;
  checkpointAlert: string | null;
  positionChange: string | null;
}

export function RaceProgress({ progressPercent, checkpointAlert, positionChange }: Props) {
  const remaining = Math.max(0, 100 - progressPercent);

  return (
    <motion.div
      className="glass-panel rounded-xl px-4 py-2 w-full max-w-md"
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[8px] tracking-[0.2em] text-white/35 uppercase">Race Progress</span>
        <span className="text-[9px] text-neon-cyan tabular-nums">{remaining.toFixed(1)}% remaining</span>
      </div>

      <div className="h-2 bg-white/8 rounded-full overflow-hidden relative">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-neon-blue via-neon-cyan to-neon-orange"
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.3 }}
          style={{ boxShadow: '0 0 12px rgba(0,229,255,0.4)' }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/60"
          style={{ left: `${progressPercent}%`, boxShadow: '0 0 8px #fff' }}
        />
      </div>

      <div className="flex justify-center gap-4 mt-1.5 h-4">
        <AnimatePresence>
          {checkpointAlert && (
            <motion.span
              key="cp"
              className="text-[9px] font-bold text-neon-orange tracking-widest neon-text-orange"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              ✦ {checkpointAlert}
            </motion.span>
          )}
          {positionChange && (
            <motion.span
              key="pos"
              className={`text-[9px] font-bold tracking-widest ${positionChange.startsWith('▲') ? 'text-green-400' : 'text-red-400'}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              {positionChange}
            </motion.span>
          )}
          {progressPercent > 92 && (
            <motion.span
              key="finish"
              className="text-[9px] font-bold text-white tracking-widest animate-pulse"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              🏁 FINISH AHEAD
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
