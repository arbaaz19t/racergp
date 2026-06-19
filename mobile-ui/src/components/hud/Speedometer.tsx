import { motion, useSpring, useTransform, useMotionValueEvent } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Props {
  speedKmh: number;
  gear: number;
  rpm: number;
  nitroPercent: number;
  driftScore: number;
  boostPercent: number;
}

export function Speedometer({ speedKmh, gear, rpm, nitroPercent, driftScore, boostPercent }: Props) {
  const speedSpring = useSpring(speedKmh, { stiffness: 80, damping: 20 });
  const rpmSpring = useSpring(rpm, { stiffness: 100, damping: 25 });
  const [displaySpeed, setDisplaySpeed] = useState(speedKmh);
  const [rpmOffset, setRpmOffset] = useState(264);

  useEffect(() => { speedSpring.set(speedKmh); }, [speedKmh, speedSpring]);
  useEffect(() => { rpmSpring.set(rpm); }, [rpm, rpmSpring]);

  useMotionValueEvent(speedSpring, 'change', v => setDisplaySpeed(Math.round(v)));
  useMotionValueEvent(rpmSpring, 'change', v => {
    const pct = Math.min(1, v / 8000);
    setRpmOffset(264 - pct * 200);
  });

  const needleRotation = useTransform(speedSpring, [0, 320], [-135, 135]);

  return (
    <motion.div
      className="glass-panel rounded-2xl w-[150px] h-[150px] relative flex items-center justify-center"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <svg className="absolute inset-2" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle
          cx="50" cy="50" r="42" fill="none"
          stroke="url(#rpmGrad)" strokeWidth="4" strokeLinecap="round"
          strokeDasharray="264"
          strokeDashoffset={rpmOffset}
          transform="rotate(135 50 50)"
        />
        <defs>
          <linearGradient id="rpmGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2979ff" />
            <stop offset="60%" stopColor="#00e5ff" />
            <stop offset="100%" stopColor="#ff6d00" />
          </linearGradient>
        </defs>
      </svg>

      <motion.div
        className="absolute w-0.5 h-12 bg-white origin-bottom rounded-full"
        style={{ rotate: needleRotation, bottom: '50%', boxShadow: '0 0 6px rgba(255,255,255,0.8)' }}
      />

      <div className="relative z-10 text-center mt-4">
        <div className="text-3xl font-black tabular-nums neon-text-cyan leading-none">{displaySpeed}</div>
        <div className="text-[8px] tracking-[0.15em] text-white/40 mt-0.5">KM/H</div>
        <div className="text-xl font-bold text-neon-orange mt-1">{gear}</div>
        <div className="text-[7px] text-white/30 tracking-widest">GEAR</div>
      </div>

      <div className="absolute bottom-2 left-2 right-2 flex gap-1">
        <Gauge label="N2O" value={nitroPercent} color="#00e5ff" />
        <Gauge label="BST" value={boostPercent} color="#ff6d00" />
      </div>

      <div className="absolute top-2 right-2 text-right">
        <div className="text-[7px] text-white/30 tracking-wider">DRIFT</div>
        <div className="text-[10px] font-bold text-neon-orange tabular-nums">{driftScore}</div>
      </div>
    </motion.div>
  );
}

function Gauge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1">
      <div className="text-[6px] text-white/30 text-center">{label}</div>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden mt-0.5">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
          animate={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
