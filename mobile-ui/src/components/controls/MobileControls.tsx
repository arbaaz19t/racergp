import { motion } from 'framer-motion';
import { useCallback, useRef, useState } from 'react';

export interface ControlState {
  steer: number;
  throttle: boolean;
  brake: boolean;
  handbrake: boolean;
  nitro: boolean;
}

interface Props {
  onChange: (state: ControlState) => void;
}

function HapticButton({
  label, icon, color, active, onDown, onUp, className = '',
}: {
  label: string; icon: string; color: string;
  active: boolean; onDown: () => void; onUp: () => void; className?: string;
}) {
  return (
    <motion.button
      type="button"
      className={`relative rounded-2xl flex flex-col items-center justify-center gap-0.5 border ${className}`}
      style={{
        borderColor: active ? color : 'rgba(0,229,255,0.2)',
        background: active ? `${color}22` : 'rgba(8,12,20,0.55)',
        boxShadow: active ? `0 0 24px ${color}55, inset 0 0 12px ${color}22` : 'none',
      }}
      onTouchStart={(e) => { e.preventDefault(); onDown(); }}
      onTouchEnd={(e) => { e.preventDefault(); onUp(); }}
      onMouseDown={onDown}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      whileTap={{ scale: 0.92 }}
      animate={active ? { scale: [1, 0.95, 1] } : {}}
      transition={{ duration: 0.15 }}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-[7px] tracking-widest font-bold" style={{ color: active ? color : 'rgba(255,255,255,0.4)' }}>
        {label}
      </span>
      {active && (
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 pointer-events-none"
          style={{ borderColor: color }}
          initial={{ opacity: 0.8, scale: 1 }}
          animate={{ opacity: 0, scale: 1.15 }}
          transition={{ duration: 0.4 }}
        />
      )}
    </motion.button>
  );
}

export function MobileControls({ onChange }: Props) {
  const [throttle, setThrottle] = useState(false);
  const [brake, setBrake] = useState(false);
  const [handbrake, setHandbrake] = useState(false);
  const [nitro, setNitro] = useState(false);
  const [steer, setSteer] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);

  const emit = useCallback((patch: Partial<ControlState>) => {
    onChange({
      steer,
      throttle,
      brake,
      handbrake,
      nitro,
      ...patch,
    });
  }, [steer, throttle, brake, handbrake, nitro, onChange]);

  const handleSteer = (dir: -1 | 0 | 1) => {
    setSteer(dir);
    emit({ steer: dir });
  };

  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      {/* Left — Steering */}
      <div className="absolute bottom-4 left-4 flex items-end gap-2 pointer-events-auto">
        <div className="flex gap-2">
          <HapticButton
            label="LEFT" icon="◀" color="#00e5ff"
            active={steer < 0}
            onDown={() => handleSteer(-1)}
            onUp={() => handleSteer(0)}
            className="w-16 h-16"
          />
          <HapticButton
            label="RIGHT" icon="▶" color="#00e5ff"
            active={steer > 0}
            onDown={() => handleSteer(1)}
            onUp={() => handleSteer(0)}
            className="w-16 h-16"
          />
        </div>

        {/* Virtual steering wheel */}
        <motion.div
          ref={wheelRef}
          className="glass-panel rounded-full w-20 h-20 flex items-center justify-center relative ml-1"
          style={{ rotate: steer * 25 }}
          animate={{ rotate: steer * 25 }}
        >
          <div className="w-14 h-14 rounded-full border-2 border-neon-cyan/40 relative">
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-3 bg-neon-cyan rounded-full" />
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-neon-orange rounded-full" />
          </div>
        </motion.div>
      </div>

      {/* Right — Pedals */}
      <div className="absolute bottom-4 right-4 grid grid-cols-2 gap-2 pointer-events-auto">
        <HapticButton
          label="DRIFT" icon="⬡" color="#ffe500"
          active={handbrake}
          onDown={() => { setHandbrake(true); emit({ handbrake: true }); }}
          onUp={() => { setHandbrake(false); emit({ handbrake: false }); }}
          className="w-14 h-12 col-span-1"
        />
        <HapticButton
          label="NITRO" icon="⚡" color="#00e5ff"
          active={nitro}
          onDown={() => { setNitro(true); emit({ nitro: true }); }}
          onUp={() => { setNitro(false); emit({ nitro: false }); }}
          className="w-14 h-12 col-span-1"
        />
        <HapticButton
          label="BRAKE" icon="■" color="#ff4444"
          active={brake}
          onDown={() => { setBrake(true); emit({ brake: true }); }}
          onUp={() => { setBrake(false); emit({ brake: false }); }}
          className="w-16 h-16"
        />
        <HapticButton
          label="GAS" icon="▲" color="#44ff88"
          active={throttle}
          onDown={() => { setThrottle(true); emit({ throttle: true }); }}
          onUp={() => { setThrottle(false); emit({ throttle: false }); }}
          className="w-16 h-16"
        />
      </div>
    </div>
  );
}
