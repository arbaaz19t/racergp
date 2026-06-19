import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HUD } from '../components/hud/HUD';
import { MobileControls } from '../components/controls/MobileControls';
import { useFPS } from '../hooks/useFPS';
import { useRaceSimulation } from '../hooks/useRaceSimulation';

interface Props {
  onBack: () => void;
  onGarage: () => void;
}

export function RaceScreen({ onBack, onGarage }: Props) {
  const fps = useFPS();
  const race = useRaceSimulation(true);
  const [paused, setPaused] = useState(false);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Animated race background */}
      <div className="absolute inset-0 bg-[#050810]">
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.12) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 80%, rgba(255,109,0,0.08) 0%, transparent 50%),
              linear-gradient(180deg, #0a1020 0%, #050810 100%)
            `,
          }}
        />
        {/* Motion blur road effect */}
        <motion.div
          className="absolute inset-0 opacity-10"
          animate={{ backgroundPosition: ['0px 0px', '0px 200px'] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(0,229,255,0.3) 40px, rgba(0,229,255,0.3) 42px)',
          }}
        />
      </div>

      <HUD race={race} fps={fps} onPause={() => setPaused(true)} />
      <MobileControls onChange={() => {}} />

      {/* Pause overlay */}
      <AnimatePresence>
        {paused && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="glass-panel rounded-2xl p-6 text-center pointer-events-auto"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
            >
              <h2 className="text-xl font-black tracking-widest text-neon-cyan mb-4">PAUSED</h2>
              <div className="flex flex-col gap-2">
                <PauseBtn label="RESUME" onClick={() => setPaused(false)} primary />
                <PauseBtn label="GARAGE" onClick={() => { setPaused(false); onGarage(); }} />
                <PauseBtn label="MAIN MENU" onClick={onBack} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PauseBtn({ label, onClick, primary }: { label: string; onClick: () => void; primary?: boolean }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`px-8 py-2.5 rounded-xl text-xs font-bold tracking-widest border ${
        primary
          ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/10'
          : 'border-white/20 text-white/60'
      }`}
      whileTap={{ scale: 0.95 }}
    >
      {label}
    </motion.button>
  );
}
