import { motion } from 'framer-motion';

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const mil = Math.floor((ms % 1000) / 10);
  return `${m}:${String(sec).padStart(2, '0')}.${String(mil).padStart(2, '0')}`;
}

interface Props {
  raceTimeMs: number;
  nitroPercent: number;
  fps: number;
  onPause: () => void;
}

export function TimerPanel({ raceTimeMs, nitroPercent, fps, onPause }: Props) {
  return (
    <motion.div
      className="flex items-start gap-2"
      initial={{ x: 30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="glass-panel rounded-xl px-3 py-2 text-right">
        <div className="text-[8px] tracking-[0.2em] text-white/35 uppercase">Race Time</div>
        <div className="text-lg font-bold tabular-nums neon-text-cyan">{formatTime(raceTimeMs)}</div>
        <div className="mt-1.5">
          <div className="flex justify-between text-[8px] text-white/40 mb-0.5">
            <span>NITRO</span>
            <span className="text-neon-cyan">{nitroPercent}%</span>
          </div>
          <div className="h-1 w-24 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-neon-blue to-neon-cyan"
              animate={{ width: `${nitroPercent}%` }}
              transition={{ duration: 0.2 }}
              style={{ boxShadow: '0 0 8px rgba(0,229,255,0.6)' }}
            />
          </div>
        </div>
        <div className="text-[8px] text-white/25 mt-1 tabular-nums">{fps} FPS</div>
      </div>

      <motion.button
        type="button"
        onClick={onPause}
        className="glass-panel rounded-xl w-10 h-10 flex items-center justify-center text-neon-cyan text-sm"
        whileTap={{ scale: 0.9 }}
        whileHover={{ boxShadow: '0 0 20px rgba(0,229,255,0.3)' }}
        aria-label="Pause"
      >
        ⏸
      </motion.button>
    </motion.div>
  );
}
