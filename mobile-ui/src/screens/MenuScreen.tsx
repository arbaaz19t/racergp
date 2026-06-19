import { motion } from 'framer-motion';

interface Props {
  onRace: () => void;
  onGarage: () => void;
}

export function MenuScreen({ onRace, onGarage }: Props) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #0a1830 0%, #050810 70%)' }}
    >
      {/* Animated grid floor */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1/2 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,229,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          transform: 'perspective(400px) rotateX(60deg)',
          transformOrigin: 'bottom',
        }}
        animate={{ backgroundPosition: ['0px 0px', '0px 40px'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center mb-8"
      >
        <h1 className="text-3xl font-black tracking-[0.25em] text-neon-cyan neon-text-cyan">NEON RACER</h1>
        <p className="text-[10px] tracking-[0.5em] text-neon-orange mt-2">PREMIUM MOBILE UI</p>
      </motion.div>

      <motion.div
        className="relative z-10 flex flex-col gap-3 w-48"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <MenuButton label="QUICK RACE" primary onClick={onRace} />
        <MenuButton label="GARAGE" onClick={onGarage} />
      </motion.div>

      <p className="absolute bottom-4 text-[8px] text-white/20 tracking-widest">
        LANDSCAPE MODE · TOUCH OPTIMIZED
      </p>
    </div>
  );
}

function MenuButton({ label, onClick, primary }: { label: string; onClick: () => void; primary?: boolean }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`py-3 rounded-xl text-xs font-bold tracking-[0.2em] border ${
        primary
          ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/10'
          : 'border-neon-orange/50 text-neon-orange bg-neon-orange/5'
      }`}
      whileHover={{ boxShadow: primary ? '0 0 24px rgba(0,229,255,0.3)' : '0 0 24px rgba(255,109,0,0.2)' }}
      whileTap={{ scale: 0.96 }}
    >
      {label}
    </motion.button>
  );
}
